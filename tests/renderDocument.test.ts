import { describe, expect, it } from "vitest";
import {
  buildDocumentHtml,
  buildPreviewHtml,
  renderDocument,
} from "../app/_features/preview/renderDocument";
import { DEFAULT_APPEARANCE, type Settings } from "../app/_lib/settings";

const settings: Settings = {
  ...DEFAULT_APPEARANCE,
  docTitle: "제목",
  fileName: "document.md",
};

describe("문서 렌더링 경계", () => {
  it("내보내기는 전달된 최신 원문을 즉시 사용한다", () => {
    const html = buildDocumentHtml("# 가장 최신 내용", settings);
    expect(html).toContain("가장 최신 내용");
  });

  it("라이브 디자인 설정만 바뀌면 미리보기 HTML 구조는 유지한다", () => {
    const markdown = "# 문서";
    const rendered = renderDocument(markdown);
    const first = buildPreviewHtml(markdown, rendered, settings);
    const liveChanged = buildPreviewHtml(markdown, rendered, {
      ...settings,
      docTitle: "바뀐 제목",
      maxWidth: 1200,
      fontSize: 20,
    });
    const structureChanged = buildPreviewHtml(markdown, rendered, {
      ...settings,
      showToc: false,
    });

    expect(liveChanged).toBe(first);
    expect(structureChanged).not.toBe(first);
  });
});
