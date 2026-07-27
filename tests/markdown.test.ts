import { describe, expect, it } from "vitest";
import { convertMarkdown, filterToc } from "../app/_lib/markdown";

describe("convertMarkdown", () => {
  it("제목을 변환하고 고유한 id 를 붙인다", () => {
    const { html, toc } = convertMarkdown("# 제목\n\n## 소제목\n");
    expect(html).toContain('<h1 id="제목"');
    expect(html).toContain('<h2 id="소제목"');
    expect(toc).toEqual([
      { id: "제목", text: "제목", depth: 1 },
      { id: "소제목", text: "소제목", depth: 2 },
    ]);
  });

  it("중복된 제목에 서로 다른 id 를 준다", () => {
    const { toc } = convertMarkdown("## 설치\n## 설치\n## 설치\n");
    expect(toc.map((item) => item.id)).toEqual(["설치", "설치-2", "설치-3"]);
  });

  it("제목마다 # 앵커를 넣는다", () => {
    const { html } = convertMarkdown("## 설치\n");
    expect(html).toContain('<a class="md-anchor" href="#설치"');
  });

  it("첫 번째 H1 을 문서 제목으로 추출한다", () => {
    expect(convertMarkdown("## 소제목\n\n# 진짜 제목\n").title).toBe("진짜 제목");
    expect(convertMarkdown("## 소제목만 있음\n").title).toBeNull();
  });

  it("굵게/기울임/취소선/인라인 코드를 변환한다", () => {
    const { html } = convertMarkdown("**굵게** *기울임* ~~취소선~~ `코드`");
    expect(html).toContain("<strong>굵게</strong>");
    expect(html).toContain("<em>기울임</em>");
    expect(html).toContain("<del>취소선</del>");
    expect(html).toContain("<code>코드</code>");
  });

  it("순서 있는/없는 목록과 중첩 목록을 변환한다", () => {
    const { html } = convertMarkdown("- 하나\n  - 중첩\n- 둘\n\n1. 첫째\n2. 둘째\n");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html.match(/<ul>/g)?.length).toBe(2); // 중첩 목록 포함
  });

  it("체크박스 목록을 변환한다", () => {
    const { html } = convertMarkdown("- [x] 완료\n- [ ] 미완료\n");
    expect(html).toContain('<li class="md-task">');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("checked");
  });

  it("인용문, 링크, 이미지, 구분선을 변환한다", () => {
    const { html } = convertMarkdown(
      "> 인용\n\n[링크](https://example.com)\n\n![대체문구](/a.png)\n\n---\n",
    );
    expect(html).toContain("<blockquote>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('src="/a.png"');
    expect(html).toContain('alt="대체문구"');
    expect(html).toContain("<hr>");
  });

  it("GFM 표를 가로 스크롤 컨테이너로 감싼다", () => {
    const { html } = convertMarkdown("| A | B |\n| --- | --- |\n| 1 | 2 |\n");
    expect(html).toContain('<div class="md-table-wrap"');
    expect(html).toContain("<table>");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("언어가 지정된 코드 블록에 문법 강조를 적용한다", () => {
    const { html } = convertMarkdown('```js\nconst a = 1;\n```\n');
    expect(html).toContain('<div class="md-code" data-lang="js">');
    expect(html).toContain('class="hljs language-js"');
    expect(html).toContain("hljs-keyword");
  });

  it("언어가 없는 코드 블록은 이스케이프만 한다", () => {
    const { html } = convertMarkdown("```\n<b>plain</b>\n```\n");
    expect(html).toContain('<div class="md-code">');
    expect(html).toContain("&lt;b&gt;plain&lt;/b&gt;");
  });

  it("알 수 없는 언어여도 변환에 실패하지 않는다", () => {
    const { html } = convertMarkdown("```존재하지않는언어\nabc\n```\n");
    expect(html).toContain("abc");
  });

  it("긴 문서도 모든 제목을 빠짐없이 처리한다", () => {
    const long = Array.from({ length: 300 }, (_, i) => `## 섹션 ${i}\n\n본문 ${i}\n`).join(
      "\n",
    );
    const { toc } = convertMarkdown(long);
    expect(toc).toHaveLength(300);
    expect(new Set(toc.map((item) => item.id)).size).toBe(300);
  });
});

describe("filterToc", () => {
  const toc = [
    { id: "a", text: "a", depth: 1 },
    { id: "b", text: "b", depth: 2 },
    { id: "c", text: "c", depth: 3 },
    { id: "d", text: "d", depth: 4 },
  ];

  it("설정한 깊이까지만 남긴다", () => {
    expect(filterToc(toc, 1).map((i) => i.id)).toEqual(["a"]);
    expect(filterToc(toc, 2).map((i) => i.id)).toEqual(["a", "b"]);
    expect(filterToc(toc, 4).map((i) => i.id)).toEqual(["a", "b", "c", "d"]);
  });
});
