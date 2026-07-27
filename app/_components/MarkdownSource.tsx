"use client";

import { useRef } from "react";

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
}

/** 원문 보기 겸 간단한 편집기. 수정하면 미리보기에 바로 반영된다. */
export default function MarkdownSource({ value, onChange, onSelectText }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSelect = () => {
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          Markdown 원문
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
        onChange={(event) => onChange(event.target.value)}
        onMouseUp={handleSelect}
        onKeyUp={handleSelect}
        spellCheck={false}
        wrap="off"
        className="min-h-0 flex-1 resize-none overflow-auto bg-white p-4 font-mono text-[13px] leading-6 text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-300"
      />
    </div>
  );
}

