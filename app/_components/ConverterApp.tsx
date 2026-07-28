"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FileDropzone from "./FileDropzone";
import MarkdownSource from "./MarkdownSource";
import Preview from "./Preview";
import Toolbar, { type ViewMode } from "./Toolbar";
import { convertMarkdown, type TocItem } from "../_lib/markdown";
import { sanitizeHtml } from "../_lib/sanitize";
import { buildStandaloneHtml, toHtmlFileName } from "../_lib/exportHtml";
import { deriveFileNameFromMarkdown, readMarkdownFile, validateMarkdownFile } from "../_lib/readFile";
import { SAMPLE_FILE_NAME, SAMPLE_MARKDOWN } from "../_lib/sample";
import {
  DEFAULT_APPEARANCE,
  loadAppearance,
  saveAppearance,
  type AppearanceSettings,
  type Settings,
} from "../_lib/settings";
import SelectionTooltip from "./SelectionTooltip";
import AiAssistantPanel from "./AiAssistantPanel";
import { insertSummaryIntoMarkdown } from "../_lib/aiAssistant";
import {
  createDocumentId,
  deleteRecentDocument,
  loadRecentDocuments,
  saveRecentDocument,
  type StoredDocument,
} from "../_lib/documentStorage";
import {
  buildShareUrl,
  decodeSharedDocument,
  MAX_SHARE_URL_LENGTH,
} from "../_lib/shareDocument";

interface Rendered {
  bodyHtml: string;
  toc: TocItem[];
  title: string | null;
}

function baseName(fileName: string): string {
  return fileName.replace(/\.(md|markdown)$/i, "");
}

