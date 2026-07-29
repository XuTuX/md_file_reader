import type { TocItem } from "../../_lib/markdown";

export function findNearestHeading(
  toc: TocItem[],
  visibleLine: number,
  cursorLine?: number | null,
): TocItem | null {
  if (!toc.length) return null;
  const targetLine = typeof cursorLine === "number" && cursorLine >= 0
    ? cursorLine
    : visibleLine;
  const positioned = toc.filter(
    (item): item is TocItem & { lineIndex: number } => typeof item.lineIndex === "number",
  );
  if (!positioned.length) return null;

  let nearest = positioned[0];
  for (const item of positioned) {
    if (item.lineIndex > targetLine) break;
    nearest = item;
  }
  return nearest;
}

