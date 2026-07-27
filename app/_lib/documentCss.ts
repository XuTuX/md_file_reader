import type { AppearanceSettings } from "./settings";

/**
 * highlight.js 라이트 테마 (직접 작성).
 * 외부 CSS 파일을 받아오지 않고 최종 HTML 안에 그대로 들어가야 하므로 문자열로 관리한다.
 */
const HLJS_THEME = `
.hljs{color:#37352f;background:transparent}
.hljs-comment,.hljs-quote{color:#8d8b85;font-style:italic}
.hljs-keyword,.hljs-selector-tag,.hljs-literal,.hljs-type,.hljs-name{color:#8250a8}
.hljs-string,.hljs-regexp,.hljs-addition,.hljs-attribute,.hljs-meta .hljs-string{color:#2f6f4f}
.hljs-number,.hljs-symbol,.hljs-bullet,.hljs-template-variable,.hljs-variable{color:#9a5b2e}
.hljs-title,.hljs-title.class_,.hljs-title.function_,.hljs-section{color:#2f5fa8}
.hljs-attr,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id{color:#8a6d1f}
.hljs-built_in,.hljs-doctag,.hljs-meta{color:#1f6a70}
.hljs-deletion{color:#a13a3a}
.hljs-emphasis{font-style:italic}
.hljs-strong{font-weight:600}
`.trim();

