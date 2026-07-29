"use client";

import { useCallback, useRef, useState } from "react";
import type { StoredBook } from "../_lib/bookStorage";
import { formatBytes, MAX_FILE_BYTES } from "../_lib/readFile";
import { FileIcon, UploadIcon } from "./icons";
import Bookshelf from "./Bookshelf";

interface Props {
  books: StoredBook[];
  busy: boolean;
  message: string | null;
  onFiles: (files: File[]) => void;
  onOpenBook: (book: StoredBook) => void;
  onDeleteBook: (id: string) => void;
}

export default function BookHome({
  books,
  busy,
  message,
  onFiles,
  onOpenBook,
  onDeleteBook,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const openPicker = useCallback(() => inputRef.current?.click(), []);

  return (
    <main className="app-paper-background min-h-dvh">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex items-center gap-3 text-[#5f554a]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#b99b72] font-serif text-lg italic">
            M
          </span>
          <span className="text-[10px] font-semibold tracking-[0.28em] uppercase">
            Manuscript Reader
          </span>
        </div>

        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#d8c6aa] bg-[#fffaf1]/80 px-3.5 py-1.5 text-[11px] font-medium text-[#806039] shadow-sm backdrop-blur">
          <span aria-hidden="true">◇</span>
          <span>파일은 외부로 전송되지 않고 이 브라우저에서만 처리됩니다</span>
        </div>

        <h1 className="mt-5 text-center font-serif text-4xl font-semibold tracking-[-0.035em] text-[#292521] sm:text-5xl">
          Markdown을 한 권의 책처럼
        </h1>
        <p className="mt-4 max-w-xl text-center text-[14px] leading-7 text-[#746a60]">
          한 파일은 내부 제목으로, 여러 파일은 파일별로 챕터를 만들어 편안하게 읽으세요.
        </p>

        <Bookshelf books={books} onOpen={onOpenBook} onDelete={onDeleteBook} />

        <div
          role="button"
          tabIndex={0}
          aria-label="Markdown 파일을 선택하거나 끌어다 놓으세요"
          aria-describedby="book-upload-hint"
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) {
              dragDepth.current = 0;
              setDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            const files = Array.from(event.dataTransfer.files ?? []);
            if (files.length) onFiles(files);
          }}
          className={`mt-10 flex w-full cursor-pointer flex-col items-center gap-4 rounded-[24px] border px-6 py-14 text-center shadow-[0_18px_55px_rgba(66,52,35,0.08)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7a42] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f5f0e7] ${
            dragging
              ? "scale-[1.01] border-[#a8783d] bg-[#f1e5d2]"
              : "border-[#ded2c0] bg-[#fffdf8]/90 hover:-translate-y-0.5 hover:border-[#bea37f] hover:bg-[#fffdf8]"
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d8c3a3] bg-[#f5ecdf] text-[#9a6b32] shadow-inner">
            <UploadIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-[#3c352e]">
              Markdown 파일을 한 개든 여러 개든 놓아 책처럼 열어보세요
            </p>
            <p id="book-upload-hint" className="mt-2 text-[12px] leading-5 text-[#8b8074]">
              한 파일의 ## 제목도 자동으로 챕터화 · 파일당 최대 {formatBytes(MAX_FILE_BYTES)}
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".md,.markdown,text/markdown,text/plain"
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) onFiles(files);
          }}
        />

        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2d2925] px-5 py-2.5 text-[13px] font-semibold text-[#fffaf0] shadow-[0_6px_18px_rgba(45,41,37,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#433c35] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9a6b32] focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <FileIcon />
          {busy ? "책을 만드는 중…" : "Markdown 파일 선택"}
        </button>

        <div role="status" aria-live="polite" className="mt-5 min-h-7 text-center text-[13px]">
          {message ? (
            <span className="rounded-full border border-[#dbcbb5] bg-[#fffaf1] px-4 py-2 text-[#66594c]">
              {message}
            </span>
          ) : null}
        </div>
      </div>
    </main>
  );
}
