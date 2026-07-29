import { buildStandaloneHtml } from "../../_lib/exportHtml";
import { convertMarkdown, type ConvertResult } from "../../_lib/markdown";
import { sanitizeHtml } from "../../_lib/sanitize";
import { DEFAULT_APPEARANCE, type Settings } from "../../_lib/settings";

export interface RenderedDocument extends Omit<ConvertResult, "html"> {
  bodyHtml: string;
}

export type PreviewStructureSettings = Pick<
  Settings,
  "showToc" | "tocDepth" | "showCopyButton"
>;

export function renderDocument(markdown: string): RenderedDocument {
  const converted = convertMarkdown(markdown);
  return {
    bodyHtml: sanitizeHtml(converted.html),
    toc: converted.toc,
    title: converted.title,
  };
}

export function buildDocumentHtml(markdown: string, settings: Settings): string {
  const rendered = renderDocument(markdown);
  return buildStandaloneHtml({
    bodyHtml: rendered.bodyHtml,
    toc: rendered.toc,
    settings,
    markdown,
  });
}

/** 미리보기는 구조 설정만 HTML에 반영하고 나머지는 postMessage로 갱신한다. */
export function buildPreviewHtml(
  markdown: string,
  rendered: RenderedDocument,
  settings: PreviewStructureSettings,
): string {
  const structuralSettings: Settings = {
    ...DEFAULT_APPEARANCE,
    docTitle: "문서",
    fileName: "document.md",
    showToc: settings.showToc,
    tocDepth: settings.tocDepth,
    showCopyButton: settings.showCopyButton,
  };
  return buildStandaloneHtml({
    bodyHtml: rendered.bodyHtml,
    toc: rendered.toc,
    settings: structuralSettings,
    markdown,
  });
}
