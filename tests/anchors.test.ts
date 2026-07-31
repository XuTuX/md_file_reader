import { describe, expect, it } from "vitest";
import { anchorTargetId, buildAnchorIndex, findAnchorChapter } from "../app/_lib/anchors";
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
