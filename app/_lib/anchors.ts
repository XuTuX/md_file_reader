import { convertMarkdown } from "./markdown";
import { slugify } from "./slug";

export interface AnchorSource {
  title: string;
  markdown: string;
}

/**
 * 문서 내부 링크(`[1. 프로젝트 생성](#1-프로젝트-생성)`)에서 대상 id 를 뽑는다.
 * 내부 앵커가 아니면 null 을 돌려준다.
 */
export function anchorTargetId(href: string): string | null {
  if (!href.startsWith("#") || href.length < 2) return null;
  const raw = href.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    // 잘못 인코딩된 링크는 원문 그대로 비교한다.
    return raw;
  }
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
