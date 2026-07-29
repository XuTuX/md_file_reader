"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AiAssistantPanel from "./AiAssistantPanel";
import FileDropzone from "./FileDropzone";
import MarkdownSource from "./MarkdownSource";
import Preview from "./Preview";
import SelectionTooltip from "./SelectionTooltip";
import Toolbar, { type ViewMode } from "./Toolbar";
import type { SelectionRect } from "../_features/document/types";
import { useDocumentLibrary } from "../_features/document/useDocumentLibrary";
import { useDocumentSession } from "../_features/document/useDocumentSession";
import { postToPreview } from "../_features/preview/previewMessages";
import {
  buildDocumentHtml,
  buildPreviewHtml,
  renderDocument,
  type PreviewStructureSettings,
} from "../_features/preview/renderDocument";
import { usePreviewScrollSync } from "../_features/preview/usePreviewScrollSync";
import { insertSummaryIntoMarkdown } from "../_lib/aiAssistant";
import { createDocumentId, type StoredDocument } from "../_lib/documentStorage";
import { toHtmlFileName } from "../_lib/exportHtml";
import { deriveFileNameFromMarkdown, readMarkdownFile, validateMarkdownFile } from "../_lib/readFile";
import { SAMPLE_FILE_NAME, SAMPLE_MARKDOWN } from "../_lib/sample";
import {
  DEFAULT_APPEARANCE,
  loadAppearance,
  saveAppearance,
  type AppearanceSettings,
  type Settings,
} from "../_lib/settings";
import {
  buildShareUrl,
  decodeSharedDocument,
  MAX_SHARE_URL_LENGTH,
} from "../_lib/shareDocument";
import { downloadText } from "../_shared/download";

function baseName(fileName: string): string {
  return fileName.replace(/\.(md|markdown)$/i, "");
}

