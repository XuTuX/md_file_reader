"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  DownloadIcon,
  EditIcon,
  ExpandIcon,
  FileIcon,
  PrintIcon,
  ResetIcon,
  SlidersIcon,
  TextSizeIcon,
  TocIcon,
  WidthIcon,
} from "./icons";
import {
  FONT_SIZES,
  MAX_WIDTHS,
  TOC_DEPTHS,
  type FontSize,
  type MaxWidth,
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
  onChangeView: (view: ViewMode) => void;
  onChangeSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onOpenFile: () => void;
  onDownload: () => void;
}

const TABS: { id: ViewMode; label: string; short: string }[] = [
  { id: "preview", label: "문서 보기", short: "문서" },
  { id: "source", label: "편집하기", short: "편집" },
  { id: "split", label: "분할 보기", short: "분할보기" },
];

const TOC_DEPTH_LABELS: Record<TocDepth, string> = {
  1: "H1",
  2: "H1~H2",
  3: "H1~H3",
  4: "H1~H4",
};

const iconButton =
  "inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 cursor-pointer shadow-2xs";

const popoverButton =
  "inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50/80 px-2.5 py-1.5 text-[12.5px] font-medium text-stone-700 transition-all hover:bg-stone-100 hover:border-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 cursor-pointer";

type PopoverKey = "width" | "fontSize" | "toc" | null;

