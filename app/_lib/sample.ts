export const SAMPLE_FILE_NAME = "SAMPLE_DOCUMENT.md";

export const SAMPLE_MARKDOWN = `# Markdown 문서 스튜디오 예제

이 문서는 변환기가 지원하는 Markdown 문법을 한눈에 확인하기 위한 예제입니다.
왼쪽 목차를 눌러 이동해 보고, 코드 블록의 **복사** 버튼과 상단의 읽기 진행률 바도 확인해 보세요.

## 설치

프로젝트를 내려받은 뒤 의존성을 설치합니다.

\`\`\`bash
npm install
npm run dev
\`\`\`

## 텍스트 서식

**굵게**, *기울임*, ***굵은 기울임***, ~~취소선~~, 그리고 \`인라인 코드\` 를 사용할 수 있습니다.
링크는 [Markdown 명세](https://spec.commonmark.org/) 처럼 씁니다.

> 인용문은 이렇게 표시됩니다.
> 여러 줄로 이어 쓸 수도 있습니다.
>
> — 인용 출처

---

## 목록

### 순서 없는 목록

- 첫 번째 항목
- 두 번째 항목
  - 중첩된 항목
  - 중첩된 항목 2
    - 3단계 중첩
- 세 번째 항목

### 순서 있는 목록

1. 저장소를 복제한다
2. 의존성을 설치한다
3. 개발 서버를 실행한다

### 체크박스 목록

- [x] Markdown 파싱
- [x] 목차 자동 생성
- [ ] 다크 테마 (지원하지 않음)

## 코드 블록

언어를 지정하면 문법 강조가 적용됩니다.

\`\`\`typescript
interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export function filterToc(toc: TocItem[], maxDepth: number): TocItem[] {
  // 설정된 깊이까지만 목차에 남긴다
  return toc.filter((item) => item.depth <= maxDepth);
}
\`\`\`

\`\`\`python
def slugify(text: str) -> str:
    """한글 제목도 그대로 보존한다."""
    return text.strip().lower().replace(" ", "-")
\`\`\`

언어를 지정하지 않으면 강조 없이 그대로 표시됩니다.

\`\`\`
$ curl -sS https://example.com/health
{"status":"ok"}
\`\`\`

## 표

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| 본문 최대 폭 | 900px | 720 / 800 / 900 / 1000px 중 선택 |
| 목차 깊이 | H1~H3 | 사이드바에 표시할 제목 단계 |
| 코드 복사 버튼 | 켬 | 코드 블록 오른쪽 위 복사 버튼 |
| 읽기 진행률 | 켬 | 문서 상단 2px 진행률 바 |

## 설치

같은 제목이 반복되면 목차의 링크가 겹치지 않도록 \`설치-2\` 같은 id 가 자동으로 만들어집니다.

## 설치

세 번째 \`설치\` 제목입니다. id 는 \`설치-3\` 이 됩니다.

## 보안

Markdown 안에 들어 있는 위험한 HTML 은 미리보기와 다운로드 결과 양쪽에서 모두 제거됩니다.

<script>alert('이 코드는 실행되지 않습니다')</script>

<img src="x" onerror="alert('이 코드도 실행되지 않습니다')" alt="차단된 이미지" />

[이 링크도 실행되지 않습니다](javascript:alert('xss'))

## 긴 코드 줄

가로로 긴 코드는 코드 블록 안에서 가로 스크롤됩니다.

\`\`\`json
{ "name": "markdown-document-studio", "description": "Markdown을 읽기 좋은 문서로 만듭니다", "private": true, "license": "MIT" }
\`\`\`

## 마무리

오른쪽 위 **내보내기** 메뉴에서 HTML, Markdown, PDF/인쇄를 선택할 수 있습니다. HTML은 CSS와 JavaScript가 모두 포함된 단일 \`.html\` 파일이며, 인터넷 연결 없이 열어도 목차, 검색, 코드 복사가 그대로 동작합니다.
`;
