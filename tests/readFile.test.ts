import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  formatBytes,
  hasMarkdownExtension,
  validateMarkdownFile,
} from "../app/_lib/readFile";

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

