export const TOC_DEPTHS = [1, 2, 3, 4] as const;
export const MAX_WIDTHS = [720, 800, 900, 1000, 1200] as const;
export const FONT_SIZES = [14, 15, 16, 17, 18, 20] as const;

export type TocDepth = (typeof TOC_DEPTHS)[number];
export type MaxWidth = (typeof MAX_WIDTHS)[number];
export type FontSize = (typeof FONT_SIZES)[number];

/** 문서마다 달라지는 값 (저장하지 않음) */
export interface DocumentMeta {
  docTitle: string;
  fileName: string;
}

/** 사용자가 계속 유지하고 싶어하는 값 (localStorage 에 저장) */
export interface AppearanceSettings {
  showToc: boolean;
  tocDepth: TocDepth;
  maxWidth: MaxWidth;
  fontSize: FontSize;
  showCopyButton: boolean;
  showProgress: boolean;
  showPrintButton: boolean;
}

export type Settings = DocumentMeta & AppearanceSettings;

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  showToc: true,
  tocDepth: 3,
  maxWidth: 900,
  fontSize: 16,
  showCopyButton: true,
  showProgress: true,
  showPrintButton: true,
};

const STORAGE_KEY = "markdown-document:appearance:v1";
const LEGACY_STORAGE_KEY = "md2notion:appearance:v1";

function isOneOf<T extends readonly number[]>(
  allowed: T,
  value: unknown,
): value is T[number] {
  return typeof value === "number" && (allowed as readonly number[]).includes(value);
}

/** localStorage 값이 손상됐거나 버전이 달라도 앱이 죽지 않도록 필드 단위로 검증한다. */
export function normalizeAppearance(raw: unknown): AppearanceSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_APPEARANCE };
  const input = raw as Record<string, unknown>;
  const bool = (key: keyof AppearanceSettings, fallback: boolean) =>
    typeof input[key] === "boolean" ? (input[key] as boolean) : fallback;

  return {
    showToc: bool("showToc", DEFAULT_APPEARANCE.showToc),
    tocDepth: isOneOf(TOC_DEPTHS, input.tocDepth)
      ? input.tocDepth
      : DEFAULT_APPEARANCE.tocDepth,
    maxWidth: isOneOf(MAX_WIDTHS, input.maxWidth)
      ? input.maxWidth
      : DEFAULT_APPEARANCE.maxWidth,
    fontSize: isOneOf(FONT_SIZES, input.fontSize)
      ? input.fontSize
      : DEFAULT_APPEARANCE.fontSize,
    showCopyButton: bool("showCopyButton", DEFAULT_APPEARANCE.showCopyButton),
    showProgress: bool("showProgress", DEFAULT_APPEARANCE.showProgress),
    showPrintButton: bool("showPrintButton", DEFAULT_APPEARANCE.showPrintButton),
  };
}

export function loadAppearance(): AppearanceSettings {
  if (typeof window === "undefined") return { ...DEFAULT_APPEARANCE };
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_APPEARANCE };
    return normalizeAppearance(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function saveAppearance(settings: AppearanceSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 사생활 보호 모드 등으로 저장이 막혀도 앱 동작에는 영향이 없어야 한다.
  }
}
