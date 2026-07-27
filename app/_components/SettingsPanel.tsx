"use client";

import {
  FONT_SIZES,
  MAX_WIDTHS,
  TOC_DEPTHS,
  type FontSize,
  type MaxWidth,
  type Settings,
  type TocDepth,
} from "../_lib/settings";

interface Props {
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  headingCount: number;
}

const TOC_DEPTH_LABELS: Record<TocDepth, string> = {
  1: "H1",
  2: "H1~H2",
  3: "H1~H3",
  4: "H1~H4",
};

const fieldLabel = "block text-[12px] font-medium text-stone-600";
const textInput =
  "mt-1.5 w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-[13px] text-stone-800 focus:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300";

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-stone-700 focus-visible:ring-2 focus-visible:ring-stone-300"
      />
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-[13px] text-stone-800">{label}</span>
        {description ? (
          <span className="block text-[11.5px] text-stone-500">{description}</span>
        ) : null}
      </label>
    </div>
  );
}

export default function SettingsPanel({ settings, onChange, headingCount }: Props) {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          문서
        </h2>
        <div className="mt-2.5 space-y-3">
          <div>
            <label htmlFor="set-doc-title" className={fieldLabel}>
              문서 제목
            </label>
            <input
              id="set-doc-title"
              type="text"
              value={settings.docTitle}
              onChange={(event) => onChange("docTitle", event.target.value)}
              placeholder="문서 제목"
              className={textInput}
            />
          </div>
          <div>
            <label htmlFor="set-file-name" className={fieldLabel}>
              파일명
            </label>
            <input
              id="set-file-name"
              type="text"
              value={settings.fileName}
              onChange={(event) => onChange("fileName", event.target.value)}
              placeholder="document.md"
              className={textInput}
            />
            <p className="mt-1 text-[11.5px] text-stone-500">
              다운로드 시 확장자는 <code className="text-stone-600">.html</code> 로 바뀝니다.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          목차
        </h2>
        <div className="mt-1.5">
          <Toggle
            id="set-show-toc"
            label="목차 표시"
            description={`제목 ${headingCount}개를 찾았습니다.`}
            checked={settings.showToc}
            onChange={(value) => onChange("showToc", value)}
          />
          <div className="mt-2">
            <label htmlFor="set-toc-depth" className={fieldLabel}>
              목차에 포함할 제목 깊이
            </label>
            <select
              id="set-toc-depth"
              value={settings.tocDepth}
              disabled={!settings.showToc}
              onChange={(event) =>
                onChange("tocDepth", Number(event.target.value) as TocDepth)
              }
              className={`${textInput} disabled:bg-stone-100 disabled:text-stone-400`}
            >
              {TOC_DEPTHS.map((depth) => (
                <option key={depth} value={depth}>
                  {TOC_DEPTH_LABELS[depth]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          본문
        </h2>
        <div className="mt-2.5 space-y-3">
          <div>
            <label htmlFor="set-max-width" className={fieldLabel}>
              본문 최대 폭
            </label>
            <select
              id="set-max-width"
              value={settings.maxWidth}
              onChange={(event) =>
                onChange("maxWidth", Number(event.target.value) as MaxWidth)
              }
              className={textInput}
            >
              {MAX_WIDTHS.map((width) => (
                <option key={width} value={width}>
                  {width}px
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="set-font-size" className={fieldLabel}>
              기본 글자 크기
            </label>
            <select
              id="set-font-size"
              value={settings.fontSize}
              onChange={(event) =>
                onChange("fontSize", Number(event.target.value) as FontSize)
              }
              className={textInput}
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          기능
        </h2>
        <div className="mt-1.5">
          <Toggle
            id="set-copy"
            label="코드 복사 버튼 표시"
            checked={settings.showCopyButton}
            onChange={(value) => onChange("showCopyButton", value)}
          />
          <Toggle
            id="set-progress"
            label="읽기 진행률 표시"
            checked={settings.showProgress}
            onChange={(value) => onChange("showProgress", value)}
          />
          <Toggle
            id="set-print"
            label="인쇄 버튼 표시"
            description="사이드바 아래 인쇄·PDF 저장 버튼"
            checked={settings.showPrintButton}
            onChange={(value) => onChange("showPrintButton", value)}
          />
        </div>
      </section>

      <p className="mt-auto pt-4 text-[11.5px] leading-relaxed text-stone-400">
        설정은 이 브라우저에만 저장됩니다. Markdown 원문은 저장되지 않습니다.
      </p>
    </div>
  );
}
