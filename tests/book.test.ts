import { describe, expect, it } from "vitest";
import { splitMarkdownIntoChapters } from "../app/_lib/book";

describe("단일 Markdown 책 분리", () => {
  it("H2 제목을 각각의 챕터로 만든다", () => {
    const chapters = splitMarkdownIntoChapters(
      "# 한 권의 책\n\n## 첫 장\n\n첫 본문\n\n## 둘째 장\n\n둘째 본문",
      "한 권의 책",
    );

    expect(chapters).toEqual([
      { title: "첫 장", markdown: "첫 본문" },
      { title: "둘째 장", markdown: "둘째 본문" },
    ]);
  });

  it("첫 H2 전에 본문이 있으면 들어가며로 보존한다", () => {
    const chapters = splitMarkdownIntoChapters(
      "# 책\n\n책에 대한 소개입니다.\n\n## 본론\n\n내용",
      "책",
    );

    expect(chapters[0].title).toBe("들어가며");
    expect(chapters[0].markdown).toContain("책에 대한 소개입니다.");
  });

  it("코드 블록 안의 H2 표기는 챕터로 취급하지 않는다", () => {
    const chapters = splitMarkdownIntoChapters(
      "# 코드 안내\n\n```md\n## 예시 제목\n```\n\n## 실제 장\n\n내용",
      "코드 안내",
    );

    expect(chapters.map((chapter) => chapter.title)).toEqual(["들어가며", "실제 장"]);
  });

  it("H2가 없으면 전체를 한 챕터로 유지한다", () => {
    expect(splitMarkdownIntoChapters("# 짧은 글\n\n본문", "짧은 글")).toEqual([
      { title: "짧은 글", markdown: "# 짧은 글\n\n본문" },
    ]);
  });
});
