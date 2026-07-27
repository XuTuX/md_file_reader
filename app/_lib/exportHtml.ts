import { escapeHtml, filterToc, type TocItem } from "./markdown";
import { buildDocumentCss } from "./documentCss";
import { DOCUMENT_SCRIPT } from "./documentScript";
import type { Settings } from "./settings";

export interface BuildHtmlInput {
  /** sanitize 를 이미 통과한 본문 HTML */
  bodyHtml: string;
  toc: TocItem[];
  settings: Settings;
  /** 원본 Markdown. 최종 HTML 안에 원문 그대로 보존하기 위해 사용한다. */
  markdown: string;
}

/**
 * `HOW_TO_BUILD.md` -> `HOW_TO_BUILD.html`
 * 확장자가 없거나 다른 경우에도 항상 `.html` 로 끝나는 안전한 파일명을 만든다.
 */
function stripInvalid(value: string): string {
  const forbidden = '<>:"|?*';
  let out = "";
  for (const ch of value) {
    if (forbidden.includes(ch)) continue;
    if (ch.charCodeAt(0) < 32) continue;
    out += ch;
  }
  return out;
}

export function toHtmlFileName(source: string): string {
  const trimmed = (source ?? "").trim();
  // 경로 구분자와 파일명에 쓸 수 없는 문자를 제거한다.
  const base = stripInvalid(trimmed.replace(/^.*[\\/]/, ""))
    .replace(/\.(md|markdown|mdown|mkd|html?)$/i, "")
    .replace(/\.+$/, "")
    .trim();

  return `${base || "document"}.html`;
}

function buildTocHtml(toc: TocItem[], depth: number): string {
  const items = filterToc(toc, depth);
  if (!items.length) {
    return '<p class="doc-toc-empty is-shown">목차로 만들 제목이 없습니다.</p>';
  }

  const list = items
    .map(
      (item) =>
        `<li data-depth="${item.depth}" data-text="${escapeHtml(item.text)}">` +
        `<a href="#${encodeURIComponent(item.id)}">${escapeHtml(item.text)}</a></li>`,
    )
    .join("\n");

  return (
    `<ul class="doc-toc">\n${list}\n</ul>\n` +
    `<p class="doc-toc-empty">검색 결과가 없습니다.</p>`
  );
}

/**
 * CSS/JS 가 모두 인라인된 단일 HTML 파일을 만든다.
 * 외부 요청이 전혀 없으므로 인터넷 연결 없이 file:// 로 열어도 그대로 동작한다.
 */
export function buildStandaloneHtml({
  bodyHtml,
  toc,
  settings,
  markdown,
}: BuildHtmlInput): string {
  const title = settings.docTitle.trim() || "문서";
  const bodyClasses = [
    settings.showToc ? "" : "no-toc",
    settings.showProgress ? "" : "no-progress",
    settings.showPrintButton ? "" : "no-print-btn",
  ]
    .filter(Boolean)
    .join(" ");

  const config = JSON.stringify({
    copyButton: settings.showCopyButton,
    progress: settings.showProgress,
  }).replace(/</g, "\\u003c");

  const sidebar = settings.showToc
    ? `
  <aside class="doc-sidebar" id="doc-sidebar" tabindex="-1" aria-label="문서 목차">
    <p class="doc-sidebar-title">${escapeHtml(title)}</p>
    <label class="doc-sr-only" for="doc-search">목차 검색</label>
    <input class="doc-search" id="doc-search" type="search" placeholder="목차 검색" autocomplete="off" />
    <nav aria-label="목차">
      ${buildTocHtml(toc, settings.tocDepth)}
    </nav>
    <div class="doc-sidebar-foot">
      <button class="doc-print-btn" type="button">인쇄 · PDF로 저장</button>
    </div>
  </aside>
  <div class="doc-backdrop" aria-hidden="true"></div>`
    : "";

  const topbar = settings.showToc
    ? `
  <header class="doc-topbar">
    <button class="doc-menu-btn" type="button" aria-expanded="false" aria-controls="doc-sidebar" aria-label="목차 열기">
      <span aria-hidden="true">☰</span> 목차
    </button>
    <span class="doc-topbar-title">${escapeHtml(title)}</span>
  </header>`
    : "";

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="generator" content="Markdown to Notion HTML" />
<title>${escapeHtml(title)}</title>
<style>
${buildDocumentCss(settings)}
.doc-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
</style>
</head>
<body${bodyClasses ? ` class="${bodyClasses}"` : ""}>
<div class="doc-progress" aria-hidden="true"><i></i></div>${topbar}
<div class="doc-layout">${sidebar}
  <main class="doc-main">
    <article class="doc-article">
${bodyHtml}
    </article>
  </main>
</div>
<template id="doc-markdown-source">${escapeHtml(markdown)}</template>
<script>window.__DOC__=${config};</script>
<script>
${DOCUMENT_SCRIPT}
</script>
</body>
</html>
`;
}