/** 최종 HTML 에 인라인으로 들어가는 문서 스타일시트 전체. */
export function buildDocumentCss(settings: AppearanceSettings): string {
  return `
:root{
  --doc-bg:#ffffff;
  --doc-sidebar-bg:#fafaf9;
  --doc-text:#37352f;
  --doc-muted:#787774;
  --doc-faint:#9b9a97;
  --doc-border:#ecebe9;
  --doc-border-strong:#e0dfdc;
  --doc-code-bg:#f7f6f3;
  --doc-hover:#f1f0ee;
  --doc-accent:#2f6ab0;
  --doc-max-width:${settings.maxWidth}px;
  --doc-font-size:${settings.fontSize}px;
  --doc-sidebar-width:280px;
  --doc-font:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",Arial,sans-serif;
  --doc-mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"D2Coding","Noto Sans Mono CJK KR",monospace;
}

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{
  margin:0;
  background:var(--doc-bg);
  color:var(--doc-text);
  font-family:var(--doc-font);
  font-size:var(--doc-font-size);
  line-height:1.7;
  word-break:keep-all;
  overflow-wrap:anywhere;
}

/* ---------- 읽기 진행률 ---------- */
.doc-progress{position:fixed;top:0;left:0;right:0;height:2px;background:transparent;z-index:60}
.doc-progress > i{display:block;height:100%;width:0;background:var(--doc-text);opacity:.55;transition:width .08s linear}
body.no-progress .doc-progress{display:none}

/* ---------- 모바일 상단 바 ---------- */
.doc-topbar{
  display:none;position:sticky;top:0;z-index:40;
  align-items:center;gap:10px;
  padding:10px 14px;background:rgba(255,255,255,.94);
  backdrop-filter:saturate(180%) blur(8px);
  border-bottom:1px solid var(--doc-border);
}
.doc-topbar-title{font-size:.9rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.doc-menu-btn{
  display:inline-flex;align-items:center;gap:6px;
  font:inherit;font-size:.85rem;color:var(--doc-text);
  background:#fff;border:1px solid var(--doc-border-strong);border-radius:6px;
  padding:6px 10px;cursor:pointer;
}
.doc-menu-btn:hover{background:var(--doc-hover)}

/* ---------- 레이아웃 ---------- */
.doc-layout{display:flex;align-items:flex-start;min-height:100vh}

.doc-sidebar{
  position:sticky;top:0;flex:0 0 var(--doc-sidebar-width);width:var(--doc-sidebar-width);
  height:100vh;overflow-y:auto;overscroll-behavior:contain;
  background:var(--doc-sidebar-bg);border-right:1px solid var(--doc-border);
  padding:28px 20px 40px;
}
body.no-toc .doc-sidebar,body.no-toc .doc-backdrop,body.no-toc .doc-menu-btn{display:none}

.doc-sidebar-title{
  margin:0 0 14px;font-size:.95rem;font-weight:600;line-height:1.45;color:var(--doc-text);
}
.doc-search{
  width:100%;font:inherit;font-size:.82rem;color:var(--doc-text);
  padding:7px 10px;margin-bottom:14px;
  background:#fff;border:1px solid var(--doc-border-strong);border-radius:6px;
}
.doc-search:focus{outline:2px solid var(--doc-accent);outline-offset:1px}
.doc-search::placeholder{color:var(--doc-faint)}

.doc-toc,.doc-toc ul{list-style:none;margin:0;padding:0}
.doc-toc a{
  display:block;padding:4px 8px;margin:1px 0;border-radius:4px;
  color:var(--doc-muted);text-decoration:none;font-size:.83rem;line-height:1.5;
  border-left:2px solid transparent;
}
.doc-toc a:hover{background:var(--doc-hover);color:var(--doc-text)}
.doc-toc a:focus-visible{outline:2px solid var(--doc-accent);outline-offset:-2px}
.doc-toc a.is-active{color:var(--doc-text);font-weight:600;background:var(--doc-hover);border-left-color:var(--doc-text)}
.doc-toc li[data-depth="2"] > a{padding-left:18px}
.doc-toc li[data-depth="3"] > a{padding-left:30px;font-size:.8rem}
.doc-toc li[data-depth="4"] > a{padding-left:42px;font-size:.8rem}
.doc-toc li[data-depth="5"] > a{padding-left:54px;font-size:.78rem}
.doc-toc li[data-depth="6"] > a{padding-left:66px;font-size:.78rem}
.doc-toc li.is-hidden{display:none}

.doc-toc-empty{display:none;padding:8px;color:var(--doc-faint);font-size:.8rem}
.doc-toc-empty.is-shown{display:block}

.doc-sidebar-foot{margin-top:22px;padding-top:16px;border-top:1px solid var(--doc-border)}
.doc-print-btn{
  width:100%;font:inherit;font-size:.82rem;color:var(--doc-muted);
  background:#fff;border:1px solid var(--doc-border-strong);border-radius:6px;
  padding:7px 10px;cursor:pointer;
}
.doc-print-btn:hover{background:var(--doc-hover);color:var(--doc-text)}
body.no-print-btn .doc-sidebar-foot{display:none}

.doc-backdrop{display:none;position:fixed;inset:0;background:rgba(15,15,15,.32);z-index:45}
.doc-backdrop.is-shown{display:block}

.doc-main{flex:1 1 auto;min-width:0;padding:0 40px}
.doc-article{max-width:var(--doc-max-width);margin:0 auto;padding:72px 0 160px}

/* ---------- 본문 타이포그래피 ---------- */
.doc-article > *:first-child{margin-top:0}
.md-heading{position:relative;font-weight:600;line-height:1.35;letter-spacing:-.01em;scroll-margin-top:80px}
h1.md-heading{font-size:2.1em;margin:0 0 .6em}
h2.md-heading{font-size:1.5em;margin:2.2em 0 .5em;padding-bottom:.25em;border-bottom:1px solid var(--doc-border)}
h3.md-heading{font-size:1.22em;margin:1.9em 0 .45em}
h4.md-heading{font-size:1.05em;margin:1.7em 0 .4em}
h5.md-heading{font-size:.95em;margin:1.5em 0 .35em;color:var(--doc-muted)}
h6.md-heading{font-size:.88em;margin:1.4em 0 .3em;color:var(--doc-muted)}

.md-anchor{
  margin-left:.35em;color:var(--doc-faint);text-decoration:none;font-weight:400;
  opacity:0;transition:opacity .12s ease;
}
.md-heading:hover .md-anchor,.md-anchor:focus{opacity:1}
.md-anchor:focus-visible{outline:2px solid var(--doc-accent);outline-offset:2px;border-radius:3px}

.doc-article p{margin:0 0 1.05em}
.doc-article a{color:var(--doc-accent);text-decoration:underline;text-underline-offset:2px;text-decoration-thickness:1px}
.doc-article a:hover{text-decoration-thickness:2px}
.doc-article strong{font-weight:600}
.doc-article em{font-style:italic}
.doc-article del{color:var(--doc-muted)}
.doc-article small{color:var(--doc-muted)}

.doc-article ul,.doc-article ol{margin:0 0 1.05em;padding-left:1.5em}
.doc-article li{margin:.28em 0}
.doc-article li > ul,.doc-article li > ol{margin:.3em 0 .3em}
.doc-article li::marker{color:var(--doc-muted)}
.doc-article li.md-task{list-style:none;margin-left:-1.35em;padding-left:1.35em;position:relative}
.doc-article li.md-task input[type="checkbox"]{
  position:absolute;left:0;top:.42em;margin:0;width:.95em;height:.95em;accent-color:var(--doc-muted);
}

.doc-article blockquote{
  margin:1.4em 0;padding:.15em 0 .15em 1em;
  border-left:3px solid var(--doc-border-strong);color:var(--doc-muted);
}
.doc-article blockquote > *:last-child{margin-bottom:0}

.doc-article hr{border:0;border-top:1px solid var(--doc-border);margin:2.4em 0}

.doc-article img{max-width:100%;height:auto;display:block;margin:1.4em auto;border-radius:4px}

/* ---------- 코드 ---------- */
.doc-article code{font-family:var(--doc-mono);font-size:.88em}
.doc-article :not(pre) > code{
  background:var(--doc-code-bg);border:1px solid var(--doc-border);border-radius:4px;
  padding:.12em .35em;white-space:break-spaces;
}
.md-code{position:relative;margin:1.4em 0}
.md-code pre{
  margin:0;padding:16px 18px;overflow-x:auto;
  background:var(--doc-code-bg);border:1px solid var(--doc-border);border-radius:6px;
  line-height:1.6;
}
.md-code pre code{display:block;white-space:pre;background:none;border:0;padding:0;font-size:.85em}
.md-code[data-lang]::after{
  content:attr(data-lang);position:absolute;left:14px;top:-9px;
  background:var(--doc-bg);color:var(--doc-faint);
  font-size:.66rem;letter-spacing:.04em;text-transform:uppercase;padding:0 5px;
}
.md-copy{
  position:absolute;top:8px;right:8px;z-index:2;
  font:inherit;font-size:.72rem;color:var(--doc-muted);
  background:#fff;border:1px solid var(--doc-border-strong);border-radius:4px;
  padding:3px 8px;cursor:pointer;opacity:.45;transition:opacity .12s ease;
}
.md-code:hover .md-copy,.md-copy:focus{opacity:1}
.md-copy:hover{background:var(--doc-hover);color:var(--doc-text)}
.md-copy:focus-visible{outline:2px solid var(--doc-accent);outline-offset:1px}
.md-copy.is-done{color:var(--doc-text)}

${HLJS_THEME}

/* ---------- 표 ---------- */
.md-table-wrap{margin:1.5em 0;overflow-x:auto;max-width:100%;border-radius:6px}
.md-table-wrap:focus-visible{outline:2px solid var(--doc-accent);outline-offset:2px}
.md-table-wrap table{border-collapse:collapse;width:100%;font-size:.92em}
.md-table-wrap th,.md-table-wrap td{
  border:1px solid var(--doc-border-strong);padding:8px 12px;text-align:left;vertical-align:top;
  word-break:keep-all;
}
.md-table-wrap thead th{background:var(--doc-code-bg);font-weight:600;white-space:nowrap}
.md-table-wrap tbody tr:nth-child(even){background:#fcfcfb}

/* ---------- 반응형 ---------- */
@media (max-width:1024px){
  .doc-main{padding:0 28px}
  .doc-article{padding:56px 0 120px}
}
@media (max-width:820px){
  .doc-topbar{display:flex}
  .doc-layout{display:block}
  .doc-sidebar{
    position:fixed;top:0;left:0;z-index:50;height:100vh;
    transform:translateX(-100%);transition:transform .22s ease;
    box-shadow:0 0 0 1px var(--doc-border);
    width:min(84vw,var(--doc-sidebar-width));flex-basis:auto;
  }
  .doc-sidebar.is-open{transform:translateX(0)}
  .doc-main{padding:0 18px}
  .doc-article{padding:28px 0 100px}
  h1.md-heading{font-size:1.75em}
  h2.md-heading{font-size:1.35em}
  .md-heading{scroll-margin-top:64px}
  .md-code pre{padding:14px 14px}
}
@media (prefers-reduced-motion:reduce){
  .doc-sidebar{transition:none}
}

/* ---------- 인쇄 / PDF ---------- */
@media print{
  .doc-progress,.doc-topbar,.doc-sidebar,.doc-backdrop,.md-copy,.md-anchor{display:none !important}
  body{font-size:11pt}
  .doc-layout{display:block}
  .doc-main{padding:0}
  .doc-article{max-width:none;padding:0}
  .md-code pre,.md-table-wrap{overflow:visible}
  .md-code pre code{white-space:pre-wrap}
  .md-heading{break-after:avoid-page}
  .md-code,.md-table-wrap,blockquote,img{break-inside:avoid}
  a{color:inherit;text-decoration:none}
}
`.trim();
}
