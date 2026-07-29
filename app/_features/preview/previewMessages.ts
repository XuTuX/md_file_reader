import type { SelectionRect } from "../document/types";
import type { Settings } from "../../_lib/settings";

export type LivePreviewSettings = Pick<
  Settings,
  "docTitle" | "maxWidth" | "fontSize" | "showToc" | "showProgress" | "showPrintButton"
>;

export type ParentToPreviewMessage =
  | { type: "markdown-document:updateSettings"; settings: LivePreviewSettings }
  | { type: "markdown-document:print" }
  | { type: "markdown-document:scrollToHeading"; id: string }
  | { type: "markdown-document:scrollToRatio"; ratio: number };

export type PreviewToParentMessage =
  | { type: "markdown-document:ready" }
  | { type: "markdown-document:selection"; text: string; rect?: SelectionRect }
  | { type: "markdown-document:scrollRatio"; ratio: number }
  | { type: "markdown-document:activeHeading"; id: string };

export function isPreviewToParentMessage(value: unknown): value is PreviewToParentMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  switch (message.type) {
    case "markdown-document:ready":
      return true;
    case "markdown-document:selection":
      if (typeof message.text !== "string") return false;
      if (message.rect === undefined) return true;
      if (!message.rect || typeof message.rect !== "object") return false;
      return ["top", "left", "width", "height"].every(
        (key) => typeof (message.rect as Record<string, unknown>)[key] === "number",
      );
    case "markdown-document:scrollRatio":
      return typeof message.ratio === "number" && Number.isFinite(message.ratio);
    case "markdown-document:activeHeading":
      return typeof message.id === "string";
    default:
      return false;
  }
}

export function postToPreview(
  iframe: HTMLIFrameElement | null,
  message: ParentToPreviewMessage,
): void {
  iframe?.contentWindow?.postMessage(message, "*");
}
