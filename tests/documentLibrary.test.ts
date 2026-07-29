import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentLibrary } from "../app/_features/document/useDocumentLibrary";
import type { StoredDocument } from "../app/_lib/documentStorage";

type Library = ReturnType<typeof useDocumentLibrary>;
let current: Library | null = null;
let root: Root;

function Harness({ document }: { document: StoredDocument | null }) {
  const library = useDocumentLibrary(document);
  useEffect(() => {
    current = library;
  }, [library]);
  return null;
}

describe("useDocumentLibrary", () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    values.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    root = createRoot(document.createElement("div"));
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.useRealTimers();
  });

  it("편집 문서를 기다렸다가 저장하고 상태를 갱신한다", () => {
    const draft: StoredDocument = {
      id: "draft",
      title: "초안",
      fileName: "draft.md",
      markdown: "# 초안",
      updatedAt: 10,
    };

    act(() => root.render(createElement(Harness, { document: draft })));
    expect(current?.lastSavedAt).toBeNull();

    act(() => vi.advanceTimersByTime(650));

    expect(current?.saveFailed).toBe(false);
    expect(current?.lastSavedAt).toBe(10);
    expect(current?.loadDocuments()[0].markdown).toBe("# 초안");
  });
});