function downloadText(content: string, fileName: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 마크다운 원문 텍스트에서 특정 제목(headingText)을 가진 행 번호(0-indexed)를 찾는다 (H1~H6 전체 지원) */
function findHeadingLineIndex(markdownText: string, targetText: string): number {
  if (!markdownText || !targetText) return -1;
  const lines = markdownText.split("\n");
  const normalizedTarget = targetText.trim().toLowerCase().replace(/[`*_~]/g, "");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^#{1,6}\s+/.test(line)) {
      const lineText = line
        .replace(/^#{1,6}\s+/, "")
        .replace(/[`*_~]/g, "")
        .trim()
        .toLowerCase();
      if (lineText === normalizedTarget) return i;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^#{1,6}\s+/.test(line)) {
      const lineText = line
        .replace(/^#{1,6}\s+/, "")
        .replace(/[`*_~]/g, "")
        .trim()
        .toLowerCase();
      if (lineText.includes(normalizedTarget) || normalizedTarget.includes(lineText)) return i;
    }
  }

  return -1;
}

/** 마크다운 편집기(textarea)의 현재 스크롤 위치 및 커서 부근에 있는 가장 가까운 제목(#~######)을 찾는다 */
function findNearestHeadingFromTextarea(
  markdownText: string,
  scrollTop: number,
  clientHeight: number,
  cursorLineIndex?: number | null,
): string | null {
  if (!markdownText) return null;
  const lines = markdownText.split("\n");
  const lineHeight = 24; // font-mono leading-6 = 24px

  let startIndex = Math.max(0, Math.floor(scrollTop / lineHeight));

  if (typeof cursorLineIndex === "number" && cursorLineIndex >= 0) {
    const cursorY = cursorLineIndex * lineHeight;
    // 커서가 현재 보이는 뷰포트 내에 있을 때만 커서 위치를 우선합니다.
    if (cursorY >= scrollTop && cursorY <= scrollTop + clientHeight) {
      startIndex = Math.min(cursorLineIndex, lines.length - 1);
    }
  }

  // 1. 위 방향 탐색
  for (let i = startIndex; i >= 0; i--) {
    const line = lines[i].trim();
    if (/^#{1,6}\s+/.test(line)) {
      return line;
    }
  }

  // 2. 아래 방향 탐색 (첫 제목 이전 위치일 경우)
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^#{1,6}\s+/.test(line)) {
      return line;
    }
  }

  return null;
}

export default function ConverterApp() {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [debounced, setDebounced] = useState<string | null>(null);
  const [fileName, setFileName] = useState("document.md");
  /** 사용자가 문서 제목을 직접 고쳤을 때만 값이 들어간다. null 이면 H1 에서 자동으로 가져온다. */
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<AppearanceSettings>(loadAppearance);
  const [view, setView] = useState<ViewMode>("preview");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<StoredDocument[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dropping, setDropping] = useState(false);

  /* AI 문맥 질문 / 보충 관련 상태 */
  const [selectionText, setSelectionText] = useState<string | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const handleSelectText = useCallback(
    (text: string, rect: { top: number; left: number; width: number; height: number } | null) => {
      if (aiPanelOpen) return;
      if (!text || !rect) {
        setSelectionText(null);
        setSelectionRect(null);
        return;
      }
      setSelectionText(text);
      setSelectionRect(rect);
    },
    [aiPanelOpen],
  );

  const handleAddToDocument = useCallback(
    (selected: string, summaryContent: string) => {
      if (markdown === null) return;
      const updated = insertSummaryIntoMarkdown(markdown, selected, summaryContent);
      setMarkdown(updated);
      setDebounced(updated);
      setLastSavedAt(null);
      setSaveFailed(false);
      setNotice(`'${selected.slice(0, 12)}...' 대화 내용이 문서에 정리되어 반영되었습니다.`);
      setAiPanelOpen(false);
      setSelectionText(null);
      setSelectionRect(null);
    },
    [markdown],
  );

  const handleCloseAiPanel = useCallback(() => {
    setAiPanelOpen(false);
    setSelectionText(null);
    setSelectionRect(null);
  }, []);

  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRatioRef = useRef<number>(0);
  const activeHeadingIdRef = useRef<string | null>(null);
  
  const lastEditorScrollRef = useRef({ top: 0, height: 0 });
  const getEditorScrollState = useCallback(() => {
    if (textareaRef.current && textareaRef.current.clientHeight > 0) {
      lastEditorScrollRef.current = {
        top: textareaRef.current.scrollTop,
        height: textareaRef.current.clientHeight,
      };
    }
    return lastEditorScrollRef.current;
  }, []);

  const latestViewRef = useRef(view);
  useEffect(() => {
    latestViewRef.current = view;
  }, [view]);

  const handleEditorScrollRatio = useCallback((ratio: number) => {
    scrollRatioRef.current = ratio;
  }, []);

  /*
   * Markdown -> HTML 변환 + sanitize.
   * DOMPurify 는 DOM 이 필요하지만, debounced 가 null 이 아닌 상태는
   * 사용자가 파일을 연 뒤(=브라우저)에만 만들어지므로 렌더 중에 계산해도 안전하다.
   */
  const rendered = useMemo<Rendered | null>(() => {
    if (debounced === null) return null;
    const result = convertMarkdown(debounced);
    return {
      bodyHtml: sanitizeHtml(result.html),
      toc: result.toc,
      title: result.title,
    };
  }, [debounced]);

  /* 사용자가 직접 고치기 전까지는 첫 번째 H1 을 문서 제목으로 쓴다 */
  const docTitle = titleOverride ?? rendered?.title ?? baseName(fileName);

  const settings: Settings = useMemo(
    () => ({ ...appearance, docTitle, fileName }),
    [appearance, docTitle, fileName],
  );

  const cursorLineRef = useRef<number | null>(null);

  const handleCursorLineChange = useCallback((lineIndex: number) => {
    cursorLineRef.current = lineIndex;
  }, []);

  const syncPreviewScroll = useCallback(() => {
    if (!previewRef.current?.contentWindow) return;
    const { top: currentScrollTop, height: currentClientHeight } = getEditorScrollState();
    
    let targetHeadingId: string | null = null;
    let editorRatio = scrollRatioRef.current;

    if (textareaRef.current) {
      const scrollHeight = textareaRef.current.scrollHeight;
      if (scrollHeight > currentClientHeight) {
        editorRatio = currentScrollTop / (scrollHeight - currentClientHeight);
      }
    }

    if (markdown && rendered?.toc) {
      const headingLine = findNearestHeadingFromTextarea(
        markdown,
        currentScrollTop,
        currentClientHeight,
        cursorLineRef.current,
      );
      
      if (headingLine) {
        const plainText = headingLine.replace(/^#{1,6}\s+/, "").replace(/[`*_~]/g, "").trim();
        const normalizedSearch = plainText.toLowerCase();
        const matchedItem = rendered.toc.find((t) => {
          const normalizedToc = t.text.toLowerCase().replace(/[`*_~]/g, "");
          return normalizedToc === normalizedSearch || 
                 normalizedToc.includes(normalizedSearch) || 
                 normalizedSearch.includes(normalizedToc);
        });
        if (matchedItem) {
          targetHeadingId = matchedItem.id;
        }
      }
    }

    if (targetHeadingId) {
      previewRef.current.contentWindow.postMessage(
        { type: "markdown-document:scrollToHeading", id: targetHeadingId },
        "*",
      );
    } else {
      previewRef.current.contentWindow.postMessage(
        { type: "markdown-document:scrollToRatio", ratio: editorRatio },
        "*",
      );
    }
  }, [markdown, rendered, getEditorScrollState]);

  /* iframe 미리보기에서 전송하는 스크롤 상태를 수신한다. */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "markdown-document:activeHeading" && typeof event.data.id === "string") {
        activeHeadingIdRef.current = event.data.id;
      }
      if (event.data?.type === "markdown-document:scrollRatio" && typeof event.data.ratio === "number") {
        scrollRatioRef.current = event.data.ratio;
      }
      if (
        event.data?.type === "markdown-document:ready" &&
        (latestViewRef.current === "preview" || latestViewRef.current === "split")
      ) {
        syncPreviewScroll();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [syncPreviewScroll]);

  /* 탭(문서/편집/분할) 전환 시 제목(## 목차) 위치 기반 스크롤 동기화 */
  const handleViewChange = useCallback(
    (newView: ViewMode) => {
      // 뷰 전환 전 스크롤 상태 저장
      getEditorScrollState();

      setView(newView);

      window.setTimeout(() => {
        // 1. 문서 -> 편집 전환 시: 미리보기에서 가장 가깝게 읽고 있던 제목(#~######) 위치로 편집기 스크롤
        if (newView === "source" || newView === "split") {
          let lineIndex = -1;

          if (activeHeadingIdRef.current && rendered?.toc && markdown) {
            const headingItem = rendered.toc.find((t) => t.id === activeHeadingIdRef.current);
            if (headingItem) {
              lineIndex = findHeadingLineIndex(markdown, headingItem.text);
            }
          }

          if (textareaRef.current) {
            if (lineIndex >= 0) {
              textareaRef.current.scrollTop = Math.max(0, lineIndex * 24 - 16);
            } else {
              const max = textareaRef.current.scrollHeight - textareaRef.current.clientHeight;
              textareaRef.current.scrollTop = scrollRatioRef.current * max;
            }
          }
        }

        // 2. 편집 -> 문서 전환 시: 편집기의 상단/커서 위치의 가장 가까운 제목(#~######) 위치로 미리보기 스크롤
        if (newView === "preview" || newView === "split") {
          syncPreviewScroll();
        }
      }, 50);
    },
    [markdown, rendered, getEditorScrollState, syncPreviewScroll],
  );

  /* 설정 저장 */
  useEffect(() => {
    saveAppearance(appearance);
  }, [appearance]);

  /* 편집 중 과도한 재변환을 막는다 */
  useEffect(() => {
    if (markdown === null) return;
    const timer = window.setTimeout(() => setDebounced(markdown), 220);
    return () => window.clearTimeout(timer);
  }, [markdown]);

  /* 분할보기(split) 모드에서는 편집 공간을 넓게 쓰기 위해 미리보기 프레임 안의 목차를 숨긴다 */
  const previewSettings: Settings = useMemo(() => {
    if (view === "split") {
      return { ...settings, showToc: false };
    }
    return settings;
  }, [settings, view]);

  const fullHtml = useMemo(() => {
    if (!rendered || debounced === null) return "";
    return buildStandaloneHtml({
      bodyHtml: rendered.bodyHtml,
      toc: rendered.toc,
      settings,
      markdown: debounced,
    });
  }, [rendered, settings, debounced]);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      if (key === "docTitle") {
        setTitleOverride(value as string);
        setLastSavedAt(null);
        setSaveFailed(false);
        return;
      }
      if (key === "fileName") {
        setFileName(value as string);
        setLastSavedAt(null);
        setSaveFailed(false);
        return;
      }
      setAppearance((prev) => ({ ...prev, [key]: value }) as AppearanceSettings);
    },
    [],
  );

  const loadMarkdown = useCallback(
    (text: string, name: string, id = createDocumentId(), savedTitle?: string, savedAt?: number) => {
      const title = savedTitle ?? convertMarkdown(text).title ?? baseName(name);
      const persistedAt = savedAt ?? Date.now();
      const savedDocuments = saveRecentDocument({
        id,
        title,
        fileName: name,
        markdown: text,
        updatedAt: persistedAt,
      });
      const persisted = savedDocuments.some(
        (document) => document.id === id && document.updatedAt === persistedAt,
      );

      setTitleOverride(savedTitle ?? null);
      setMarkdown(text);
      setDebounced(text);
      setFileName(name);
      setDocumentId(id);
      setRecentDocuments(savedDocuments);
      setLastSavedAt(persisted ? persistedAt : null);
      setSaveFailed(!persisted);
      setView("preview");
      setError(null);
    },
    [],
  );

  /* 공유 링크가 있으면 우선 열고, 아니면 마지막 작업을 자동 복구한다. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedDocuments = loadRecentDocuments();
      setRecentDocuments(savedDocuments);

      const shared = decodeSharedDocument(window.location.hash);
      if (shared) {
        loadMarkdown(shared.markdown, shared.fileName, createDocumentId(), shared.title);
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        setNotice("공유받은 문서를 열었습니다. 이 브라우저에 자동 저장됩니다.");
        return;
      }

      const latest = savedDocuments[0];
      if (latest) {
        loadMarkdown(latest.markdown, latest.fileName, latest.id, latest.title, latest.updatedAt);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMarkdown]);

  /* 문서 변경 후 잠시 기다렸다가 브라우저에 자동 저장한다. */
  useEffect(() => {
    if (markdown === null || documentId === null) return;
    const timer = window.setTimeout(() => {
      const savedAt = Date.now();
      const next = saveRecentDocument({
        id: documentId,
        title: docTitle || baseName(fileName),
        fileName,
        markdown,
        updatedAt: savedAt,
      });
      setRecentDocuments(next);
      const saved = next.some(
        (document) => document.id === documentId && document.updatedAt === savedAt,
      );
      setSaveFailed(!saved);
      if (saved) setLastSavedAt(savedAt);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [docTitle, documentId, fileName, markdown]);

  /* 자동 저장 대기 중 새로고침해도 마지막 편집 내용을 잃지 않도록 동기 저장한다. */
  useEffect(() => {
    if (markdown === null || documentId === null) return;
    const handleBeforeUnload = () => {
      saveRecentDocument({
        id: documentId,
        title: docTitle || baseName(fileName),
        fileName,
        markdown,
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [docTitle, documentId, fileName, markdown]);

  const handleFile = useCallback(
    async (file: File) => {
      const problem = validateMarkdownFile(file);
      if (problem) {
        setError(problem);
        return;
      }
      setBusy(true);
      try {
        const text = await readMarkdownFile(file);
        loadMarkdown(text, file.name, createDocumentId());
      } catch {
        setError(`'${file.name}' 을(를) 읽는 중 오류가 발생했습니다.`);
      } finally {
        setBusy(false);
      }
    },
    [loadMarkdown],
  );

  const handlePasteText = useCallback(
    (text: string, name?: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setError("붙여넣은 텍스트가 비어 있습니다.");
        return;
      }
      const derivedName = name || deriveFileNameFromMarkdown(trimmed, "pasted.md");
      loadMarkdown(trimmed, derivedName, createDocumentId());
      setNotice("클립보드의 Markdown 텍스트를 불러왔습니다.");
    },
    [loadMarkdown],
  );

  const handleSample = useCallback(() => {
    loadMarkdown(SAMPLE_MARKDOWN, SAMPLE_FILE_NAME, createDocumentId());
  }, [loadMarkdown]);

  const handleDownloadHtml = useCallback(() => {
    if (!fullHtml) return;
    const name = toHtmlFileName(fileName);
    downloadText(fullHtml, name, "text/html;charset=utf-8");
    setNotice(`${name} 을(를) 저장했습니다.`);
  }, [fullHtml, fileName]);

  const handleDownloadMarkdown = useCallback(() => {
    if (markdown === null) return;
    const name = /\.(md|markdown)$/i.test(fileName) ? fileName : `${baseName(fileName)}.md`;
    downloadText(markdown, name, "text/markdown;charset=utf-8");
    setNotice(`${name} 원문을 저장했습니다.`);
  }, [fileName, markdown]);

  const handlePrint = useCallback(() => {
    previewRef.current?.contentWindow?.postMessage({ type: "markdown-document:print" }, "*");
  }, []);

  const handleShare = useCallback(async () => {
    if (markdown === null) return;
    const url = buildShareUrl({ title: docTitle, fileName, markdown }, window.location);
    if (url.length > MAX_SHARE_URL_LENGTH) {
      setError("문서가 길어 링크로 공유할 수 없습니다. HTML 파일로 내보낸 뒤 공유해 주세요.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setNotice("공유 링크를 복사했습니다. 문서는 링크 안에만 담기며 서버로 올라가지 않습니다.");
    } catch {
      setError("공유 링크를 클립보드에 복사하지 못했습니다.");
    }
  }, [docTitle, fileName, markdown]);

  const handleGoHome = useCallback(() => {
    if (markdown !== null && documentId !== null) {
      const savedAt = Date.now();
      const next = saveRecentDocument({
        id: documentId,
        title: docTitle || baseName(fileName),
        fileName,
        markdown,
        updatedAt: savedAt,
      });
      if (!next.some((document) => document.id === documentId && document.updatedAt === savedAt)) {
        setSaveFailed(true);
        setError("브라우저 저장 공간이 부족해 문서함으로 이동하지 못했습니다. Markdown을 먼저 내보내 주세요.");
        return;
      }
      setRecentDocuments(next);
    } else {
      setRecentDocuments(loadRecentDocuments());
    }
    setMarkdown(null);
    setDebounced(null);
    setDocumentId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setSelectionText(null);
    setSelectionRect(null);
    setAiPanelOpen(false);
  }, [docTitle, documentId, fileName, markdown]);

  const handleOpenRecent = useCallback(
    (document: StoredDocument) => {
      loadMarkdown(
        document.markdown,
        document.fileName,
        document.id,
        document.title,
        document.updatedAt,
      );
    },
    [loadMarkdown],
  );

  const handleDeleteRecent = useCallback((id: string) => {
    setRecentDocuments(deleteRecentDocument(id));
  }, []);

  const handleReset = useCallback(() => {
    if (!window.confirm("변환 설정을 기본값으로 되돌릴까요? Markdown 내용은 유지됩니다.")) {
      return;
    }
    setAppearance(DEFAULT_APPEARANCE);
    setTitleOverride(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setNotice("설정을 기본값으로 되돌렸습니다.");
  }, []);

  /* 알림은 잠시 뒤 스스로 사라진다 */
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /* 편집 화면에서는 오류 메시지도 토스트이므로 자동으로 닫는다 */
  useEffect(() => {
    if (!error || markdown === null) return;
    const timer = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(timer);
  }, [error, markdown]);

  if (markdown === null) {
    return (
      <main className="flex flex-1 items-center justify-center bg-white">
        <FileDropzone
          onFile={handleFile}
          onPasteText={handlePasteText}
          onSample={handleSample}
          recentDocuments={recentDocuments}
          onOpenRecent={handleOpenRecent}
          onDeleteRecent={handleDeleteRecent}
          error={error}
          busy={busy}
        />
      </main>
    );
  }

  const showSource = view === "source" || view === "split";
  const showPreview = view === "preview" || view === "split";

  return (
    <div
      className="flex h-dvh flex-col bg-stone-50"
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current += 1;
        setDropping(true);
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
      }}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDropping(false);
        }
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current = 0;
        setDropping(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
    >
      <Toolbar
        fileName={fileName}
        docTitle={docTitle}
        settings={settings}
        headingCount={rendered?.toc.length ?? 0}
        view={view}
        saveLabel={
          saveFailed
            ? "자동 저장 실패"
            : lastSavedAt
            ? `자동 저장됨 ${new Date(lastSavedAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "자동 저장 중…"
        }
        onChangeView={handleViewChange}
        onChangeSetting={updateSetting}
        onOpenFile={() => fileInputRef.current?.click()}
        onGoHome={handleGoHome}
        onDownloadHtml={handleDownloadHtml}
        onDownloadMarkdown={handleDownloadMarkdown}
        onPrint={handlePrint}
        onShare={() => void handleShare()}
        onReset={handleReset}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        className="sr-only"
        aria-label="Markdown 파일 선택"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
          <section
            className={`min-h-0 min-w-0 border-stone-200 ${
              !showSource
                ? "hidden"
                : showPreview
                ? "h-1/2 border-b md:h-auto md:w-2/5 md:border-b-0 md:border-r"
                : "flex-1"
            }`}
          >
            <MarkdownSource
              ref={textareaRef}
              value={markdown}
              onChange={(value) => {
                setMarkdown(value);
                setLastSavedAt(null);
                setSaveFailed(false);
              }}
              onSelectText={handleSelectText}
              onScrollRatio={handleEditorScrollRatio}
              onCursorLineChange={handleCursorLineChange}
            />
          </section>

          <section
            className={`min-h-0 min-w-0 bg-white ${
              !showPreview ? "hidden" : "flex-1"
            }`}
          >
            <Preview
              ref={previewRef}
              html={fullHtml}
              settings={previewSettings}
              title={docTitle || fileName}
              onSelectText={handleSelectText}
            />
          </section>
        </main>
      </div>



      {dropping ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-stone-900/20">
          <p className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-stone-700 shadow-lg">
            새 Markdown 파일을 놓으면 열립니다
          </p>
        </div>
      ) : null}

      {/* AI 질문 툴팁 & 대화 패널 */}
      {selectionRect && selectionText && !aiPanelOpen ? (
        <SelectionTooltip rect={selectionRect} onAsk={() => setAiPanelOpen(true)} />
      ) : null}

      {aiPanelOpen && selectionText ? (
        <AiAssistantPanel
          selectedText={selectionText}
          onAddToDocument={handleAddToDocument}
          onClose={handleCloseAiPanel}
        />
      ) : null}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      >
        {error ? (
          <span className="block rounded-md bg-red-600 px-4 py-2 text-[13px] text-white shadow-lg">
            {error}
          </span>
        ) : notice ? (
          <span className="block rounded-md bg-stone-800 px-4 py-2 text-[13px] text-white shadow-lg">
            {notice}
          </span>
        ) : null}
      </div>
    </div>
  );
}
