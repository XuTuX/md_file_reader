import { describe, expect, it } from "vitest";
import { isPreviewToParentMessage } from "../app/_features/preview/previewMessages";

describe("isPreviewToParentMessage", () => {
  it("지원하는 메시지만 허용한다", () => {
    expect(isPreviewToParentMessage({ type: "markdown-document:ready" })).toBe(true);
    expect(
      isPreviewToParentMessage({ type: "markdown-document:scrollRatio", ratio: 0.5 }),
    ).toBe(true);
    expect(isPreviewToParentMessage({ type: "unknown", ratio: 0.5 })).toBe(false);
  });

  it("선택 영역 좌표의 형태를 검증한다", () => {
    expect(
      isPreviewToParentMessage({
        type: "markdown-document:selection",
        text: "선택",
        rect: { top: 1, left: 2, width: 3, height: 4 },
      }),
    ).toBe(true);
    expect(
      isPreviewToParentMessage({
        type: "markdown-document:selection",
        text: "선택",
        rect: { top: "1" },
      }),
    ).toBe(false);
  });
});