export default function Toolbar({
  fileName,
  docTitle,
  settings,
  headingCount,
  view,
  onChangeView,
  onChangeSetting,
  onOpenFile,
  onDownload,
}: Props) {
  const [activePopover, setActivePopover] = useState<PopoverKey>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  /* 문서 제목 입력 시 미리보기 iframe 재로딩(깜빡임) 방지를 위한 로컬 상태 및 디바운스 */
  const [localTitle, setLocalTitle] = useState(docTitle);
  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalTitle(docTitle);
  }, [docTitle]);

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
    }
    titleTimerRef.current = setTimeout(() => {
      onChangeSetting("docTitle", newTitle);
    }, 400);
  };

  const handleTitleBlur = () => {
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
    }
    onChangeSetting("docTitle", localTitle);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (titleTimerRef.current) {
        clearTimeout(titleTimerRef.current);
      }
      onChangeSetting("docTitle", localTitle);
      e.currentTarget.blur();
    }
  };

  const togglePopover = (key: PopoverKey) => {
    setActivePopover((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePopover(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (titleTimerRef.current) {
        clearTimeout(titleTimerRef.current);
      }
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="relative z-30 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-stone-200 bg-white px-3 py-2 sm:px-4"
    >
      {/* 왼쪽: 파일 열기 + 제목 편집 & 파일명 표시 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenFile}
          className={iconButton}
          title="새 Markdown 파일 열기"
        >
          <FileIcon />
          <span className="hidden sm:inline">새 파일</span>
        </button>

        {/* 문서 제목 직접 수정 입력창 */}
        <div className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50/80 px-2 py-1 transition-colors focus-within:border-stone-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-stone-300">
          <EditIcon className="h-3.5 w-3.5 shrink-0 text-stone-400" />
          <input
            type="text"
            value={localTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            placeholder="문서 제목 입력"
            className="w-28 bg-transparent text-[13px] font-medium text-stone-800 focus:outline-none sm:w-44 lg:w-56"
            title="문서 제목 수정"
          />
          <span
            className="hidden border-l border-stone-200 pl-1.5 text-[11px] font-normal text-stone-400 lg:inline"
            title={`파일명: ${fileName}`}
          >
            {fileName}
          </span>
        </div>
      </div>

      {/* 중앙: 본문 폭, 글자 크기, 목차, 문서 기능 설정 드롭다운/팝오버 (가로 나열) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* 본문 폭 (Max Width) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover("width")}
            aria-expanded={activePopover === "width"}
            className={`${popoverButton} ${
              activePopover === "width" ? "border-stone-400 bg-stone-100 text-stone-900" : ""
            }`}
            title="본문 최대 폭 설정"
          >
            <WidthIcon />
            <span>폭: {settings.maxWidth}px</span>
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                activePopover === "width" ? "rotate-180" : ""
              }`}
            />
          </button>

          {activePopover === "width" ? (
            <div className="absolute left-0 top-full mt-1.5 w-44 rounded-lg border border-stone-200 bg-white p-2 shadow-lg z-50">
              <div className="mb-1.5 px-2 py-1 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                본문 최대 폭
              </div>
              <div className="space-y-0.5">
                {MAX_WIDTHS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      onChangeSetting("maxWidth", w);
                      setActivePopover(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                      settings.maxWidth === w
                        ? "bg-stone-800 font-medium text-white"
                        : "text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <span>{w}px</span>
                    {settings.maxWidth === w ? <span className="text-[11px]">선택됨</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* 글자 크기 (Font Size) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover("fontSize")}
            aria-expanded={activePopover === "fontSize"}
            className={`${popoverButton} ${
              activePopover === "fontSize" ? "border-stone-400 bg-stone-100 text-stone-900" : ""
            }`}
            title="글자 크기 설정"
          >
            <TextSizeIcon />
            <span>크기: {settings.fontSize}px</span>
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                activePopover === "fontSize" ? "rotate-180" : ""
              }`}
            />
          </button>

          {activePopover === "fontSize" ? (
            <div className="absolute left-0 top-full mt-1.5 w-48 rounded-lg border border-stone-200 bg-white p-2.5 shadow-lg z-50">
              <div className="mb-2 px-1 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                기본 글자 크기
              </div>

              {/* - / + 조절 버튼 */}
              <div className="mb-2.5 flex items-center justify-between rounded-md border border-stone-200 bg-stone-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    const idx = FONT_SIZES.indexOf(settings.fontSize);
                    if (idx > 0) onChangeSetting("fontSize", FONT_SIZES[idx - 1]);
                  }}
                  disabled={settings.fontSize <= FONT_SIZES[0]}
                  className="flex h-7 w-7 items-center justify-center rounded bg-white text-stone-700 shadow-2xs hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                  title="글자 크기 줄이기"
                >
                  -
                </button>
                <span className="text-[13px] font-semibold text-stone-800">
                  {settings.fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const idx = FONT_SIZES.indexOf(settings.fontSize);
                    if (idx < FONT_SIZES.length - 1)
                      onChangeSetting("fontSize", FONT_SIZES[idx + 1]);
                  }}
                  disabled={settings.fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
                  className="flex h-7 w-7 items-center justify-center rounded bg-white text-stone-700 shadow-2xs hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                  title="글자 크기 키우기"
                >
                  +
                </button>
              </div>

              {/* 프리셋 버튼 목록 */}
              <div className="grid grid-cols-3 gap-1">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onChangeSetting("fontSize", s);
                      setActivePopover(null);
                    }}
                    className={`rounded px-2 py-1 text-center text-[12px] font-medium transition-colors ${
                      settings.fontSize === s
                        ? "bg-stone-800 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* 목차 (TOC) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover("toc")}
            aria-expanded={activePopover === "toc"}
            className={`${popoverButton} ${
              activePopover === "toc" ? "border-stone-400 bg-stone-100 text-stone-900" : ""
            }`}
            title="목차 표시 및 깊이 설정"
          >
            <TocIcon />
            <span>목차 {settings.showToc ? `(H1~H${settings.tocDepth})` : "켜기"}</span>
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                activePopover === "toc" ? "rotate-180" : ""
              }`}
            />
          </button>

          {activePopover === "toc" ? (
            <div className="absolute left-0 top-full mt-1.5 w-56 rounded-lg border border-stone-200 bg-white p-3 shadow-lg z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div>
                  <span className="block text-[13px] font-medium text-stone-800">목차 표시</span>
                  <span className="block text-[11px] text-stone-500">
                    제목 {headingCount}개 감지됨
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showToc}
                  onChange={(e) => onChangeSetting("showToc", e.target.checked)}
                  className="h-4 w-4 rounded accent-stone-800 cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="topbar-toc-depth"
                  className="mb-1.5 block text-[11px] font-semibold text-stone-400 uppercase tracking-wider"
                >
                  목차 깊이
                </label>
                <select
                  id="topbar-toc-depth"
                  value={settings.tocDepth}
                  disabled={!settings.showToc}
                  onChange={(e) =>
                    onChangeSetting("tocDepth", Number(e.target.value) as TocDepth)
                  }
                  className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-[13px] text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:bg-stone-100 disabled:text-stone-400"
                >
                  {TOC_DEPTHS.map((depth) => (
                    <option key={depth} value={depth}>
                      {TOC_DEPTH_LABELS[depth]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>

      </div>

      {/* 오른쪽: 보기 모드 (원문/분할/미리보기) + 액션 버튼 (전체화면, 인쇄, HTML 다운로드) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 보기 모드 탭 */}
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
              className={`rounded px-2.5 py-1 text-[12.5px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 cursor-pointer ${
                view === tab.id
                  ? "bg-white text-stone-800 shadow-2xs"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab.short}
            </button>
          ))}
        </div>

        {/* 내보내기 & 액션들 */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-md bg-stone-800 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 cursor-pointer shadow-2xs"
          >
            <DownloadIcon />
            <span className="hidden sm:inline">HTML 다운로드</span>
            <span className="sm:hidden">다운로드</span>
          </button>
        </div>
      </div>
    </header>
  );
}
