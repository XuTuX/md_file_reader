"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteRecentDocument,
  loadRecentDocuments,
  saveRecentDocument,
  type StoredDocument,
} from "../../_lib/documentStorage";

type SaveInput = Omit<StoredDocument, "updatedAt"> & { updatedAt?: number };

export function useDocumentLibrary(autosaveDocument: SaveInput | null) {
  const [recentDocuments, setRecentDocuments] = useState<StoredDocument[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const loadDocuments = useCallback(() => {
    const documents = loadRecentDocuments();
    setRecentDocuments(documents);
    return documents;
  }, []);

  const persist = useCallback((document: SaveInput) => {
    const savedAt = document.updatedAt ?? Date.now();
    const result = saveRecentDocument({ ...document, updatedAt: savedAt });
    setRecentDocuments(result.documents);
    setSaveFailed(!result.saved);
    setLastSavedAt(result.saved ? savedAt : null);
    return result.saved;
  }, []);

  const markDirty = useCallback(() => {
    setLastSavedAt(null);
    setSaveFailed(false);
  }, []);

  const remove = useCallback((id: string) => {
    setRecentDocuments(deleteRecentDocument(id));
  }, []);

  const resetStatus = useCallback(() => {
    setLastSavedAt(null);
    setSaveFailed(false);
  }, []);

  useEffect(() => {
    if (!autosaveDocument) return;
    const timer = window.setTimeout(() => persist(autosaveDocument), 650);
    return () => window.clearTimeout(timer);
  }, [autosaveDocument, persist]);

  useEffect(() => {
    if (!autosaveDocument) return;
    const handleBeforeUnload = () => saveRecentDocument(autosaveDocument);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [autosaveDocument]);

  return {
    recentDocuments,
    lastSavedAt,
    saveFailed,
    loadDocuments,
    persist,
    markDirty,
    remove,
    resetStatus,
  };
}
