import { describe, expect, it } from "vitest";
import { convertMarkdown } from "../app/_lib/markdown";
import { sanitizeHtml } from "../app/_lib/sanitize";

function render(markdown: string): string {
  return sanitizeHtml(convertMarkdown(markdown).html);
}

describe("sanitizeHtml", () => {
  it("script 태그를 제거한다", () => {
    const html = render("본문\n\n<script>alert('xss')</script>\n");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });

  it("iframe / object / embed 를 제거한다", () => {
    const html = render(
      '<iframe src="https://evil.example"></iframe>\n\n<object data="x"></object>\n\n<embed src="x" />\n',
    );
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<object");
    expect(html).not.toContain("<embed");
  });

  it("인라인 이벤트 핸들러를 제거한다", () => {
    const html = render('<img src="x" onerror="alert(1)" alt="a" />\n');
    expect(html).not.toContain("onerror");
    expect(html).toContain("<img");
  });

  it("javascript: URL 을 제거한다", () => {
    const html = render("[클릭](javascript:alert('xss'))\n");
    expect(html.toLowerCase()).not.toContain("javascript:");
  });

  it("style 속성과 style 태그를 제거한다", () => {
    const html = render(
      '<p style="position:fixed;top:0">a</p>\n\n<style>body{display:none}</style>\n',
    );
    expect(html).not.toContain("<style");
    expect(html).not.toContain("style=");
  });

  it("form 요소를 제거한다", () => {
    const html = render('<form action="https://evil.example"><p>내용</p></form>\n');
    expect(html).not.toContain("<form");
  });

  it("정상적인 마크다운 결과물은 그대로 남긴다", () => {
    const html = render(
      "# 제목\n\n**굵게** 와 [링크](https://example.com)\n\n```js\nconst a = 1;\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n",
    );
    expect(html).toContain('<h1 id="제목"');
    expect(html).toContain("<strong>굵게</strong>");
    expect(html).toContain('class="md-anchor"');
    expect(html).toContain('class="md-code"');
    expect(html).toContain('class="md-table-wrap"');
    expect(html).toContain("<table>");
  });

  it("외부 링크에 target 과 rel 을 붙인다", () => {
    const html = render("[외부](https://example.com)\n");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("문서 내부 앵커는 새 탭으로 열지 않는다", () => {
    // marked 는 href 를 퍼센트 인코딩한다. 브라우저는 id 와 정상적으로 매칭한다.
    const html = render("[내부](#설치)\n");
    const href = html.match(/href="#([^"]+)"/)?.[1] ?? "";
    expect(decodeURIComponent(href)).toBe("설치");
    expect(html).not.toContain('target="_blank"');
  });

  it("코드 블록 안의 script 문자열은 텍스트로 보존한다", () => {
    const html = render("```html\n<script>alert(1)</script>\n```\n");
    // 문법 강조가 적용돼도 꺾쇠는 항상 이스케이프된 상태로 남는다
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;");
    expect(html).toContain("alert(1)");
    expect(html).toContain('class="hljs language-html"');
  });

  it("문법 강조가 없는 코드 블록의 script 도 이스케이프한다", () => {
    const html = render("```\n<script>alert(1)</script>\n```\n");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
