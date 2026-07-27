"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelectText?: (text: string, rect: SelectionRect | null) => void;
  onScrollRatio?: (ratio: number) => void;
  onCursorLineChange?: (lineIndex: number) => void;
}

/** 원문 보기 겸 간단한 편집기. 수정하면 미리보기에 바로 반영된다. */
const MarkdownSource = forwardRef<HTMLTextAreaElement, Props>(function MarkdownSource(
  { value, onChange, onSelectText, onScrollRatio, onCursorLineChange },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const reportCursorLine = () => {
    if (!onCursorLineChange || !textareaRef.current) return;
    const pos = textareaRef.current.selectionStart || 0;
    const lineIndex = value.slice(0, pos).split("\n").length - 1;
    onCursorLineChange(lineIndex);
  };

  const handleSelect = () => {
    reportCursorLine();

    if (!onSelectText || !textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (start === end) {
      onSelectText("", null);
      return;
    }

    const selectedText = el.value.slice(start, end).trim();
    if (!selectedText) {
      onSelectText("", null);
      return;
    }

    const bounds = el.getBoundingClientRect();
    onSelectText(selectedText, {
      top: bounds.top + 40,
      left: bounds.left + bounds.width / 2 - 40,
      width: 80,
      height: 20,
    });
  };

  const handleScroll = () => {
    reportCursorLine();

    if (!onScrollRatio || !textareaRef.current) return;
    const el = textareaRef.current;
    if (el.clientHeight === 0) return;
    const max = el.scrollHeight - el.clientHeight;
    const ratio = max > 0 ? el.scrollTop / max : 0;
    onScrollRatio(ratio);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-3 py-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
          Markdown 편집
        </span>
        <span className="text-[11.5px] text-stone-400">
          {value.length.toLocaleString("ko-KR")}자
        </span>
      </div>
      <label htmlFor="markdown-source" className="sr-only">
        Markdown 원문 편집
      </label>
      <textarea
        ref={textareaRef}
        id="markdown-source"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          reportCursorLine();
        }}
        onClick={reportCursorLine}
        onMouseUp={handleSelect}
        onKeyUp={handleSelect}
        onScroll={handleScroll}
        spellCheck={false}
        wrap="off"
        className="min-h-0 flex-1 resize-none overflow-auto bg-white p-4 font-mono text-[13px] leading-6 text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-inset"
      />
    </div>
  );
});

export default MarkdownSource;
