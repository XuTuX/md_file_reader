export interface SharedDocument {
  title: string;
  fileName: string;
  markdown: string;
}

export const MAX_SHARE_URL_LENGTH = 24_000;
const SHARE_PREFIX = "#share=";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isSharedDocument(value: unknown): value is SharedDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Record<string, unknown>;
  return (
    typeof document.title === "string" &&
    typeof document.fileName === "string" &&
    typeof document.markdown === "string"
  );
}

export function encodeSharedDocument(document: SharedDocument): string {
  const json = JSON.stringify({ v: 1, ...document });
  return bytesToBase64(new TextEncoder().encode(json));
}

export function decodeSharedDocument(hash: string): SharedDocument | null {
  if (!hash.startsWith(SHARE_PREFIX)) return null;
  try {
    const json = new TextDecoder().decode(base64ToBytes(hash.slice(SHARE_PREFIX.length)));
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (parsed.v !== 1 || !isSharedDocument(parsed)) return null;
    return {
      title: parsed.title,
      fileName: parsed.fileName,
      markdown: parsed.markdown,
    };
  } catch {
    return null;
  }
}

export function buildShareUrl(document: SharedDocument, location: Location): string {
  const base = `${location.origin}${location.pathname}${location.search}`;
  return `${base}${SHARE_PREFIX}${encodeSharedDocument(document)}`;
}

