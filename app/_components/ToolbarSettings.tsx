import {
  ChevronDownIcon,
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

export type SettingsPopover = "width" | "fontSize" | "toc";

interface Props {
  settings: Settings;
  headingCount: number;
  active: SettingsPopover | null;
  onToggle: (key: SettingsPopover) => void;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onClose: () => void;
}

const labels: Record<TocDepth, string> = {
  1: "H1",
  2: "H1~H2",
  3: "H1~H3",
  4: "H1~H4",
};

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50/80 px-2.5 py-1.5 text-[12.5px] font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400";

export default function ToolbarSettings({
  settings,
  headingCount,
  active,
  onToggle,
  onChange,
  onClose,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="relative">
        <button type="button" onClick={() => onToggle("width")} className={buttonClass} aria-expanded={active === "width"}>
          <WidthIcon /> <span className="hidden sm:inline">폭 {settings.maxWidth}px</span><ChevronDownIcon />
        </button>
        {active === "width" ? (
          <div className="absolute top-full left-0 z-50 mt-1.5 w-40 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
            <p className="mb-1 px-2 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">본문 폭</p>
            {MAX_WIDTHS.map((width) => (
              <button key={width} type="button" onClick={() => { onChange("maxWidth", width); onClose(); }} className={`block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] ${settings.maxWidth === width ? "bg-stone-800 text-white" : "text-stone-700 hover:bg-stone-100"}`}>
                {width}px
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button type="button" onClick={() => onToggle("fontSize")} className={buttonClass} aria-expanded={active === "fontSize"}>
          <TextSizeIcon /> <span className="hidden sm:inline">{settings.fontSize}px</span><ChevronDownIcon />
        </button>
        {active === "fontSize" ? (
          <div className="absolute top-full left-0 z-50 mt-1.5 w-44 rounded-lg border border-stone-200 bg-white p-2.5 shadow-lg">
            <p className="mb-2 px-1 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">글자 크기</p>
            <div className="grid grid-cols-3 gap-1">
              {FONT_SIZES.map((size) => (
                <button key={size} type="button" onClick={() => { onChange("fontSize", size); onClose(); }} className={`rounded px-2 py-1.5 text-xs ${settings.fontSize === size ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
                  {size}px
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button type="button" onClick={() => onToggle("toc")} className={buttonClass} aria-expanded={active === "toc"}>
          <TocIcon /> <span className="hidden sm:inline">목차</span><ChevronDownIcon />
        </button>
        {active === "toc" ? (
          <div className="absolute top-full right-0 z-50 mt-1.5 w-56 space-y-3 rounded-lg border border-stone-200 bg-white p-3 shadow-lg sm:right-auto sm:left-0">
            <label className="flex items-center justify-between text-[13px] text-stone-800">
              <span>목차 표시 <small className="text-stone-400">({headingCount}개)</small></span>
              <input type="checkbox" checked={settings.showToc} onChange={(event) => onChange("showToc", event.target.checked)} className="h-4 w-4 accent-stone-800" />
            </label>
            <select value={settings.tocDepth} disabled={!settings.showToc} onChange={(event) => onChange("tocDepth", Number(event.target.value) as TocDepth)} className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-[13px] disabled:bg-stone-100">
              {TOC_DEPTHS.map((depth) => <option key={depth} value={depth}>{labels[depth]}</option>)}
            </select>
          </div>
        ) : null}
      </div>
    </div>
  );
}

