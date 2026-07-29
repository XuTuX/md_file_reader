import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteRecentDocument,
  loadRecentDocuments,
  saveRecentDocument,
} from "../app/_lib/documentStorage";

describe("최근 문서 저장소", () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
        clear: () => values.clear(),
      },
    });
  });

  it("문서를 최신순으로 저장하고 같은 id를 갱신한다", () => {
    expect(
      saveRecentDocument({ id: "a", title: "A", fileName: "a.md", markdown: "# A", updatedAt: 1 })
        .saved,
    ).toBe(true);
    saveRecentDocument({ id: "b", title: "B", fileName: "b.md", markdown: "# B", updatedAt: 2 });
    saveRecentDocument({ id: "a", title: "A2", fileName: "a.md", markdown: "# A2", updatedAt: 3 });

    expect(loadRecentDocuments().map((document) => document.id)).toEqual(["a", "b"]);
    expect(loadRecentDocuments()[0].title).toBe("A2");
  });

  it("문서를 삭제한다", () => {
    saveRecentDocument({ id: "a", title: "A", fileName: "a.md", markdown: "# A" });
    expect(deleteRecentDocument("a")).toEqual([]);
  });

  it("저장 실패를 명시적으로 반환한다", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
      },
    });

    expect(
      saveRecentDocument({ id: "a", title: "A", fileName: "a.md", markdown: "# A" }),
    ).toEqual({ documents: [], saved: false });
  });
});