export default function ConverterApp() {
  const {
    session,
    load: loadSession,
    edit: editMarkdown,
    rename,
    renameFile,
    close,
  } = useDocumentSession();
  const markdown = session?.markdown ?? null;
  const fileName = session?.fileName ?? "document.md";
  const [debounced, setDebounced] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<AppearanceSettings>(loadAppearance);
  const [view, setView] = useState<ViewMode>("preview");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [selectionText, setSelectionText] = useState<string | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const rendered = useMemo(
    () => (debounced === null ? null : renderDocument(debounced)),
    [debounced],
  );
  const docTitle = session?.titleOverride ?? rendered?.title ?? baseName(fileName);
  const settings = useMemo<Settings>(
    () => ({ ...appearance, docTitle, fileName }),
    [appearance, docTitle, fileName],
  );
  const autosaveDocument = useMemo(
    () =>
      session
        ? {
            id: session.id,
            title: docTitle || baseName(session.fileName),
            fileName: session.fileName,
            markdown: session.markdown,
          }
        : null,
    [docTitle, session],
  );
  const {
    recentDocuments,
    lastSavedAt,
    saveFailed,
    loadDocuments,
    persist,
    markDirty,
    remove,
    resetStatus,
  } = useDocumentLibrary(autosaveDocument);

  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveAppearance(appearance);
  }, [appearance]);

  useEffect(() => {
    if (markdown === null) return;
    const timer = window.setTimeout(() => setDebounced(markdown), 220);
    return () => window.clearTimeout(timer);
  }, [markdown]);

  const previewSettings = useMemo<Settings>(
    () => (view === "split" ? { ...settings, showToc: false } : settings),
    [settings, view],
  );

  const previewStructure = useMemo<PreviewStructureSettings>(
    () => ({
      showToc: previewSettings.showToc,
      tocDepth: previewSettings.tocDepth,
      showCopyButton: previewSettings.showCopyButton,
    }),
    [
      previewSettings.showCopyButton,
      previewSettings.showToc,
      previewSettings.tocDepth,
    ],
  );

  const previewHtml = useMemo(() => {
    if (!rendered || debounced === null) return "";
    return buildPreviewHtml(debounced, rendered, previewStructure);
  }, [debounced, previewStructure, rendered]);

  const {
    previewRef,
    textareaRef,
    prepareViewChange,
    reportEditorScrollRatio,
    reportCursorLine,
  } = usePreviewScrollSync(view, rendered?.toc ?? []);

  const handleViewChange = useCallback((nextView: ViewMode) => {
    setView(nextView);
    prepareViewChange(nextView);
  }, [prepareViewChange]);

  const loadMarkdown = useCallback(
    (text: string, name: string, id = createDocumentId(), savedTitle?: string, savedAt?: number) => {
      const detectedTitle = renderDocument(text).title;
      const title = savedTitle ?? detectedTitle ?? baseName(name);
      loadSession({ id, markdown: text, fileName: name, titleOverride: savedTitle ?? null });
      setDebounced(text);
      persist({ id, title, fileName: name, markdown: text, updatedAt: savedAt });
      setView("preview");
      setError(null);
    },
    [loadSession, persist],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedDocuments = loadDocuments();
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
  }, [loadDocuments, loadMarkdown]);

  const handleSelectText = useCallback(
    (text: string, rect: SelectionRect | null) => {
      if (aiPanelOpen) return;
      setSelectionText(text || null);
      setSelectionRect(text && rect ? rect : null);
    },
    [aiPanelOpen],
  );

  const handleAddToDocument = useCallback(
    (selected: string, summary: string) => {
      if (markdown === null) return;
      const updated = insertSummaryIntoMarkdown(markdown, selected, summary);
      editMarkdown(updated);
      setDebounced(updated);
      markDirty();
      setNotice(`'${selected.slice(0, 12)}...' 대화 내용이 문서에 정리되어 반영되었습니다.`);
      setAiPanelOpen(false);
      setSelectionText(null);
      setSelectionRect(null);
    },
    [editMarkdown, markdown, markDirty],
  );

  const handleCloseAiPanel = useCallback(() => {
    setAiPanelOpen(false);
    setSelectionText(null);
    setSelectionRect(null);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      if (key === "docTitle") {
        rename(value as string);
        markDirty();
      } else if (key === "fileName") {
        renameFile(value as string);
        markDirty();
      } else {
        setAppearance((current) => ({ ...current, [key]: value }) as AppearanceSettings);
      }
    },
    [markDirty, rename, renameFile],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const problem = validateMarkdownFile(file);
      if (problem) {
        setError(problem);
        return;
      }
      setBusy(true);
      try {
        loadMarkdown(await readMarkdownFile(file), file.name, createDocumentId());
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
      loadMarkdown(
        trimmed,
        name || deriveFileNameFromMarkdown(trimmed, "pasted.md"),
        createDocumentId(),
      );
      setNotice("클립보드의 Markdown 텍스트를 불러왔습니다.");
    },
    [loadMarkdown],
  );

  const handleDownloadHtml = useCallback(() => {
    if (markdown === null) return;
    const name = toHtmlFileName(fileName);
    downloadText(
      buildDocumentHtml(markdown, settings),
      name,
      "text/html;charset=utf-8",
    );
    setNotice(`${name} 을(를) 저장했습니다.`);
  }, [fileName, markdown, settings]);

  const handleDownloadMarkdown = useCallback(() => {
    if (markdown === null) return;
    const name = /\.(md|markdown)$/i.test(fileName) ? fileName : `${baseName(fileName)}.md`;
    downloadText(markdown, name, "text/markdown;charset=utf-8");
    setNotice(`${name} 원문을 저장했습니다.`);
  }, [fileName, markdown]);

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
    if (autosaveDocument && !persist(autosaveDocument)) {
      setError("브라우저 저장 공간이 부족해 문서함으로 이동하지 못했습니다. Markdown을 먼저 내보내 주세요.");
      return;
    }
    close();
    setDebounced(null);
    resetStatus();
    setSelectionText(null);
    setSelectionRect(null);
    setAiPanelOpen(false);
  }, [autosaveDocument, close, persist, resetStatus]);

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

  const handleReset = useCallback(() => {
    if (!window.confirm("변환 설정을 기본값으로 되돌릴까요? Markdown 내용은 유지됩니다.")) return;
    setAppearance(DEFAULT_APPEARANCE);
    rename(null);
    markDirty();
    setNotice("설정을 기본값으로 되돌렸습니다.");
  }, [markDirty, rename]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

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
          onSample={() => loadMarkdown(SAMPLE_MARKDOWN, SAMPLE_FILE_NAME, createDocumentId())}
          recentDocuments={recentDocuments}
          onOpenRecent={handleOpenRecent}
          onDeleteRecent={remove}
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
        onPrint={() => postToPreview(previewRef.current, { type: "markdown-document:print" })}
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
                editMarkdown(value);
                markDirty();
              }}
              onSelectText={handleSelectText}
              onScrollRatio={reportEditorScrollRatio}
              onCursorLineChange={reportCursorLine}
            />
          </section>

          <section className={`min-h-0 min-w-0 bg-white ${!showPreview ? "hidden" : "flex-1"}`}>
            <Preview
              ref={previewRef}
              html={previewHtml}
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
