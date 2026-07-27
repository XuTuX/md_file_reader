"use client";

import {
  DownloadIcon,
  ExpandIcon,
  FileIcon,
  PrintIcon,
  ResetIcon,
  SlidersIcon,
} from "./icons";

export type ViewMode = "source" | "preview" | "split";

interface Props {
  fileName: string;
  view: ViewMode;
  settingsOpen: boolean;
  onChangeView: (view: ViewMode) => void;
  onToggleSettings: () => void;
  onOpenFile: () => void;
  onDownload: () => void;
  onFullscreen: () => void;
  onPrint: () => void;
  onReset: () => void;
}

const TABS: { id: ViewMode; label: string; short: string }[] = [
  { id: "source", label: "원문 보기", short: "원문" },
  { id: "preview", label: "미리보기 보기", short: "미리보기" },
  { id: "split", label: "분할 보기", short: "분할" },
];

const iconButton =
  "inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-[13px] font-medium text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400";

export default function Toolbar({
  fileName,
  view,
  settingsOpen,
  onChangeView,
  onToggleSettings,
  onOpenFile,
  onDownload,
  onFullscreen,
  onPrint,
  onReset,
}: Props) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-stone-200 bg-white px-3 py-2.5 sm:px-4">
      <button type="button" onClick={onOpenFile} className={iconButton}>
        <FileIcon />
        <span className="hidden sm:inline">새 파일 열기</span>
        <span className="sm:hidden">열기</span>
      </button>

      <button
        type="button"
        onClick={onToggleSettings}
        aria-expanded={settingsOpen}
        aria-controls="settings-panel"
        className={`${iconButton} lg:hidden`}
      >
        <SlidersIcon />
        설정
      </button>

      <p
        className="order-last w-full truncate text-[13px] text-stone-500 sm:order-none sm:w-auto sm:max-w-[22ch] lg:max-w-[32ch]"
        title={fileName}
      >
        {fileName}
      </p>

      <div
        role="tablist"
        aria-label="보기 모드"
        className="flex items-center gap-0.5 rounded-md bg-stone-100 p-0.5"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={view === tab.id}
            aria-label={tab.label}
            onClick={() => onChangeView(tab.id)}
            className={`rounded px-2.5 py-1 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
              view === tab.id
                ? "bg-white text-stone-800 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {tab.short}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          aria-label="변환 설정 초기화"
          title="변환 설정 초기화"
          className={iconButton}
        >
          <ResetIcon />
          <span className="hidden md:inline">초기화</span>
        </button>
        <button
          type="button"
          onClick={onFullscreen}
          aria-label="전체 화면 미리보기"
          title="전체 화면 미리보기"
          className={iconButton}
        >
          <ExpandIcon />
          <span className="hidden md:inline">전체 화면</span>
        </button>
        <button
          type="button"
          onClick={onPrint}
          aria-label="인쇄 또는 PDF로 저장"
          title="인쇄 또는 PDF로 저장"
          className={iconButton}
        >
          <PrintIcon />
          <span className="hidden md:inline">인쇄</span>
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 rounded-md bg-stone-800 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
        >
          <DownloadIcon />
          <span className="hidden sm:inline">HTML 다운로드</span>
          <span className="sm:hidden">다운로드</span>
        </button>
      </div>
    </header>
  );
}
