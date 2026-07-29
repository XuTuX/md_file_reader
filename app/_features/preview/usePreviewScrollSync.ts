"use client";

import { useCallback, useEffect, useRef } from "react";
import type { TocItem } from "../../_lib/markdown";
import { isPreviewToParentMessage, postToPreview } from "./previewMessages";
import { findNearestHeading } from "./scrollMapping";

type ViewMode = "source" | "preview" | "split";
const EDITOR_LINE_HEIGHT = 24;

export function usePreviewScrollSync(view: ViewMode, toc: TocItem[]) {
  const previewRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorLineRef = useRef<number | null>(null);
  const scrollRatioRef = useRef(0);
  const activeHeadingIdRef = useRef<string | null>(null);
  const lastEditorScrollRef = useRef({ top: 0, height: 0 });
  const latestViewRef = useRef(view);

  useEffect(() => {
    latestViewRef.current = view;
  }, [view]);

  const getEditorScrollState = useCallback(() => {
    if (textareaRef.current && textareaRef.current.clientHeight > 0) {
      lastEditorScrollRef.current = {
        top: textareaRef.current.scrollTop,
        height: textareaRef.current.clientHeight,
      };
    }
    return lastEditorScrollRef.current;
  }, []);

  const syncPreviewScroll = useCallback(() => {
    const { top, height } = getEditorScrollState();
    let ratio = scrollRatioRef.current;
    if (textareaRef.current && textareaRef.current.scrollHeight > height) {
      ratio = top / (textareaRef.current.scrollHeight - height);
    }

    const visibleLine = Math.max(0, Math.floor(top / EDITOR_LINE_HEIGHT));
    const cursorLine = cursorLineRef.current;
    const cursorY = typeof cursorLine === "number" ? cursorLine * EDITOR_LINE_HEIGHT : -1;
    const visibleCursor = cursorY >= top && cursorY <= top + height ? cursorLine : null;
    const heading = findNearestHeading(toc, visibleLine, visibleCursor);

    if (heading) {
      postToPreview(previewRef.current, {
        type: "markdown-document:scrollToHeading",
        id: heading.id,
      });
    } else {
      postToPreview(previewRef.current, {
        type: "markdown-document:scrollToRatio",
        ratio,
      });
    }
  }, [getEditorScrollState, toc]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== previewRef.current?.contentWindow) return;
      if (!isPreviewToParentMessage(event.data)) return;
      if (event.data.type === "markdown-document:activeHeading") {
        activeHeadingIdRef.current = event.data.id;
      } else if (event.data.type === "markdown-document:scrollRatio") {
        scrollRatioRef.current = event.data.ratio;
      } else if (
        event.data.type === "markdown-document:ready" &&
        (latestViewRef.current === "preview" || latestViewRef.current === "split")
      ) {
        syncPreviewScroll();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [syncPreviewScroll]);

  const prepareViewChange = useCallback(
    (nextView: ViewMode) => {
      getEditorScrollState();
      window.setTimeout(() => {
        if (nextView === "source" || nextView === "split") {
          const activeHeading = toc.find((item) => item.id === activeHeadingIdRef.current);
          if (textareaRef.current) {
            if (typeof activeHeading?.lineIndex === "number") {
              textareaRef.current.scrollTop = Math.max(
                0,
                activeHeading.lineIndex * EDITOR_LINE_HEIGHT - 16,
              );
            } else {
              const max = textareaRef.current.scrollHeight - textareaRef.current.clientHeight;
              textareaRef.current.scrollTop = scrollRatioRef.current * max;
            }
          }
        }
        if (nextView === "preview" || nextView === "split") syncPreviewScroll();
      }, 50);
    },
    [getEditorScrollState, syncPreviewScroll, toc],
  );

  return {
    previewRef,
    textareaRef,
    prepareViewChange,
    reportEditorScrollRatio: (ratio: number) => {
      scrollRatioRef.current = ratio;
    },
    reportCursorLine: (lineIndex: number) => {
      cursorLineRef.current = lineIndex;
    },
  };
}

