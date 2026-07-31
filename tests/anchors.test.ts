import { describe, expect, it } from "vitest";
import {
  anchorTargetId,
  buildAnchorIndex,
  findAnchorChapter,
  findChapterByFileName,
  parseInternalLink,
} from "../app/_lib/anchors";
import { splitMarkdownIntoChapters } from "../app/_lib/book";

describe("anchorTargetId", () => {
  it("문서 내부 링크에서 id 를 뽑는다", () => {
    expect(anchorTargetId("#설치-방법")).toBe("설치-방법");
  });

  it("percent-encoding 된 한글 앵커를 디코딩한다", () => {
    expect(anchorTargetId(`#${encodeURIComponent("1-프로젝트-생성")}`)).toBe("1-프로젝트-생성");
  });

  it("내부 앵커가 아니면 null 을 돌려준다", () => {
    expect(anchorTargetId("https://example.com#설치")).toBeNull();
    expect(anchorTargetId("./other.md#설치")).toBeNull();
    expect(anchorTargetId("#")).toBeNull();
  });
});

describe("parseInternalLink", () => {
  it("외부 링크는 브라우저에 맡긴다", () => {
    expect(parseInternalLink("https://example.com/docs")).toBeNull();
    expect(parseInternalLink("http://example.com")).toBeNull();
    expect(parseInternalLink("//example.com/a.md")).toBeNull();
    expect(parseInternalLink("mailto:a@b.com")).toBeNull();
    expect(parseInternalLink("tel:01012345678")).toBeNull();
    expect(parseInternalLink("")).toBeNull();
  });

  it("앵커 링크를 알아본다", () => {
    expect(parseInternalLink("#설치-방법")).toEqual({ kind: "anchor", id: "설치-방법" });
    expect(parseInternalLink("#")).toEqual({ kind: "anchor", id: "" });
  });

  it("상대 경로 파일 링크에서 파일 이름과 앵커를 뽑는다", () => {
    expect(parseInternalLink("설치.md")).toEqual({
      kind: "file",
      fileName: "설치.md",
      id: null,
    });
    expect(parseInternalLink("./docs/설치.md#준비물")).toEqual({
      kind: "file",
      fileName: "설치.md",
      id: "준비물",
    });
    expect(parseInternalLink("../02-설치.markdown?raw=1")).toEqual({
      kind: "file",
      fileName: "02-설치.markdown",
      id: null,
    });
  });

  it("앱에 없는 경로도 내부 링크로 보고 직접 처리한다", () => {
    // 브라우저에 맡기면 404 로 나가면서 읽던 화면이 사라진다.
    expect(parseInternalLink("/about")).toEqual({
      kind: "file",
      fileName: "about",
      id: null,
    });
  });
});

describe("findChapterByFileName", () => {
  const chapters = [
    { title: "들어가며", markdown: "", fileName: "00-intro.md" },
    { title: "1. 프로젝트 생성", markdown: "", fileName: "01-project.md" },
  ];

  it("확장자와 대소문자가 달라도 파일 이름으로 장을 찾는다", () => {
    expect(findChapterByFileName(chapters, "01-project.md")).toBe(1);
    expect(findChapterByFileName(chapters, "01-PROJECT")).toBe(1);
  });

  it("파일 이름이 없으면 장 제목 slug 로도 맞춰 본다", () => {
    expect(findChapterByFileName(chapters, "1-프로젝트-생성.md")).toBe(1);
  });

  it("없는 파일은 null 이다", () => {
    expect(findChapterByFileName(chapters, "99-없는파일.md")).toBeNull();
    expect(findChapterByFileName(chapters, "")).toBeNull();
  });
});

describe("장을 넘나드는 앵커 찾기", () => {
  const markdown = [
    "# 새 Supabase 프로젝트 세팅",
    "",
    "| 단계 | 없으면 생기는 일 |",
    "| --- | --- |",
    "| [1. 프로젝트 생성](#1-프로젝트-생성) | — |",
    "| [2. `.env` 연결](#2-env-연결) | 앱 실행 즉시 종료 |",
    "",
    "## 1. 프로젝트 생성",
    "",
    "내용",
    "",
    "### 리전 고르기",
    "",
    "내용",
    "",
    "## 2. `.env` 연결",
    "",
    "내용",
  ].join("\n");

  const chapters = splitMarkdownIntoChapters(markdown, "새 Supabase 프로젝트 세팅");
  const index = buildAnchorIndex(chapters);

  it("장으로 분리된 H2 제목의 앵커를 그 장으로 연결한다", () => {
    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "들어가며",
      "1. 프로젝트 생성",
      "2. .env 연결",
    ]);
    expect(findAnchorChapter(index, "1-프로젝트-생성")).toBe(1);
    expect(findAnchorChapter(index, "2-env-연결")).toBe(2);
  });

  it("장 본문에 남아 있는 하위 제목도 찾는다", () => {
    expect(findAnchorChapter(index, "리전-고르기")).toBe(1);
  });

  it("대소문자나 구두점이 다른 링크도 slug 로 맞춰 본다", () => {
    expect(findAnchorChapter(index, "1. 프로젝트 생성")).toBe(1);
  });

  it("없는 앵커는 null 이다", () => {
    expect(findAnchorChapter(index, "존재하지-않는-앵커")).toBeNull();
  });
});
