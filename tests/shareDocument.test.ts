import { describe, expect, it } from "vitest";
import { buildShareUrl, decodeSharedDocument, encodeSharedDocument } from "../app/_lib/shareDocument";

describe("로컬 공유 링크", () => {
  const document = {
    title: "한글 문서",
    fileName: "문서.md",
    markdown: "# 한글 문서\n\n내용과 🚀 이모지",
  };

  it("유니코드 문서를 왕복 변환한다", () => {
    const encoded = encodeSharedDocument(document);
    expect(decodeSharedDocument(`#share=${encoded}`)).toEqual(document);
  });

  it("URL의 hash에만 문서를 넣는다", () => {
    const url = buildShareUrl(document, window.location);
    expect(url).toContain("#share=");
    expect(url.split("#")[0]).not.toContain(encodeURIComponent(document.markdown));
  });

  it("손상된 공유 링크는 무시한다", () => {
    expect(decodeSharedDocument("#share=invalid")).toBeNull();
  });
});
