export interface StoredDocument {
  id: string;
  title: string;
  fileName: string;
  markdown: string;
  updatedAt: number;
}

const STORAGE_KEY = "markdown-documents:v1";
const MAX_RECENT_DOCUMENTS = 8;

function isStoredDocument(value: unknown): value is StoredDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Record<string, unknown>;
  return (
    typeof document.id === "string" &&
    typeof document.title === "string" &&
    typeof document.fileName === "string" &&
    typeof document.markdown === "string" &&
    typeof document.updatedAt === "number"
  );
}

function normalizeDocuments(value: unknown): StoredDocument[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isStoredDocument)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_RECENT_DOCUMENTS);
}

export function createDocumentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadRecentDocuments(): StoredDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeDocuments(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveRecentDocument(
  document: Omit<StoredDocument, "updatedAt"> & { updatedAt?: number },
): StoredDocument[] {
  if (typeof window === "undefined") return [];
  const saved: StoredDocument = {
    ...document,
    updatedAt: document.updatedAt ?? Date.now(),
  };
  const next = [saved, ...loadRecentDocuments().filter((item) => item.id !== saved.id)]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_RECENT_DOCUMENTS);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return loadRecentDocuments();
  }
  return next;
}

export function deleteRecentDocument(id: string): StoredDocument[] {
  if (typeof window === "undefined") return [];
  const next = loadRecentDocuments().filter((document) => document.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return loadRecentDocuments();
  }
  return next;
}

