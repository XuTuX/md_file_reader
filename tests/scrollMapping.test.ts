import { describe, expect, it } from "vitest";
import { findNearestHeading } from "../app/_features/preview/scrollMapping";
import type { TocItem } from "../app/_lib/markdown";

const toc: TocItem[] = [
  { id: "설치", text: "설치", depth: 2, lineIndex: 3 },
  { id: "설치-2", text: "설치", depth: 2, lineIndex: 12 },
  { id: "설치-3", text: "설치", depth: 2, lineIndex: 24 },
];

describe("findNearestHeading", () => {
  it("중복된 제목도 원문 행을 기준으로 구분한다", () => {
    expect(findNearestHeading(toc, 14)?.id).toBe("설치-2");
    expect(findNearestHeading(toc, 30)?.id).toBe("설치-3");
  });

  it("보이는 행보다 커서 행을 우선한다", () => {
    expect(findNearestHeading(toc, 4, 26)?.id).toBe("설치-3");
  });
});

