"use client";

import { useMemo, useState } from "react";
import type { StoredBook } from "../_lib/bookStorage";

interface Props {
  book: StoredBook;
  onCancel: () => void;
  onSave: (book: StoredBook) => void;
}

export default function BookBuilder({ book, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [chapters, setChapters] = useState(book.chapters);
  const canSave = title.trim().length > 0 && chapters.length > 0;
  const totalCharacters = useMemo(
    () => chapters.reduce((sum, chapter) => sum + chapter.markdown.length, 0),
    [chapters],
  );

  const moveChapter = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= chapters.length) return;
    setChapters((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <main className="app-paper-background min-h-dvh px-5 py-8 text-[#302b26] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-1 py-1 text-sm text-[#786a5d] transition-colors hover:text-[#9a6b32] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7a42]"
        >
          ← 책장으로
        </button>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-[#d9cbb8] bg-[#fffdf8] shadow-[0_24px_70px_rgba(73,55,35,0.12)]">
          <header className="border-b border-[#e1d6c7] px-6 py-7 sm:px-10 sm:py-9">
            <span className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
              Book setup
            </span>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              책을 다듬어 주세요
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              파일은 챕터가 됩니다. 순서를 확인한 뒤 한 권의 책으로 묶으세요.
            </p>
          </header>

          <div className="grid gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[230px_1fr]">
            <aside>
              <div className="relative mx-auto aspect-[3/4.25] w-44 overflow-hidden rounded-r-xl rounded-l-[3px] bg-gradient-to-br from-[#584a3c] to-[#211e1b] px-6 py-7 text-[#f7f0df] shadow-[10px_12px_26px_rgba(41,35,28,0.24)] ring-1 ring-black/10 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-white/10 lg:w-full">
                <div className="h-px w-9 bg-amber-300/70" />
                <p className="mt-8 font-serif text-2xl font-semibold leading-tight">
                  {title.trim() || "제목 없는 책"}
                </p>
                <p className="mt-4 text-xs tracking-wide text-stone-300">
                  {author.trim() || "저자 미상"}
                </p>
                <p className="mt-auto text-[10px] text-stone-400" />
              </div>
              <p className="mt-5 text-center text-xs text-stone-400 lg:text-left">
                {chapters.length}개 챕터 · 약 {totalCharacters.toLocaleString("ko-KR")}자
              </p>
            </aside>

            <section>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-stone-600">책 제목</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#d8c9b5] bg-[#fbf7ef] px-3.5 py-3 text-sm outline-none transition focus:border-[#b4854d] focus:bg-[#fffdf8] focus:ring-2 focus:ring-[#c5a16e]/20"
                    placeholder="책 제목"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-stone-600">저자</span>
                  <input
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#d8c9b5] bg-[#fbf7ef] px-3.5 py-3 text-sm outline-none transition focus:border-[#b4854d] focus:bg-[#fffdf8] focus:ring-2 focus:ring-[#c5a16e]/20"
                    placeholder="선택 사항"
                  />
                </label>
              </div>

              <div className="mt-7 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-800">목차와 순서</h2>
                <span className="text-xs text-stone-400">화살표로 순서 변경</span>
              </div>
              <ol className="mt-3 space-y-2">
                {chapters.map((chapter, index) => (
                  <li
                    key={chapter.id}
                    className="flex items-center gap-3 rounded-xl border border-[#e0d5c6] bg-[#fbf8f2] px-3 py-2.5 transition hover:border-[#cdb99d] hover:bg-[#fffdf8]"
                  >
                    <span className="w-7 shrink-0 text-center font-serif text-sm text-stone-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">{index + 1}장 제목</span>
                      <input
                        value={chapter.title}
                        onChange={(event) =>
                          setChapters((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, title: event.target.value } : item,
                            ),
                          )
                        }
                        className="w-full truncate rounded-md bg-transparent px-1 py-1 text-sm font-medium text-[#564c42] outline-none focus:bg-[#f3ebdf] focus:ring-2 focus:ring-[#c5a16e]/20"
                      />
                      <span className="block truncate px-1 text-[11px] text-stone-400">
                        {chapter.fileName}
                      </span>
                    </label>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveChapter(index, -1)}
                        disabled={index === 0}
                        className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100 disabled:opacity-25"
                        aria-label={`${chapter.title} 위로 이동`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveChapter(index, 1)}
                        disabled={index === chapters.length - 1}
                        className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100 disabled:opacity-25"
                        aria-label={`${chapter.title} 아래로 이동`}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => setChapters((current) => current.filter((_, i) => i !== index))}
                        disabled={chapters.length === 1}
                        className="rounded-lg px-2 py-1.5 text-xs text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-25"
                        aria-label={`${chapter.title} 제외`}
                      >
                        제외
                      </button>
                    </div>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                disabled={!canSave}
                onClick={() =>
                  onSave({
                    ...book,
                    title: title.trim(),
                    author: author.trim(),
                    chapters,
                    updatedAt: Date.now(),
                    lastChapterIndex: Math.min(book.lastChapterIndex, chapters.length - 1),
                  })
                }
                className="mt-7 w-full rounded-full bg-[#2d2925] px-5 py-3.5 text-sm font-semibold text-[#fffaf0] shadow-[0_8px_22px_rgba(45,41,37,0.16)] transition hover:-translate-y-0.5 hover:bg-[#433c35] disabled:cursor-not-allowed disabled:opacity-40"
              >
                이 구성으로 책 만들기 →
              </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
