import { convertMarkdown } from "./markdown";
import { slugify } from "./slug";

export interface AnchorSource {
  title: string;
  markdown: string;
  fileName?: string;
}

/** 책 안에서 직접 처리해야 하는 링크. 외부 링크는 여기에 해당하지 않는다. */
export type InternalLink =
  | { kind: "anchor"; id: string }
  | { kind: "file"; fileName: string; id: string | null };

function decodeSafely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // 잘못 인코딩된 링크는 원문 그대로 쓴다.
    return value;
  }
}

/**
 * 문서 내부 링크(`[1. 프로젝트 생성](#1-프로젝트-생성)`)에서 대상 id 를 뽑는다.
 * 내부 앵커가 아니면 null 을 돌려준다.
 */
export function anchorTargetId(href: string): string | null {
  if (!href.startsWith("#") || href.length < 2) return null;
  return decodeSafely(href.slice(1));
}

/**
 * 본문 링크를 책 안에서 처리해야 하는지 판단한다.
 *
 * 이 앱에는 책 화면 말고 다른 페이지가 없으므로, `설치.md` 같은 상대 경로를
 * 브라우저에 맡기면 없는 주소로 나가면서 읽던 화면이 사라진다.
 * 그래서 외부 링크(http/https/mailto 등)만 브라우저에 넘기고 나머지는 직접 처리한다.
 */
export function parseInternalLink(href: string): InternalLink | null {
  const trimmed = href.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("#")) {
    return { kind: "anchor", id: anchorTargetId(trimmed) ?? "" };
  }
  // 스킴이 있거나 //로 시작하면 외부 주소다.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) return null;

  const [pathPart, ...hashParts] = trimmed.split("#");
  const path = pathPart.split("?")[0].replace(/\/+$/, "");
  const hash = hashParts.join("#");

  return {
    kind: "file",
    fileName: decodeSafely(path.split("/").pop() ?? ""),
    id: hash ? decodeSafely(hash) : null,
  };
}

/**
 * 앵커 id -> 그 제목이 들어 있는 장 번호.
 *
 * 원본 Markdown 의 H2 는 장으로 잘려 나가면서 본문에서 사라지기 때문에
 * (splitMarkdownIntoChapters 참고) 장 제목의 slug 도 함께 등록해야
 * 원본 문서 기준으로 쓰인 링크가 이어진다.
 */
export function buildAnchorIndex(chapters: AnchorSource[]): Map<string, number> {
  const index = new Map<string, number>();
  const add = (key: string, chapterIndex: number) => {
    if (key && !index.has(key)) index.set(key, chapterIndex);
  };

  chapters.forEach((chapter, chapterIndex) => {
    add(slugify(chapter.title), chapterIndex);
    for (const heading of convertMarkdown(chapter.markdown).toc) {
      add(heading.id, chapterIndex);
      add(slugify(heading.text), chapterIndex);
    }
  });

  return index;
}

function fileKey(value: string): string {
  return value.normalize("NFC").trim().toLowerCase().replace(/\.(md|markdown)$/, "");
}

/**
 * `설치.md` 처럼 파일을 가리키는 링크가 어느 장인지 찾는다.
 * 파일 이름이 같은 장이 없으면 장 제목의 slug 로도 맞춰 본다.
 */
export function findChapterByFileName(
  chapters: AnchorSource[],
  fileName: string,
): number | null {
  const key = fileKey(fileName);
  if (!key) return null;

  const slugKey = slugify(key);
  const found = chapters.findIndex(
    (chapter) =>
      (chapter.fileName ? fileKey(chapter.fileName) === key : false) ||
      slugify(chapter.title) === slugKey,
  );
  return found === -1 ? null : found;
}

/** 앵커 id 가 속한 장 번호. 찾지 못하면 null. */
export function findAnchorChapter(
  index: Map<string, number>,
  targetId: string,
): number | null {
  const direct = index.get(targetId);
  if (direct !== undefined) return direct;

  // 대소문자/자모 분리(NFD)/구두점이 다른 링크도 slug 로 맞춰 본다.
  const normalized = index.get(slugify(targetId));
  return normalized ?? null;
}
