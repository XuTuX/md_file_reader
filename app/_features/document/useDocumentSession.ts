"use client";

import { useCallback, useReducer } from "react";
import type { DocumentSession } from "./types";

type Action =
  | { type: "load"; session: DocumentSession }
  | { type: "edit"; markdown: string }
  | { type: "rename"; title: string | null }
  | { type: "renameFile"; fileName: string }
  | { type: "close" };

export function documentSessionReducer(
  state: DocumentSession | null,
  action: Action,
): DocumentSession | null {
  switch (action.type) {
    case "load":
      return action.session;
    case "edit":
      return state ? { ...state, markdown: action.markdown } : state;
    case "rename":
      return state ? { ...state, titleOverride: action.title } : state;
    case "renameFile":
      return state ? { ...state, fileName: action.fileName } : state;
    case "close":
      return null;
  }
}

export function useDocumentSession() {
  const [session, dispatch] = useReducer(documentSessionReducer, null);

  const load = useCallback((next: DocumentSession) => {
    dispatch({ type: "load", session: next });
  }, []);

  const edit = useCallback((markdown: string) => {
    dispatch({ type: "edit", markdown });
  }, []);

  const rename = useCallback((title: string | null) => {
    dispatch({ type: "rename", title });
  }, []);

  const renameFile = useCallback((fileName: string) => {
    dispatch({ type: "renameFile", fileName });
  }, []);

  const close = useCallback(() => dispatch({ type: "close" }), []);

  return { session, load, edit, rename, renameFile, close };
}
