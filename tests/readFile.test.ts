import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  deriveFileNameFromMarkdown,
  formatBytes,
  hasMarkdownExtension,
  validateMarkdownFile,
} from "../app/_lib/readFile";
import { DEFAULT_APPEARANCE, normalizeAppearance } from "../app/_lib/settings";

function fakeFile(name: string, size: number, type = ""): File {
  return { name, size, type } as File;
}

describe("hasMarkdownExtension", () => {
  it(".md 와 .markdown 만 허용한다", () => {
    expect(hasMarkdownExtension("README.md")).toBe(true);
    expect(hasMarkdownExtension("README.MARKDOWN")).toBe(true);
    expect(hasMarkdownExtension("README.txt")).toBe(false);
    expect(hasMarkdownExtension("README")).toBe(false);
  });
});

describe("validateMarkdownFile", () => {
  it("정상 파일은 통과시킨다", () => {
    expect(validateMarkdownFile(fakeFile("a.md", 1024, "text/markdown"))).toBeNull();
    // 브라우저가 MIME 타입을 비워두는 경우도 허용해야 한다
    expect(validateMarkdownFile(fakeFile("a.markdown", 1024, ""))).toBeNull();
  });

  it("확장자가 다르면 오류를 낸다", () => {
    expect(validateMarkdownFile(fakeFile("a.txt", 10))).toContain("지원하지 않는 형식");
  });

  it("명백히 Markdown 이 아닌 MIME 타입을 거른다", () => {
    expect(validateMarkdownFile(fakeFile("a.md", 10, "image/png"))).toContain(
      "Markdown 이 아닙니다",
    );
  });

  it("빈 파일을 거른다", () => {
    expect(validateMarkdownFile(fakeFile("a.md", 0))).toContain("빈 파일");
  });

  it("10MB 를 넘으면 거른다", () => {
    expect(validateMarkdownFile(fakeFile("a.md", MAX_FILE_BYTES + 1))).toContain(
      "너무 큽니다",
    );
    expect(validateMarkdownFile(fakeFile("a.md", MAX_FILE_BYTES))).toBeNull();
  });
});

describe("formatBytes", () => {
  it("사람이 읽기 쉬운 단위로 표시한다", () => {
    expect(formatBytes(512)).toBe("512B");
    expect(formatBytes(2048)).toBe("2.0KB");
    expect(formatBytes(10 * 1024 * 1024)).toBe("10.0MB");
  });
});

describe("normalizeAppearance", () => {
  it("저장된 값이 없으면 기본값을 쓴다", () => {
    expect(normalizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(normalizeAppearance("깨진 값")).toEqual(DEFAULT_APPEARANCE);
  });

  it("허용되지 않는 값은 기본값으로 되돌린다", () => {
    const result = normalizeAppearance({ maxWidth: 5000, tocDepth: 9, fontSize: "크게" });
    expect(result.maxWidth).toBe(DEFAULT_APPEARANCE.maxWidth);
    expect(result.tocDepth).toBe(DEFAULT_APPEARANCE.tocDepth);
    expect(result.fontSize).toBe(DEFAULT_APPEARANCE.fontSize);
  });

  it("유효한 값은 그대로 유지한다", () => {
    const result = normalizeAppearance({
      showToc: false,
      tocDepth: 4,
      maxWidth: 720,
      fontSize: 18,
      showCopyButton: false,
      showProgress: false,
      showPrintButton: false,
    });
    expect(result).toEqual({
      showToc: false,
      tocDepth: 4,
      maxWidth: 720,
      fontSize: 18,
      showCopyButton: false,
      showProgress: false,
      showPrintButton: false,
    });
  });
});

describe("deriveFileNameFromMarkdown", () => {
  it("첫 번째 H1 제목에서 파일명을 추출한다", () => {
    expect(deriveFileNameFromMarkdown("# 문서 제목\n\n내용입니다.")).toBe("문서 제목.md");
    expect(deriveFileNameFromMarkdown("\n\n# **강조된** [링크](https://test.com) 제목\n내용")).toBe(
      "강조된 링크 제목.md",
    );
  });

  it("H1 제목이 없으면 기본 파일명을 반환한다", () => {
    expect(deriveFileNameFromMarkdown("## 소제목만 있음")).toBe("pasted.md");
    expect(deriveFileNameFromMarkdown("일반 텍스트", "custom.md")).toBe("custom.md");
  });

  it("파일 시스템 금지 문자를 제거한다", () => {
    expect(deriveFileNameFromMarkdown("# 테스트/파일:제목?*")).toBe("테스트파일제목.md");
  });
});

