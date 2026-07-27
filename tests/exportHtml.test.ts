import { describe, expect, it } from "vitest";
import { convertMarkdown } from "../app/_lib/markdown";
import { sanitizeHtml } from "../app/_lib/sanitize";
import { buildStandaloneHtml, toHtmlFileName } from "../app/_lib/exportHtml";
import { DEFAULT_APPEARANCE, type Settings } from "../app/_lib/settings";

const MARKDOWN = [
  "# 사용 설명서",
  "",
  "본문입니다.",
  "",
  "## 설치",
  "",
  "```bash",
  "npm install",
  "```",
  "",
  "## 설치",
  "",
  "| A | B |",
  "| --- | --- |",
  "| 1 | 2 |",
  "",
  "#### 아주 깊은 제목",
  "",
  "##### 더 깊은 제목",
  "",
].join("\n");

function build(overrides: Partial<Settings> = {}): string {
  const { html, toc } = convertMarkdown(MARKDOWN);
  const settings: Settings = {
    ...DEFAULT_APPEARANCE,
    docTitle: "사용 설명서",
    fileName: "HOW_TO_BUILD.md",
    ...overrides,
  };
  return buildStandaloneHtml({
    bodyHtml: sanitizeHtml(html),
    toc,
    settings,
    markdown: MARKDOWN,
  });
}

describe("toHtmlFileName", () => {
  it("확장자를 .html 로 바꾼다", () => {
    expect(toHtmlFileName("HOW_TO_BUILD.md")).toBe("HOW_TO_BUILD.html");
    expect(toHtmlFileName("README.markdown")).toBe("README.html");
  });

  it("한글과 공백이 있는 파일명도 처리한다", () => {
    expect(toHtmlFileName("설치 안내서.md")).toBe("설치 안내서.html");
  });

  it("확장자가 없으면 그대로 .html 을 붙인다", () => {
    expect(toHtmlFileName("문서")).toBe("문서.html");
  });

  it("이미 .html 이면 중복해서 붙이지 않는다", () => {
    expect(toHtmlFileName("index.html")).toBe("index.html");
  });

  it("경로 구분자와 사용할 수 없는 문자를 제거한다", () => {
    expect(toHtmlFileName("../../etc/passwd.md")).toBe("passwd.html");
    expect(toHtmlFileName('a<b>c:d"e|f?g*h.md')).toBe("abcdefgh.html");
  });

  it("비어 있으면 기본 이름을 쓴다", () => {
    expect(toHtmlFileName("")).toBe("document.html");
    expect(toHtmlFileName("   ")).toBe("document.html");
    expect(toHtmlFileName(".md")).toBe("document.html");
  });
});

describe("buildStandaloneHtml", () => {
  it("완전한 HTML 문서를 만든다", () => {
    const html = build();
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<html lang="ko">');
    expect(html).toContain('<meta charset="utf-8" />');
    expect(html).toContain("<title>사용 설명서</title>");
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
  });

  it("CSS 와 JavaScript 를 파일 안에 인라인으로 포함한다", () => {
    const html = build();
    expect(html).toContain("<style>");
    expect(html).toContain("--doc-max-width:900px");
    expect(html).toContain(".hljs-keyword");
    expect(html).toContain("IntersectionObserver");
    expect(html).toContain("navigator.clipboard");
  });

  it("외부 리소스를 전혀 참조하지 않는다", () => {
    const html = build();
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet/i);
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/@import\s+url\(/i);
  });

  it("본문과 사이드바 목차를 함께 넣는다", () => {
    const html = build();
    expect(html).toContain('id="doc-sidebar"');
    expect(html).toContain('class="doc-toc"');
    expect(html).toContain('<a href="#%EC%84%A4%EC%B9%98">설치</a>');
    expect(html).toContain("설치-2");
    expect(html).toContain('id="doc-search"');
    expect(html).toContain("doc-menu-btn");
  });

  it("목차 깊이 설정을 반영한다", () => {
    // data-text 는 목차 항목에만 붙으므로 본문/원문 보존 영역과 헷갈리지 않는다
    expect(build({ tocDepth: 2 })).not.toContain('data-text="아주 깊은 제목"');
    expect(build({ tocDepth: 4 })).toContain('data-text="아주 깊은 제목"');
    // 본문에는 깊이와 무관하게 제목이 그대로 남는다
    expect(build({ tocDepth: 2 })).toContain("아주 깊은 제목");
    // H5 는 어떤 설정에서도 목차에 들어가지 않는다
    expect(build({ tocDepth: 4 })).not.toContain('data-text="더 깊은 제목"');
  });

  it("본문 폭과 글자 크기 설정을 반영한다", () => {
    const html = build({ maxWidth: 720, fontSize: 18 });
    expect(html).toContain("--doc-max-width:720px");
    expect(html).toContain("--doc-font-size:18px");
  });

  it("목차를 끄면 사이드바를 만들지 않는다", () => {
    const html = build({ showToc: false });
    expect(html).not.toContain('id="doc-sidebar"');
    expect(html).toContain('class="no-toc"');
  });

  it("기능 토글을 body 클래스와 설정 객체에 반영한다", () => {
    const html = build({ showProgress: false, showCopyButton: false, showPrintButton: false });
    expect(html).toContain("no-progress");
    expect(html).toContain("no-print-btn");
    expect(html).toContain('"copyButton":false');
    expect(html).toContain('"progress":false');
  });

  it("Markdown 원문을 누락 없이 보존한다", () => {
    const html = build();
    const match = html.match(/<template id="doc-markdown-source">([\s\S]*?)<\/template>/);
    expect(match).not.toBeNull();

    const decoded = (match?.[1] ?? "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
    expect(decoded).toBe(MARKDOWN);
  });

  it("주입된 설정 JSON 이 script 태그를 깨뜨리지 않는다", () => {
    const html = build({ docTitle: "</script><script>alert(1)</script>" });
    expect(html).not.toContain("<title></script>");
    expect(html).toContain("&lt;/script&gt;");
  });

  it("인쇄 스타일을 포함한다", () => {
    expect(build()).toContain("@media print");
  });
});
