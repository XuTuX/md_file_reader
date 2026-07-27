import { describe, expect, it } from "vitest";
import { SlugGenerator, slugify } from "../app/_lib/slug";

describe("slugify", () => {
  it("한글 제목을 그대로 보존한다", () => {
    expect(slugify("설치")).toBe("설치");
    expect(slugify("시작하기 전에")).toBe("시작하기-전에");
  });

  it("영문은 소문자로 바꾸고 공백은 하이픈으로 만든다", () => {
    expect(slugify("Getting Started")).toBe("getting-started");
    expect(slugify("  API   Reference  ")).toBe("api-reference");
  });

  it("한글과 영문, 숫자가 섞인 제목을 처리한다", () => {
    expect(slugify("Next.js 16 설치 방법")).toBe("nextjs-16-설치-방법");
  });

  it("구두점과 이모지를 제거한다", () => {
    expect(slugify("설치하기!! 🚀 (필수)")).toBe("설치하기-필수");
    expect(slugify("Q&A: 자주 묻는 질문")).toBe("qa-자주-묻는-질문");
  });

  it("인라인 마크다운 기호를 제거한다", () => {
    expect(slugify("**중요한** `코드` 설명")).toBe("중요한-코드-설명");
  });

  it("전각 공백도 하이픈으로 바꾼다", () => {
    expect(slugify("설치　방법")).toBe("설치-방법");
  });

  it("남는 글자가 없으면 기본값을 쓴다", () => {
    expect(slugify("🚀🚀🚀")).toBe("section");
    expect(slugify("---")).toBe("section");
  });
});

describe("SlugGenerator", () => {
  it("같은 제목이 반복되면 -2, -3 을 붙인다", () => {
    const slugs = new SlugGenerator();
    expect(slugs.create("설치")).toBe("설치");
    expect(slugs.create("설치")).toBe("설치-2");
    expect(slugs.create("설치")).toBe("설치-3");
  });

  it("서로 다른 제목끼리는 번호를 공유하지 않는다", () => {
    const slugs = new SlugGenerator();
    expect(slugs.create("설치")).toBe("설치");
    expect(slugs.create("사용법")).toBe("사용법");
    expect(slugs.create("설치")).toBe("설치-2");
    expect(slugs.create("사용법")).toBe("사용법-2");
  });

  it("사용자가 직접 쓴 '설치-2' 와도 충돌하지 않는다", () => {
    const slugs = new SlugGenerator();
    expect(slugs.create("설치")).toBe("설치");
    expect(slugs.create("설치-2")).toBe("설치-2");
    expect(slugs.create("설치")).toBe("설치-3");
  });

  it("서식만 다른 같은 제목도 중복으로 처리한다", () => {
    const slugs = new SlugGenerator();
    expect(slugs.create("Getting Started")).toBe("getting-started");
    expect(slugs.create("getting started")).toBe("getting-started-2");
  });

  it("reset 후에는 번호가 초기화된다", () => {
    const slugs = new SlugGenerator();
    slugs.create("설치");
    slugs.reset();
    expect(slugs.create("설치")).toBe("설치");
  });
});
