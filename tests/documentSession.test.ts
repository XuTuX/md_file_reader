import { describe, expect, it } from "vitest";
import { documentSessionReducer } from "../app/_features/document/useDocumentSession";

describe("documentSessionReducer", () => {
  it("문서의 편집 상태를 한 단위로 갱신한다", () => {
    const loaded = documentSessionReducer(null, {
      type: "load",
      session: { id: "a", markdown: "# A", fileName: "a.md", titleOverride: null },
    });
    const edited = documentSessionReducer(loaded, { type: "edit", markdown: "# B" });
    const renamed = documentSessionReducer(edited, { type: "rename", title: "제목" });

    expect(renamed).toEqual({
      id: "a",
      markdown: "# B",
      fileName: "a.md",
      titleOverride: "제목",
    });
    expect(documentSessionReducer(renamed, { type: "close" })).toBeNull();
  });
});
