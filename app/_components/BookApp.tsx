"use client";

import { useCallback, useEffect, useState } from "react";
import { convertMarkdown } from "../_lib/markdown";
import { splitMarkdownIntoChapters } from "../_lib/book";
import {
  createBookId,
  deleteBook,
  loadBooks,
  saveBook,
  updateBookReadingPosition,
  type StoredBook,
} from "../_lib/bookStorage";
import { readMarkdownFile, validateMarkdownFile } from "../_lib/readFile";
import BookBuilder from "./BookBuilder";
import BookHome from "./BookHome";
import BookReader from "./BookReader";

function baseName(fileName: string): string {
  return fileName.replace(/\.(md|markdown)$/i, "");
}

function readableTitle(fileName: string): string {
  return (
    baseName(fileName)
      .replace(/^\s*\d+[\s._-]*/, "")
      .replace(/[_-]+/g, " ")
      .trim() || baseName(fileName)
  );
}

function defaultBookTitle(files: File[]): string {
  const relativePath = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath;
  return relativePath?.split("/")[0]?.trim() || "새로운 Markdown 책";
}

export default function BookApp() {
  const [books, setBooks] = useState<StoredBook[]>([]);
  const [bookDraft, setBookDraft] = useState<StoredBook | null>(null);
  const [activeBook, setActiveBook] = useState<StoredBook | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooks(loadBooks()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3600);
    return () => window.clearTimeout(timer);
  }, [message]);

  const openFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const invalid = files.map(validateMarkdownFile).find(Boolean);
    if (invalid) {
      setMessage(invalid);
      return;
    }

    setBusy(true);
    try {
      const collator = new Intl.Collator("ko", { numeric: true, sensitivity: "base" });
      const sortedFiles = [...files].sort((a, b) => collator.compare(a.name, b.name));
      const contents = await Promise.all(sortedFiles.map(readMarkdownFile));

      if (sortedFiles.length === 1) {
        const file = sortedFiles[0];
        const markdown = contents[0];
        const title = convertMarkdown(markdown).title || readableTitle(file.name);
        const chapters = splitMarkdownIntoChapters(markdown, title).map((chapter) => ({
          ...chapter,
          id: createBookId(),
          fileName: file.name,
        }));
        const book: StoredBook = {
          id: createBookId(),
          title,
          author: "",
          chapters,
          updatedAt: Date.now(),
          lastChapterIndex: 0,
        };
        const result = saveBook(book);
        setBooks(result.books);
        setActiveBook(book);
        setMessage(
          result.saved
            ? `'${title}' 을(를) 책으로 열었습니다.`
            : "저장 공간이 부족해 책장에는 저장하지 못했지만 지금 읽을 수 있습니다.",
        );
        return;
      }

      setBookDraft({
        id: createBookId(),
        title: defaultBookTitle(sortedFiles),
        author: "",
        chapters: sortedFiles.map((file, index) => ({
          id: createBookId(),
          fileName: file.name,
          markdown: contents[index],
          title: convertMarkdown(contents[index]).title || readableTitle(file.name),
        })),
        updatedAt: Date.now(),
        lastChapterIndex: 0,
      });
      setMessage(null);
    } catch {
      setMessage("Markdown 파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }, []);

  const storeBook = useCallback((book: StoredBook) => {
    const result = saveBook(book);
    setBooks(result.books);
    setBookDraft(null);
    setActiveBook(book);
    setMessage(
      result.saved
        ? `'${book.title}' 책을 책장에 저장했습니다.`
        : "저장 공간이 부족해 책장에는 저장하지 못했지만 지금 읽을 수 있습니다.",
    );
  }, []);

  const removeBook = useCallback((id: string) => {
    const target = loadBooks().find((book) => book.id === id);
    if (!target || !window.confirm(`'${target.title}' 책을 책장에서 삭제할까요?`)) return;
    setBooks(deleteBook(id));
  }, []);

  if (bookDraft) {
    return (
      <BookBuilder book={bookDraft} onCancel={() => setBookDraft(null)} onSave={storeBook} />
    );
  }

  if (activeBook) {
    return (
      <BookReader
        book={activeBook}
        message={message}
        onBack={() => {
          setActiveBook(null);
          setBooks(loadBooks());
        }}
        onEdit={() => {
          setBookDraft(activeBook);
          setActiveBook(null);
        }}
        onChapterChange={(index) => {
          setActiveBook((current) =>
            current ? { ...current, lastChapterIndex: index } : current,
          );
          setBooks(updateBookReadingPosition(activeBook.id, index));
        }}
      />
    );
  }

  return (
    <BookHome
      books={books}
      busy={busy}
      message={message}
      onFiles={openFiles}
      onOpenBook={setActiveBook}
      onDeleteBook={removeBook}
    />
  );
}
