/**
 * 제목 텍스트 -> URL 해시로 쓸 수 있는 id 생성.
 *
 * - 한글/영문/숫자를 그대로 보존한다 (percent-encoding 없이 읽을 수 있는 해시를 만들기 위함)
 * - 공백은 하이픈으로, 그 외 구두점/이모지는 제거한다
 * - 결과가 비면 `section` 을 사용한다
 */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFC")
    // 인라인 마크다운 잔여물 제거 (`code`, **bold** 등이 텍스트로 넘어온 경우)
    .replace(/[`*_~]/g, "")
    .trim()
    .toLowerCase()
    // 모든 종류의 공백(전각 공백 포함)을 하이픈으로
    .replace(/[\s　]+/g, "-")
    // 글자/숫자/하이픈/언더스코어만 남긴다. \p{L} 은 한글을 포함한다.
    .replace(/[^\p{L}\p{N}\-_]/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  return slug || "section";
}

/**
 * 같은 문서 안에서 중복되지 않는 id 를 만들어 주는 생성기.
 *
 *   설치 -> 설치
 *   설치 -> 설치-2
 *   설치 -> 설치-3
 */
export class SlugGenerator {
  private used = new Map<string, number>();

  create(text: string): string {
    const base = slugify(text);
    const seen = this.used.get(base) ?? 0;
    const next = seen + 1;
    this.used.set(base, next);

    if (next === 1) return base;

    // 사용자가 직접 "설치-2" 라는 제목을 쓴 경우까지 고려해 빈 자리를 찾는다.
    let candidate = `${base}-${next}`;
    let counter = next;
    while (this.used.has(candidate)) {
      counter += 1;
      candidate = `${base}-${counter}`;
    }
    this.used.set(candidate, 1);
    this.used.set(base, counter);
    return candidate;
  }

  reset(): void {
    this.used.clear();
  }
}
