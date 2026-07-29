"use client";

import { useEffect, useRef, useState } from "react";
import { EditIcon, FileIcon } from "./icons";
import ToolbarActions from "./ToolbarActions";
import ToolbarSettings, { type SettingsPopover } from "./ToolbarSettings";
import type { Settings } from "../_lib/settings";

export type ViewMode = "source" | "preview" | "split";

interface Props {
  fileName: string;
  docTitle: string;
  settings: Settings;
  headingCount: number;
  view: ViewMode;
  saveLabel: string;
  onChangeView: (view: ViewMode) => void;
  onChangeSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onOpenFile: () => void;
  onGoHome: () => void;
  onDownloadHtml: () => void;
  onDownloadMarkdown: () => void;
  onPrint: () => void;
  onShare: () => void;
  onReset: () => void;
}

type PopoverKey = SettingsPopover | "export" | null;

const tabs: { id: ViewMode; label: string; short: string }[] = [
  { id: "preview", label: "문서 보기", short: "문서" },
  { id: "source", label: "편집하기", short: "편집" },
  { id: "split", label: "분할 보기", short: "분할" },
];

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400";

export default function Toolbar({
  fileName,
  docTitle,
  settings,
  headingCount,
  view,
  saveLabel,
  onChangeView,
  onChangeSetting,
  onOpenFile,
  onGoHome,
  onDownloadHtml,
  onDownloadMarkdown,
  onPrint,
  onShare,
  onReset,
}: Props) {
  const [activePopover, setActivePopover] = useState<PopoverKey>(null);
  const headerRef = useRef<HTMLElement>(null);
  const closePopover = () => setActivePopover(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) closePopover();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopover();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggle = (key: Exclude<PopoverKey, null>) => {
    setActivePopover((current) => (current === key ? null : key));
  };

  return (
    <header
      ref={headerRef}
      className="relative z-30 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-white px-3 py-2 sm:px-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={onGoHome} className={buttonClass} title="최근 문서 보기">
          <FileIcon /> <span className="hidden sm:inline">문서함</span>
        </button>
        <button type="button" onClick={onOpenFile} className={buttonClass} title="새 Markdown 파일 열기">
          새 파일
        </button>
        <div className="flex min-w-0 items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50/80 px-2 py-1 focus-within:border-stone-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-stone-300">
          <EditIcon className="h-3.5 w-3.5 shrink-0 text-stone-400" />
          <input
            type="text"
            value={docTitle}
            onChange={(event) => onChangeSetting("docTitle", event.target.value)}
            placeholder="문서 제목"
            className="w-28 bg-transparent text-[13px] font-medium text-stone-800 focus:outline-none sm:w-44 lg:w-56"
          />
          <span className="hidden max-w-28 truncate border-l border-stone-200 pl-1.5 text-[11px] text-stone-400 xl:inline">
            {fileName}
          </span>
        </div>
        <span className="hidden whitespace-nowrap text-[11px] text-stone-400 lg:inline" aria-live="polite">
          {saveLabel}
        </span>
      </div>

      <ToolbarSettings
        settings={settings}
        headingCount={headingCount}
        active={activePopover === "export" ? null : activePopover}
        onToggle={toggle}
        onChange={onChangeSetting}
        onClose={closePopover}
      />

      <div className="flex items-center gap-2">
        <div role="tablist" aria-label="보기 모드" className="flex items-center gap-0.5 rounded-md bg-stone-100 p-0.5">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={view === tab.id} aria-label={tab.label} onClick={() => onChangeView(tab.id)} className={`rounded px-2.5 py-1 text-[12.5px] font-medium ${view === tab.id ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
              {tab.short}
            </button>
          ))}
        </div>
        <ToolbarActions
          exportOpen={activePopover === "export"}
          onToggleExport={() => toggle("export")}
          onClose={closePopover}
          onDownloadHtml={onDownloadHtml}
          onDownloadMarkdown={onDownloadMarkdown}
          onPrint={onPrint}
          onShare={onShare}
          onReset={onReset}
        />
      </div>
    </header>
  );
}
