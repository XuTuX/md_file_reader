export interface MarkdownChapterDraft {
  title: string;
  markdown: string;
}

interface HeadingPosition {
  lineIndex: number;
  title: string;
}

function plainHeadingTitle(value: string): string {
  return value
    .replace(/\s+#+\s*$/, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

function findChapterHeadings(lines: string[]): HeadingPosition[] {
  const headings: HeadingPosition[] = [];
  let fence: "`" | "~" | null = null;
  let fenceLength = 0;

  lines.forEach((line, lineIndex) => {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as "`" | "~";
      if (!fence) {
        fence = marker;
        fenceLength = fenceMatch[1].length;
      } else if (marker === fence && fenceMatch[1].length >= fenceLength) {
        fence = null;
        fenceLength = 0;
      }
      return;
    }
    if (fence) return;

    const heading = line.match(/^\s{0,3}##(?!#)\s+(.+?)\s*$/);
    const title = heading ? plainHeadingTitle(heading[1]) : "";
    if (title) headings.push({ lineIndex, title });
  });

  return headings;
}

function hasIntroContent(markdown: string): boolean {
  return markdown
    .replace(/^\s{0,3}#(?!#)\s+.+?\s*#*\s*$/m, "")
    .trim().length > 0;
}

/** 단일 Markdown의 H2를 장으로 나눈다. 코드 펜스 안의 H2 표기는 무시한다. */
export function splitMarkdownIntoChapters(
  markdown: string,
  fallbackTitle: string,
): MarkdownChapterDraft[] {
  const lines = markdown.split(/\r?\n/);
  const headings = findChapterHeadings(lines);
  if (!headings.length) {
    return [{ title: fallbackTitle, markdown }];
  }

  const chapters: MarkdownChapterDraft[] = [];
  const intro = lines.slice(0, headings[0].lineIndex).join("\n").trim();
  if (intro && hasIntroContent(intro)) {
    chapters.push({ title: "들어가며", markdown: intro });
  }

  headings.forEach((heading, index) => {
    const nextHeading = headings[index + 1];
    const body = lines
      .slice(heading.lineIndex + 1, nextHeading?.lineIndex ?? lines.length)
      .join("\n")
      .trim();
    chapters.push({
      title: heading.title,
      markdown: body || `_${heading.title} 장에는 아직 본문이 없습니다._`,
    });
  });

  return chapters;
}
