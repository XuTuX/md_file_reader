import createDOMPurify, { type DOMPurify } from "dompurify";

/** 실행 가능한 콘텐츠를 만들 수 있는 태그는 전부 차단한다. */
const FORBID_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "applet",
  "frame",
  "frameset",
  "form",
  "base",
  "link",
  "meta",
  "style",
  "noscript",
  "template",
];

/** 인라인 이벤트 핸들러는 DOMPurify 가 기본 차단하지만, 명시적으로 한 번 더 막는다. */
const FORBID_ATTR = [
  "style",
  "srcdoc",
  "formaction",
  "ping",
  "onerror",
  "onload",
  "onclick",
  "onmouseover",
  "onfocus",
  "onanimationend",
];

let purifier: DOMPurify | null = null;

function getPurifier(): DOMPurify {
  if (purifier) return purifier;

  // 브라우저 / jsdom 어느 쪽이든 전역 window 를 사용한다.
  purifier = createDOMPurify(window);

  purifier.addHook("afterSanitizeAttributes", (node) => {
    if (!(node instanceof Element)) return;

    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? "";
      // 문서 내부 앵커가 아닌 외부 링크는 새 탭 + opener 차단
      if (/^(https?:)?\/\//i.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    }

    if (node.tagName === "IMG") {
      node.setAttribute("loading", "lazy");
      node.setAttribute("decoding", "async");
    }
  });

  return purifier;
}

/**
 * Markdown 에서 생성된 HTML 을 책 본문 DOM에 넣기 전에 반드시 통과시킨다.
 * script / iframe / object / embed / 인라인 이벤트 핸들러 / javascript: URL 을 제거한다.
 */
export function sanitizeHtml(dirty: string): string {
  return getPurifier().sanitize(dirty, {
    FORBID_TAGS,
    FORBID_ATTR,
    ADD_ATTR: ["target", "id", "class", "colspan", "rowspan", "start", "align"],
    ALLOW_DATA_ATTR: true,
    USE_PROFILES: { html: true },
    RETURN_TRUSTED_TYPE: false,
  }) as unknown as string;
}
