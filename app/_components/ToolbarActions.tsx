import {
  ChevronDownIcon,
  DownloadIcon,
  FileIcon,
  PrintIcon,
  ResetIcon,
  ShareIcon,
} from "./icons";

interface Props {
  exportOpen: boolean;
  onToggleExport: () => void;
  onClose: () => void;
  onDownloadHtml: () => void;
  onDownloadMarkdown: () => void;
  onPrint: () => void;
  onShare: () => void;
  onReset: () => void;
}

export default function ToolbarActions({
  exportOpen,
  onToggleExport,
  onClose,
  onDownloadHtml,
  onDownloadMarkdown,
  onPrint,
  onShare,
  onReset,
}: Props) {
  const run = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onShare} className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-[13px] font-medium text-stone-700 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400">
        <ShareIcon /> <span className="hidden sm:inline">공유</span>
      </button>
      <div className="relative">
        <button type="button" onClick={onToggleExport} className="inline-flex items-center gap-1.5 rounded-md bg-stone-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500" aria-expanded={exportOpen}>
          <DownloadIcon /> 내보내기 <ChevronDownIcon />
        </button>
        {exportOpen ? (
          <div className="absolute top-full right-0 z-50 mt-1.5 w-52 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
            <button type="button" onClick={() => run(onDownloadHtml)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-100"><DownloadIcon /> HTML 문서</button>
            <button type="button" onClick={() => run(onDownloadMarkdown)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-100"><FileIcon /> Markdown 원문</button>
            <button type="button" onClick={() => run(onPrint)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-100"><PrintIcon /> PDF로 저장·인쇄</button>
            <div className="my-1 border-t border-stone-100" />
            <button type="button" onClick={() => run(onReset)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-stone-500 hover:bg-stone-100"><ResetIcon /> 디자인 기본값</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

