/**
 * 최종 HTML 안에 인라인으로 들어가는 런타임 스크립트.
 * 외부 의존성이 전혀 없어야 하고(오프라인에서 file:// 로 열어도 동작),
 * `</` + `script>` 문자열을 포함하면 안 된다.
 *
 * 설정값은 window.__DOC__ 로 주입된다.
 */
export const DOCUMENT_SCRIPT = String.raw`
(function () {
  var cfg = window.__DOC__ || {};
  var doc = document;

  /* ---------------- 코드 복사 버튼 ---------------- */
  function initCopyButtons() {
    if (!cfg.copyButton) return;
    var blocks = doc.querySelectorAll(".md-code");

    for (var i = 0; i < blocks.length; i++) {
      (function (block) {
        var code = block.querySelector("pre code");
        if (!code) return;

        var btn = doc.createElement("button");
        btn.type = "button";
        btn.className = "md-copy";
        btn.textContent = "복사";
        btn.setAttribute("aria-label", "코드 블록 복사");
        block.insertBefore(btn, block.firstChild);

        var timer = null;
        btn.addEventListener("click", function () {
          var text = code.textContent || "";

          function done(ok) {
            btn.textContent = ok ? "완료" : "실패";
            btn.classList.add("is-done");
            if (timer) clearTimeout(timer);
            timer = setTimeout(function () {
              btn.textContent = "복사";
              btn.classList.remove("is-done");
            }, 1000);
          }

          function legacyCopy() {
            var ta = doc.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.top = "-1000px";
            ta.style.opacity = "0";
            doc.body.appendChild(ta);
            ta.select();
            var ok = false;
            try {
              ok = doc.execCommand("copy");
            } catch (err) {
              ok = false;
            }
            doc.body.removeChild(ta);
            return ok;
          }

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(
              function () { done(true); },
              function () { done(legacyCopy()); }
            );
          } else {
            done(legacyCopy());
          }
        });
      })(blocks[i]);
    }
  }

  /* ---------------- 읽기 진행률 ---------------- */
  function initProgress() {
    if (!cfg.progress) return;
    var bar = doc.querySelector(".doc-progress > i");
    if (!bar) return;
    var ticking = false;

    function update() {
      var el = doc.documentElement;
      var max = (el.scrollHeight || 0) - (el.clientHeight || 0);
      var ratio = max > 0 ? (el.scrollTop || doc.body.scrollTop || 0) / max : 0;
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
      bar.style.width = (ratio * 100).toFixed(2) + "%";
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* ---------------- 목차: 현재 섹션 강조 ---------------- */
  function initActiveHeading(links, order) {
    var ids = [];
    var headings = [];
    for (var n = 0; n < order.length; n++) {
      var h = doc.getElementById(order[n]);
      if (h) { ids.push(order[n]); headings.push(h); }
    }
    if (!headings.length) return;

    var current = null;
    function setActive(id) {
      if (id === current) return;
      if (current && links[current]) links[current].classList.remove("is-active");
      current = id;
      if (id && links[id]) {
        links[id].classList.add("is-active");
        var link = links[id];
        var nav = doc.querySelector(".doc-sidebar");
        if (nav && nav.scrollHeight > nav.clientHeight) {
          var top = link.offsetTop;
          if (top < nav.scrollTop || top > nav.scrollTop + nav.clientHeight - 40) {
            nav.scrollTop = top - nav.clientHeight / 2;
          }
        }
      }
    }

    function pick() {
      if (doc.documentElement.clientHeight === 0) return;
      var best = null;
      for (var i = 0; i < headings.length; i++) {
        var rect = headings[i].getBoundingClientRect();
        if (rect.top <= 140) best = ids[i];
        else break;
      }
      if (!best) {
        // 첫 제목보다 위에 있으면 뷰포트 안의 첫 제목을 선택한다.
        for (var j = 0; j < headings.length; j++) {
          if (headings[j].getBoundingClientRect().bottom > 0) { best = ids[j]; break; }
        }
      }
      setActive(best);
    }

    if (typeof IntersectionObserver === "function") {
      var observer = new IntersectionObserver(pick, {
        rootMargin: "-80px 0px -60% 0px",
        threshold: [0, 1]
      });
      for (var k = 0; k < headings.length; k++) observer.observe(headings[k]);
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        if (doc.documentElement.clientHeight > 0) {
          pick();
        }
        ticking = false;
      });
    }, { passive: true });

    pick();
  }

  /* ---------------- 목차: 검색 / 이동 / 모바일 메뉴 ---------------- */
  function initToc() {
    var sidebar = doc.getElementById("doc-sidebar");
    if (!sidebar) return;

    var links = {};
    var order = [];
    var anchors = sidebar.querySelectorAll(".doc-toc a");
    for (var i = 0; i < anchors.length; i++) {
      var href = anchors[i].getAttribute("href") || "";
      if (href.charAt(0) !== "#") continue;
      var id = decodeURIComponent(href.slice(1));
      links[id] = anchors[i];
      order.push(id);
    }

    /* 검색 */
    var search = doc.getElementById("doc-search");
    var empty = doc.querySelector(".doc-toc-empty");
    if (search) {
      search.addEventListener("input", function () {
        var q = search.value.trim().toLowerCase().replace(/\s+/g, "");
        var items = sidebar.querySelectorAll(".doc-toc li");
        var visible = 0;
        for (var j = 0; j < items.length; j++) {
          var text = (items[j].getAttribute("data-text") || "").toLowerCase().replace(/\s+/g, "");
          var hit = !q || text.indexOf(q) !== -1;
          items[j].classList.toggle("is-hidden", !hit);
          if (hit) visible++;
        }
        if (empty) empty.classList.toggle("is-shown", visible === 0);
      });
      search.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { search.value = ""; search.dispatchEvent(new Event("input")); }
      });
    }

    /* 모바일 슬라이드 메뉴 */
    var menuBtn = doc.querySelector(".doc-menu-btn");
    var backdrop = doc.querySelector(".doc-backdrop");

    function setOpen(open) {
      sidebar.classList.toggle("is-open", open);
      if (backdrop) backdrop.classList.toggle("is-shown", open);
      if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) sidebar.focus();
    }

    if (menuBtn) {
      menuBtn.addEventListener("click", function () {
        setOpen(!sidebar.classList.contains("is-open"));
      });
    }
    if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
        setOpen(false);
        if (menuBtn) menuBtn.focus();
      }
    });

    /* 목차 클릭 시 모바일 메뉴 닫기 + 부드러운 스크롤 (상위 창 이동 방지) */
    sidebar.addEventListener("click", function (e) {
      var target = e.target;
      while (target && target !== sidebar && target.tagName !== "A") target = target.parentNode;
      if (target && target.tagName === "A") {
        var href = target.getAttribute("href");
        if (href && href.charAt(0) === "#") {
          e.preventDefault();
          e.stopPropagation();
          var id = decodeURIComponent(href.slice(1));
          var elem = id ? doc.getElementById(id) : null;
          if (elem) {
            elem.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
        setOpen(false);
      }
    });

    initActiveHeading(links, order);
  }

  /* ---------------- 텍스트 선택 (AI 질문 툴팁용) ---------------- */
  function initSelectionHandler() {
    function notifySelection() {
      var sel = window.getSelection ? window.getSelection() : null;
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        window.parent.postMessage({ type: "md2notion:selection", text: "" }, "*");
        return;
      }
      var text = sel.toString().trim();
      if (text.length > 0) {
        var range = sel.getRangeAt(0);
        var rect = range.getBoundingClientRect();
        window.parent.postMessage({
          type: "md2notion:selection",
          text: text,
          rect: {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height
          }
        }, "*");
      }
    }

    doc.addEventListener("mouseup", function () {
      setTimeout(notifySelection, 10);
    });

    doc.addEventListener("selectionchange", function () {
      if (!window.getSelection || window.getSelection().isCollapsed) {
        window.parent.postMessage({ type: "md2notion:selection", text: "" }, "*");
      }
    });
  }

  /* ---------------- 인쇄 ---------------- */
  function initPrint() {
    var btn = doc.querySelector(".doc-print-btn");
    if (btn) btn.addEventListener("click", function () { window.print(); });
    // 변환기 미리보기 화면에서 인쇄를 요청할 때 사용
    window.addEventListener("message", function (e) {
      if (e && e.data && e.data.type === "md2notion:print") window.print();
    });
  }

  /* ---------------- 실시간 설정 업데이트 (iframe 깜빡임 방지) ---------------- */
  function initLiveSettingsUpdate() {
    window.addEventListener("message", function (e) {
      if (!e || !e.data || e.data.type !== "md2notion:updateSettings") return;
      var s = e.data.settings;
      if (!s) return;

      if (s.docTitle !== undefined) {
        var sTitle = doc.querySelector(".doc-sidebar-title");
        if (sTitle) sTitle.textContent = s.docTitle;
        var tTitle = doc.querySelector(".doc-topbar-title");
        if (tTitle) tTitle.textContent = s.docTitle;
        doc.title = s.docTitle;
      }

      if (s.maxWidth !== undefined) {
        doc.documentElement.style.setProperty("--doc-max-width", s.maxWidth + "px");
      }

      if (s.fontSize !== undefined) {
        doc.documentElement.style.setProperty("--doc-font-size", s.fontSize + "px");
      }

      if (s.showToc !== undefined) {
        doc.body.classList.toggle("no-toc", !s.showToc);
      }

      if (s.showProgress !== undefined) {
        doc.body.classList.toggle("no-progress", !s.showProgress);
      }

      if (s.showPrintButton !== undefined) {
        doc.body.classList.toggle("no-print-btn", !s.showPrintButton);
      }
    });
  }

  /* ---------------- 모든 내장 앵커 링크 (#) 스크롤 처리 ---------------- */
  function initAnchorNavigation() {
    doc.addEventListener("click", function (e) {
      var target = e.target;
      while (target && target !== doc.body && target.tagName !== "A") {
        target = target.parentNode;
      }
      if (!target || target.tagName !== "A") return;

      var href = target.getAttribute("href");
      if (href && href.charAt(0) === "#") {
        e.preventDefault();
        e.stopPropagation();
        var id = decodeURIComponent(href.slice(1));
        var elem = id ? doc.getElementById(id) : null;
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  /* ---------------- 스크롤 위치 연동 ---------------- */
  function initScrollSync() {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var el = doc.documentElement;
        if (el.clientHeight === 0) {
          ticking = false;
          return;
        }
        var max = (el.scrollHeight || 0) - (el.clientHeight || 0);
        var ratio = max > 0 ? (el.scrollTop || doc.body.scrollTop || 0) / max : 0;
        window.parent.postMessage({ type: "md2notion:scrollRatio", ratio: ratio }, "*");
        ticking = false;
      });
    }, { passive: true });

    function safeScrollToHeading(id, retries) {
      if (retries === undefined) retries = 10;
      var elem = doc.getElementById(id);
      if (!elem && retries > 0) {
        setTimeout(function() { safeScrollToHeading(id, retries - 1); }, 30);
        return;
      }
      if (elem) {
        var containerHeight = doc.documentElement.clientHeight || doc.body.clientHeight || 0;
        if (containerHeight === 0 && retries > 0) {
          setTimeout(function() { safeScrollToHeading(id, retries - 1); }, 30);
          return;
        }
        elem.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }

    function safeScrollToRatio(ratio, retries) {
      if (retries === undefined) retries = 10;
      var el = doc.documentElement;
      var max = (el.scrollHeight || 0) - (el.clientHeight || 0);
      if (max <= 0 && retries > 0) {
        setTimeout(function() { safeScrollToRatio(ratio, retries - 1); }, 30);
        return;
      }
      var targetY = ratio * max;
      window.scrollTo({ top: targetY, behavior: "instant" });
    }

    window.addEventListener("message", function (e) {
      if (!e || !e.data) return;
      if (e.data.type === "md2notion:scrollToHeading" && e.data.id) {
        safeScrollToHeading(e.data.id);
        return;
      }
      if (e.data.type === "md2notion:scrollToRatio" && typeof e.data.ratio === "number") {
        safeScrollToRatio(e.data.ratio);
      }
    });
  }

  /* ---------------- 모든 단계(H1~H6, ###, #### 등) 제목 위치 실시간 추적 ---------------- */
  function initAllHeadingsTracker() {
    var currentHeadingId = null;

    function pickHeading() {
      if (doc.documentElement.clientHeight === 0) return;
      var allHeadings = doc.querySelectorAll(".doc-article .md-heading");
      if (!allHeadings || !allHeadings.length) return;

      var bestId = null;
      for (var i = 0; i < allHeadings.length; i++) {
        var rect = allHeadings[i].getBoundingClientRect();
        if (rect.top <= 160) {
          bestId = allHeadings[i].id;
        } else {
          break;
        }
      }

      if (!bestId && allHeadings[0]) {
        bestId = allHeadings[0].id;
      }

      if (bestId && bestId !== currentHeadingId) {
        currentHeadingId = bestId;
        window.parent.postMessage({ type: "md2notion:activeHeading", id: bestId }, "*");
      }
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        if (doc.documentElement.clientHeight > 0) {
          pickHeading();
        }
        ticking = false;
      });
    }, { passive: true });

    pickHeading();
  }

  function boot() {
    initCopyButtons();
    initProgress();
    initToc();
    initPrint();
    initSelectionHandler();
    initLiveSettingsUpdate();
    initAnchorNavigation();
    initScrollSync();
    initAllHeadingsTracker();
    window.parent.postMessage({ type: "md2notion:ready" }, "*");
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
`.trim();
