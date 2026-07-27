"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FileDropzone from "./FileDropzone";
import MarkdownSource from "./MarkdownSource";
import Preview from "./Preview";
import Toolbar, { type ViewMode } from "./Toolbar";
import { CloseIcon } from "./icons";
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

interface Rendered {
  bodyHtml: string;
  toc: TocItem[];
  title: string | null;
}

function baseName(fileName: string): string {
  return fileName.replace(/\.(md|markdown)$/i, "");
}

export default function ConverterApp() {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [debounced, setDebounced] = useState<string | null>(null);
  const [fileName, setFileName] = useState("document.md");
  /** 사용자가 문서 제목을 직접 고쳤을 때만 값이 들어간다. null 이면 H1 에서 자동으로 가져온다. */
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<AppearanceSettings>(loadAppearance);
  const [view, setView] = useState<ViewMode>("preview");
  const [fullscreen, setFullscreen] = useState(false);
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
  const fullscreenRef = useRef<HTMLIFrameElement>(null);

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
        return;
      }
      if (key === "fileName") {
        setFileName(value as string);
        return;
      }
      setAppearance((prev) => ({ ...prev, [key]: value }) as AppearanceSettings);
    },
    [],
  );

  const loadMarkdown = useCallback((text: string, name: string) => {
    setTitleOverride(null);
    setMarkdown(text);
    setDebounced(text);
    setFileName(name);
    setView("preview");
    setError(null);
  }, []);

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
        loadMarkdown(text, file.name);
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
      loadMarkdown(trimmed, derivedName);
      setNotice("클립보드의 Markdown 텍스트를 불러왔습니다.");
    },
    [loadMarkdown],
  );

  const handleSample = useCallback(() => {
    loadMarkdown(SAMPLE_MARKDOWN, SAMPLE_FILE_NAME);
  }, [loadMarkdown]);

  const handleDownload = useCallback(() => {
    if (!fullHtml) return;
    const name = toHtmlFileName(fileName);
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`${name} 을(를) 저장했습니다.`);
  }, [fullHtml, fileName]);

  const handlePrint = useCallback(() => {
    const frame = fullscreen ? fullscreenRef.current : previewRef.current;
    frame?.contentWindow?.postMessage({ type: "md2notion:print" }, "*");
  }, [fullscreen]);

  const handleReset = useCallback(() => {
    if (!window.confirm("변환 설정을 기본값으로 되돌릴까요? Markdown 내용은 유지됩니다.")) {
      return;
    }
    setAppearance(DEFAULT_APPEARANCE);
    setTitleOverride(null);
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

  /* 전체 화면 미리보기는 Esc 로 닫는다 */
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  if (markdown === null) {
    return (
      <main className="flex flex-1 items-center justify-center bg-white">
        <FileDropzone
          onFile={handleFile}
          onPasteText={handlePasteText}
          onSample={handleSample}
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
        onChangeView={setView}
        onChangeSetting={updateSetting}
        onOpenFile={() => fileInputRef.current?.click()}
        onDownload={handleDownload}
        onFullscreen={() => setFullscreen(true)}
        onPrint={handlePrint}
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
          {showSource ? (
            <section
              className={`min-h-0 min-w-0 border-stone-200 ${
                showPreview
                  ? "h-1/2 border-b md:h-auto md:w-2/5 md:border-b-0 md:border-r"
                  : "flex-1"
              }`}
            >
              <MarkdownSource
                value={markdown}
                onChange={setMarkdown}
                onSelectText={handleSelectText}
              />
            </section>
          ) : null}

          {showPreview ? (
            <section className="min-h-0 min-w-0 flex-1 bg-white">
              <Preview
                ref={previewRef}
                html={fullHtml}
                settings={settings}
                title={docTitle || fileName}
                onSelectText={handleSelectText}
              />
            </section>
          ) : null}
        </main>
      </div>

      {fullscreen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-stone-200 px-3 py-2">
            <span className="truncate text-[13px] text-stone-600">
              {docTitle || fileName}
            </span>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-2.5 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100"
            >
              <CloseIcon />
              닫기 (Esc)
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Preview
              ref={fullscreenRef}
              html={fullHtml}
              settings={settings}
              title={docTitle || fileName}
              onSelectText={handleSelectText}
            />
          </div>
        </div>
      ) : null}

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
