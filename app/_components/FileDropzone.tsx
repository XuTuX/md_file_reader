"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_FILE_BYTES, formatBytes } from "../_lib/readFile";
import { ClipboardIcon, EditIcon, FileIcon, UploadIcon } from "./icons";

interface Props {
  onFile: (file: File) => void;
  onPasteText: (text: string) => void;
  onSample: () => void;
  error: string | null;
  busy: boolean;
}

export default function FileDropzone({
  onFile,
  onPasteText,
  onSample,
  error,
  busy,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const directTextRef = useRef<HTMLTextAreaElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [directText, setDirectText] = useState("");
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const dragDepth = useRef(0);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  /* 전체 화면 paste 이벤트 감지 */
  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      // 텍스트 영역 또는 입력 필드 내부에서의 붙여넣기는 기본 동작에 맡김
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          (active instanceof HTMLElement && active.isContentEditable))
      ) {
        return;
      }

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      // 1. 클립보드에 파일이 복사되어 있는 경우
      if (clipboardData.files && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file) {
          event.preventDefault();
          onFile(file);
          return;
        }
      }

      // 2. 클립보드에 Markdown 텍스트가 있는 경우
      const text =
        clipboardData.getData("text/plain") || clipboardData.getData("text");
      if (text && text.trim()) {
        event.preventDefault();
        onPasteText(text);
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [onFile, onPasteText]);

  /* Dropzone 상에서 Paste 처리 */
  const handleDropzonePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      if (clipboardData.files && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file) {
          event.preventDefault();
          onFile(file);
          return;
        }
      }

      const text =
        clipboardData.getData("text/plain") || clipboardData.getData("text");
      if (text && text.trim()) {
        event.preventDefault();
        onPasteText(text);
      }
    },
    [onFile, onPasteText],
  );

  /* 드래그 앤 드롭 처리 (파일 및 텍스트) */
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        onFile(file);
        return;
      }

      const droppedText = event.dataTransfer.getData("text/plain");
      if (droppedText && droppedText.trim()) {
        onPasteText(droppedText);
      }
    },
    [onFile, onPasteText],
  );

  /* 브라우저 Clipboard API로 읽기 */
  const handleClipboardRead = useCallback(async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setShowDirectInput(true);
        setPasteNotice(
          "클립보드 API가 지원되지 않습니다. 아래 입력란에 Ctrl+V (Cmd+V)로 붙여넣어 주세요.",
        );
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setPasteNotice("클립보드에 복사된 텍스트가 없습니다.");
        return;
      }
      onPasteText(text);
    } catch (_err) {
      setShowDirectInput(true);
      setPasteNotice(
        "클립보드 읽기 권한이 차단되었습니다. 아래 입력란에 Ctrl+V (Cmd+V)로 붙여넣어 주세요.",
      );
      setTimeout(() => directTextRef.current?.focus(), 100);
    }
  }, [onPasteText]);

  /* 직접 입력 폼 제출 */
  const handleDirectSubmit = useCallback(() => {
    if (!directText.trim()) {
      setPasteNotice("변환할 Markdown 텍스트를 입력해 주세요.");
      return;
    }
    onPasteText(directText);
  }, [directText, onPasteText]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-12 sm:py-20">
      <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3.5 py-1.5 text-xs font-medium text-stone-600">
        <span>📋 파일 업로드 & 복사·붙여넣기 지원</span>
      </div>

      <h1 className="mt-4 text-center text-3xl font-semibold tracking-tight text-stone-800 sm:text-4xl">
        Markdown to Notion HTML
      </h1>
      <p className="mt-3 text-center text-[15px] leading-relaxed text-stone-500">
        Markdown 파일이나 복사한 텍스트를 읽기 편한 문서형 HTML로 즉시 변환합니다.
      </p>

      {/* 메인 드롭존 (파일 끌어놓기 + 키보드 붙여넣기 인식) */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Markdown 파일을 끌어다 놓거나 Ctrl+V로 붙여넣으세요"
        aria-describedby="dropzone-hint"
        onClick={openPicker}
        onPaste={handleDropzonePaste}
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
        onDrop={handleDrop}
        className={`mt-8 flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 ${
          dragging
            ? "border-stone-500 bg-stone-100"
            : "border-stone-300 bg-stone-50/70 hover:border-stone-400 hover:bg-stone-100/70"
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-stone-400">
          <UploadIcon className="h-7 w-7" />
          <ClipboardIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[15px] font-medium text-stone-700">
            여기에 Markdown 파일을 놓거나 <kbd className="rounded bg-stone-200 px-1.5 py-0.5 font-mono text-xs text-stone-700">Ctrl+V</kbd> / <kbd className="rounded bg-stone-200 px-1.5 py-0.5 font-mono text-xs text-stone-700">Cmd+V</kbd> 로 붙여넣으세요
          </p>
          <p id="dropzone-hint" className="mt-1 text-[13px] text-stone-500">
            .md 파일 · 복사한 텍스트 모두 가능 · 최대 {formatBytes(MAX_FILE_BYTES)} · 브라우저 내 변환
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />

      {/* 퀵 버튼 목록 */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <FileIcon />
          Markdown 파일 선택
        </button>

        <button
          type="button"
          onClick={() => void handleClipboardRead()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <ClipboardIcon />
          클립보드에서 붙여넣기
        </button>

        <button
          type="button"
          onClick={() => {
            setShowDirectInput((prev) => !prev);
            if (!showDirectInput) {
              setTimeout(() => directTextRef.current?.focus(), 100);
            }
          }}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <EditIcon />
          {showDirectInput ? "직접 입력 닫기" : "텍스트 직접 입력"}
        </button>

        <button
          type="button"
          onClick={onSample}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          예제 불러오기
        </button>
      </div>

      {/* 텍스트 직접 입력/붙여넣기 폼 */}
      {showDirectInput ? (
        <div className="mt-6 w-full rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-all">
          <div className="flex items-center justify-between pb-2">
            <label
              htmlFor="direct-markdown-input"
              className="text-xs font-semibold uppercase tracking-wider text-stone-500"
            >
              Markdown 텍스트 직접 입력 / 붙여넣기
            </label>
            <span className="text-xs text-stone-400">
              <kbd className="font-mono">Ctrl+Enter</kbd> 로 변환
            </span>
          </div>
          <textarea
            id="direct-markdown-input"
            ref={directTextRef}
            rows={6}
            value={directText}
            onChange={(e) => setDirectText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleDirectSubmit();
              }
            }}
            placeholder="여기에 Markdown 텍스트를 직접 붙여넣거나 작성하세요... (예: # 문서 제목&#10;&#10;내용 작성...)"
            className="w-full resize-y rounded-lg border border-stone-200 bg-stone-50/50 p-3 font-mono text-sm leading-relaxed text-stone-800 placeholder-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text) setDirectText(text);
                } catch {
                  setPasteNotice("클립보드 접근 권한이 필요합니다.");
                }
              }}
              className="text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              📋 클립보드 내용 불러오기
            </button>
            <button
              type="button"
              onClick={handleDirectSubmit}
              disabled={!directText.trim()}
              className="rounded-lg bg-stone-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
            >
              변환하기
            </button>
          </div>
        </div>
      ) : null}

      {/* 상태 메시지 및 오류 알림 */}
      <div role="status" aria-live="polite" className="mt-4 min-h-6 text-center text-[13px]">
        {error ? (
          <span className="rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</span>
        ) : pasteNotice ? (
          <span className="rounded-md bg-stone-100 px-3 py-2 text-stone-700">{pasteNotice}</span>
        ) : null}
      </div>
    </div>
  );
}
