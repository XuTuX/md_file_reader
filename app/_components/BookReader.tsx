"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { convertMarkdown } from "../_lib/markdown";
import { sanitizeHtml } from "../_lib/sanitize";
import type { StoredBook } from "../_lib/bookStorage";

interface Props {
  book: StoredBook;
  message?: string | null;
  onBack: () => void;
  onEdit: () => void;
  onChapterChange: (index: number) => void;
}

export default function BookReader({
  book,
  message,
  onBack,
  onEdit,
  onChapterChange,
}: Props) {
  const [chapterIndex, setChapterIndex] = useState(book.lastChapterIndex);
  const [fontSize, setFontSize] = useState(17);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);
  const chapter = book.chapters[chapterIndex];
  const bodyHtml = useMemo(
    () => sanitizeHtml(convertMarkdown(chapter.markdown).html),
    [chapter.markdown],
  );
  const progress = ((chapterIndex + 1) / book.chapters.length) * 100;

  const selectChapter = (index: number) => {
    setChapterIndex(index);
    setMenuOpen(false);
    onChapterChange(index);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [chapterIndex]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f5f0e7] text-[#352f29]">
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-stone-950/30 lg:hidden"
          aria-label="목차 닫기"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[286px] flex-col border-r border-[#3b342d] bg-[#292521] text-stone-200 shadow-[8px_0_30px_rgba(35,29,24,0.08)] transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <button type="button" onClick={onBack} className="text-xs text-stone-400 hover:text-white">
            ← 내 책장
          </button>
          <h1 className="mt-5 font-serif text-xl font-semibold leading-snug text-[#fffaf0]">
            {book.title}
          </h1>
          {book.author ? <p className="mt-2 text-xs text-stone-400">{book.author}</p> : null}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="책 목차">
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
            Contents
          </p>
          <ol className="space-y-1">
            {book.chapters.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectChapter(index)}
                  aria-current={index === chapterIndex ? "page" : undefined}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    index === chapterIndex
                      ? "bg-[#b98a50]/18 text-[#fff8ec] ring-1 ring-[#c39a68]/20"
                      : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
                  }`}
                >
                  <span className="pt-0.5 font-serif text-[11px] text-amber-400/80">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] leading-5">{item.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="mb-2 flex justify-between text-[10px] text-stone-500">
            <span>읽는 중</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#c69b64]" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="w-full rounded-lg border border-white/10 py-2 text-xs text-stone-400 hover:border-white/20 hover:text-white"
            >
              책 구성 편집
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#ded3c3] bg-[#fffdf8]/95 px-4 shadow-[0_4px_18px_rgba(56,45,33,0.04)] backdrop-blur sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-full border border-[#d8cbbb] bg-[#fffdf8] px-2.5 py-2 text-sm lg:hidden"
              aria-label="목차 열기"
            >
              ☰
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs text-stone-400">
                {chapterIndex + 1}장 · {book.chapters.length}개 중
              </p>
              <p className="truncate text-sm font-medium text-stone-700">{chapter.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-[#d8cbbb] bg-[#fffdf8] p-1">
            <button
              type="button"
              onClick={() => setFontSize((size) => Math.max(14, size - 1))}
              className="rounded-full px-2.5 py-1 text-xs text-[#7f7367] hover:bg-[#efe5d8]"
              aria-label="글자 작게"
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => setFontSize((size) => Math.min(22, size + 1))}
              className="rounded-full px-2.5 py-1 text-sm text-[#51483f] hover:bg-[#efe5d8]"
              aria-label="글자 크게"
            >
              A+
            </button>
          </div>
        </header>

        <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
          <div className="mx-auto max-w-[820px] px-6 pb-14 pt-12 sm:px-12 sm:pt-16 lg:px-16">
            <header className="mb-12 border-b border-stone-300/70 pb-9 text-center">
              <p className="font-serif text-xs tracking-[0.22em] text-amber-700 uppercase">
                Chapter {String(chapterIndex + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">
                {chapter.title}
              </h2>
            </header>

            <article
              className="book-prose"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            <nav className="mt-20 grid grid-cols-2 gap-3 border-t border-stone-300/70 pt-7" aria-label="챕터 이동">
              <button
                type="button"
                disabled={chapterIndex === 0}
                onClick={() => selectChapter(chapterIndex - 1)}
                className="rounded-2xl border border-[#d8cbbb] bg-[#fffdf8] px-4 py-3 text-left text-sm text-[#675c51] shadow-sm hover:border-[#b99a70] disabled:invisible"
              >
                <span className="block text-[10px] text-stone-400">이전 장</span>
                ← {book.chapters[chapterIndex - 1]?.title}
              </button>
              <button
                type="button"
                disabled={chapterIndex === book.chapters.length - 1}
                onClick={() => selectChapter(chapterIndex + 1)}
                className="rounded-2xl border border-[#d8cbbb] bg-[#fffdf8] px-4 py-3 text-right text-sm text-[#675c51] shadow-sm hover:border-[#b99a70] disabled:invisible"
              >
                <span className="block text-[10px] text-stone-400">다음 장</span>
                {book.chapters[chapterIndex + 1]?.title} →
              </button>
            </nav>
          </div>
        </main>
      </div>

      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2.5 text-center text-xs text-white shadow-xl"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
