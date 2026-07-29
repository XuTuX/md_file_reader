export interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface DocumentSession {
  id: string;
  markdown: string;
  fileName: string;
  titleOverride: string | null;
}

