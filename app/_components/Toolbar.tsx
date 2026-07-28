"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  DownloadIcon,
  EditIcon,
  FileIcon,
  PrintIcon,
  ResetIcon,
  ShareIcon,
  TextSizeIcon,
  TocIcon,
  WidthIcon,
} from "./icons";
import {
  FONT_SIZES,
  MAX_WIDTHS,
  TOC_DEPTHS,
  type Settings,
  type TocDepth,
} from "../_lib/settings";

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

const TABS: { id: ViewMode; label: string; short: string }[] = [
  { id: "preview", label: "문서 보기", short: "문서" },
  { id: "source", label: "편집하기", short: "편집" },
  { id: "split", label: "분할 보기", short: "분할" },
];

const TOC_DEPTH_LABELS: Record<TocDepth, string> = {
  1: "H1",
  2: "H1~H2",
  3: "H1~H3",
  4: "H1~H4",
};

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400";
const settingButtonClass =
  "inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50/80 px-2.5 py-1.5 text-[12.5px] font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400";

type PopoverKey = "width" | "fontSize" | "toc" | "export" | null;

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

  const togglePopover = (key: PopoverKey) => {
    setActivePopover((current) => (current === key ? null : key));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePopover(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="relative z-30 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-white px-3 py-2 sm:px-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={onGoHome} className={buttonClass} title="최근 문서 보기">
          <FileIcon />
          <span className="hidden sm:inline">문서함</span>
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

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative">
          <button type="button" onClick={() => togglePopover("width")} className={settingButtonClass} aria-expanded={activePopover === "width"}>
            <WidthIcon /> <span className="hidden sm:inline">폭 {settings.maxWidth}px</span><ChevronDownIcon />
          </button>
          {activePopover === "width" ? (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-40 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">본문 폭</p>
              {MAX_WIDTHS.map((width) => (
                <button key={width} type="button" onClick={() => { onChangeSetting("maxWidth", width); setActivePopover(null); }} className={`block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] ${settings.maxWidth === width ? "bg-stone-800 text-white" : "text-stone-700 hover:bg-stone-100"}`}>
                  {width}px
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button type="button" onClick={() => togglePopover("fontSize")} className={settingButtonClass} aria-expanded={activePopover === "fontSize"}>
            <TextSizeIcon /> <span className="hidden sm:inline">{settings.fontSize}px</span><ChevronDownIcon />
          </button>
          {activePopover === "fontSize" ? (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-44 rounded-lg border border-stone-200 bg-white p-2.5 shadow-lg">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">글자 크기</p>
              <div className="grid grid-cols-3 gap-1">
                {FONT_SIZES.map((size) => (
                  <button key={size} type="button" onClick={() => { onChangeSetting("fontSize", size); setActivePopover(null); }} className={`rounded px-2 py-1.5 text-xs ${settings.fontSize === size ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
                    {size}px
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button type="button" onClick={() => togglePopover("toc")} className={settingButtonClass} aria-expanded={activePopover === "toc"}>
            <TocIcon /> <span className="hidden sm:inline">목차</span><ChevronDownIcon />
          </button>
          {activePopover === "toc" ? (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-56 space-y-3 rounded-lg border border-stone-200 bg-white p-3 shadow-lg sm:left-0 sm:right-auto">
              <label className="flex items-center justify-between text-[13px] text-stone-800">
                <span>목차 표시 <small className="text-stone-400">({headingCount}개)</small></span>
                <input type="checkbox" checked={settings.showToc} onChange={(event) => onChangeSetting("showToc", event.target.checked)} className="h-4 w-4 accent-stone-800" />
              </label>
              <select value={settings.tocDepth} disabled={!settings.showToc} onChange={(event) => onChangeSetting("tocDepth", Number(event.target.value) as TocDepth)} className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-[13px] disabled:bg-stone-100">
                {TOC_DEPTHS.map((depth) => <option key={depth} value={depth}>{TOC_DEPTH_LABELS[depth]}</option>)}
              </select>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div role="tablist" aria-label="보기 모드" className="flex items-center gap-0.5 rounded-md bg-stone-100 p-0.5">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={view === tab.id} aria-label={tab.label} onClick={() => onChangeView(tab.id)} className={`rounded px-2.5 py-1 text-[12.5px] font-medium ${view === tab.id ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
              {tab.short}
            </button>
          ))}
        </div>
        <button type="button" onClick={onShare} className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-[13px] font-medium text-stone-700 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400">
          <ShareIcon /> <span className="hidden sm:inline">공유</span>
        </button>
        <div className="relative">
          <button type="button" onClick={() => togglePopover("export")} className="inline-flex items-center gap-1.5 rounded-md bg-stone-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500" aria-expanded={activePopover === "export"}>
            <DownloadIcon /> 내보내기 <ChevronDownIcon />
          </button>
          {activePopover === "export" ? (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
              <button type="button" onClick={() => { onDownloadHtml(); setActivePopover(null); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-100"><DownloadIcon /> HTML 문서</button>
              <button type="button" onClick={() => { onDownloadMarkdown(); setActivePopover(null); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-100"><FileIcon /> Markdown 원문</button>
              <button type="button" onClick={() => { onPrint(); setActivePopover(null); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-100"><PrintIcon /> PDF로 저장·인쇄</button>
              <div className="my-1 border-t border-stone-100" />
              <button type="button" onClick={() => { onReset(); setActivePopover(null); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-stone-500 hover:bg-stone-100"><ResetIcon /> 디자인 기본값</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
