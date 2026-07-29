"use client";

import { useState } from "react";

interface Props {
  onSubmit: (markdown: string) => void;
  onNotice: (message: string) => void;
}

export default function DirectTextInput({ onSubmit, onNotice }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) {
      onNotice("변환할 Markdown 텍스트를 입력해 주세요.");
      return;
    }
    onSubmit(value);
  };

  return (
    <div className="mt-6 w-full rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <label
          htmlFor="direct-markdown-input"
          className="text-xs font-semibold tracking-wider text-stone-500 uppercase"
        >
          Markdown 텍스트 직접 입력 / 붙여넣기
        </label>
        <span className="text-xs text-stone-400">
          <kbd className="font-mono">Ctrl+Enter</kbd> 로 변환
        </span>
      </div>
      <textarea
        autoFocus
        id="direct-markdown-input"
        rows={6}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="여기에 Markdown 텍스트를 직접 붙여넣거나 작성하세요..."
        className="w-full resize-y rounded-lg border border-stone-200 bg-stone-50/50 p-3 font-mono text-sm leading-relaxed text-stone-800 placeholder-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
      />
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text) setValue(text);
            } catch {
              onNotice("클립보드 접근 권한이 필요합니다.");
            }
          }}
          className="text-xs font-medium text-stone-600 hover:text-stone-900"
        >
          📋 클립보드 내용 불러오기
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="rounded-lg bg-stone-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
        >
          변환하기
        </button>
      </div>
    </div>
  );
}

