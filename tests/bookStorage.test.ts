import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteBook,
  loadBooks,
  saveBook,
  updateBookReadingPosition,
  type StoredBook,
} from "../app/_lib/bookStorage";

function makeBook(id: string, updatedAt: number): StoredBook {
  return {
    id,
    title: `책 ${id}`,
    author: "저자",
    chapters: [
      { id: `${id}-1`, title: "첫 장", fileName: "01.md", markdown: "# 첫 장" },
      { id: `${id}-2`, title: "둘째 장", fileName: "02.md", markdown: "# 둘째 장" },
    ],
    updatedAt,
    lastChapterIndex: 0,
  };
}

describe("책장 저장소", () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  it("책을 최신순으로 저장하고 같은 id를 갱신한다", () => {
    saveBook(makeBook("a", 1));
    saveBook(makeBook("b", 2));
    saveBook({ ...makeBook("a", 3), title: "수정된 책" });
    expect(loadBooks().map((book) => book.id)).toEqual(["a", "b"]);
    expect(loadBooks()[0].title).toBe("수정된 책");
  });

  it("마지막으로 읽은 챕터를 저장하고 범위를 보정한다", () => {
    saveBook(makeBook("a", 1));
    updateBookReadingPosition("a", 99);
    expect(loadBooks()[0].lastChapterIndex).toBe(1);
  });

  it("책을 삭제한다", () => {
    saveBook(makeBook("a", 1));
    expect(deleteBook("a")).toEqual([]);
  });

  it("손상된 저장값을 무시한다", () => {
    values.set("markdown-books:v1", JSON.stringify([{ title: "불완전" }]));
    expect(loadBooks()).toEqual([]);
  });
});
