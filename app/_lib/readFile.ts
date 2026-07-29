/** 기본 업로드 크기 제한 (10MB) */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [".md", ".markdown"];

/** 브라우저마다 .md 의 MIME 타입이 제각각이라, 확실히 아닌 것만 걸러낸다. */
const BLOCKED_MIME_PREFIXES = ["image/", "video/", "audio/", "font/"];
const BLOCKED_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function hasMarkdownExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** 문제가 있으면 사용자에게 보여줄 오류 메시지를, 정상이면 null 을 반환한다. */
export function validateMarkdownFile(file: File): string | null {
  if (!hasMarkdownExtension(file.name)) {
    return `'${file.name}' 은(는) 지원하지 않는 형식입니다. .md 또는 .markdown 파일을 선택해 주세요.`;
  }

  const type = (file.type || "").toLowerCase();
  if (
    type &&
    (BLOCKED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix)) ||
      BLOCKED_MIME_TYPES.includes(type))
  ) {
    return `'${file.name}' 의 파일 형식(${file.type})은 Markdown 이 아닙니다.`;
  }

  if (file.size === 0) {
    return `'${file.name}' 은(는) 빈 파일입니다.`;
  }

  if (file.size > MAX_FILE_BYTES) {
    return `파일이 너무 큽니다 (${formatBytes(file.size)}). ${formatBytes(MAX_FILE_BYTES)} 이하만 변환할 수 있습니다.`;
  }

  return null;
}

/** 서버로 보내지 않고 브라우저에서만 읽는다. */
export async function readMarkdownFile(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("파일을 읽지 못했습니다."));
    reader.readAsText(file, "utf-8");
  });
}

