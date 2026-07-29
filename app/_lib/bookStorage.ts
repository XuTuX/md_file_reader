export interface BookChapter {
  id: string;
  title: string;
  fileName: string;
  markdown: string;
}

export interface StoredBook {
  id: string;
  title: string;
  author: string;
  chapters: BookChapter[];
  updatedAt: number;
  lastChapterIndex: number;
}

export interface SaveBookResult {
  books: StoredBook[];
  saved: boolean;
}

const STORAGE_KEY = "markdown-books:v1";
const MAX_STORED_BOOKS = 6;

function isBookChapter(value: unknown): value is BookChapter {
  if (!value || typeof value !== "object") return false;
  const chapter = value as Record<string, unknown>;
  return (
    typeof chapter.id === "string" &&
    typeof chapter.title === "string" &&
    typeof chapter.fileName === "string" &&
    typeof chapter.markdown === "string"
  );
}

function isStoredBook(value: unknown): value is StoredBook {
  if (!value || typeof value !== "object") return false;
  const book = value as Record<string, unknown>;
  return (
    typeof book.id === "string" &&
    typeof book.title === "string" &&
    typeof book.author === "string" &&
    Array.isArray(book.chapters) &&
    book.chapters.length > 0 &&
    book.chapters.every(isBookChapter) &&
    typeof book.updatedAt === "number" &&
    Number.isFinite(book.updatedAt) &&
    typeof book.lastChapterIndex === "number" &&
    Number.isInteger(book.lastChapterIndex)
  );
}

export function createBookId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `book-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeBook(book: StoredBook): StoredBook {
  return {
    ...book,
    lastChapterIndex: Math.min(Math.max(book.lastChapterIndex, 0), book.chapters.length - 1),
  };
}

function normalizeBooks(value: unknown): StoredBook[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isStoredBook)
    .map(normalizeBook)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_STORED_BOOKS);
}

export function loadBooks(): StoredBook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeBooks(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveBook(
  book: Omit<StoredBook, "updatedAt"> & { updatedAt?: number },
): SaveBookResult {
  if (typeof window === "undefined") return { books: [], saved: false };
  const stored: StoredBook = normalizeBook({
    ...book,
    updatedAt: book.updatedAt ?? Date.now(),
  });
  const next = [stored, ...loadBooks().filter((item) => item.id !== stored.id)]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_STORED_BOOKS);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return { books: loadBooks(), saved: false };
  }
  return { books: next, saved: true };
}

export function updateBookReadingPosition(id: string, lastChapterIndex: number): StoredBook[] {
  const books = loadBooks();
  const next = books.map((book) =>
    book.id === id
      ? normalizeBook({ ...book, lastChapterIndex })
      : book,
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return books;
  }
}

export function deleteBook(id: string): StoredBook[] {
  if (typeof window === "undefined") return [];
  const next = loadBooks().filter((book) => book.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return loadBooks();
  }
  return next;
}
