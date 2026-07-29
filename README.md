# Manuscript Reader

하나 이상의 Markdown 파일을 브라우저에서 한 권의 책처럼 구성하고 읽는 앱입니다. 파일은 서버로 업로드되지 않으며 책장과 읽던 위치는 브라우저에 저장됩니다.

## 주요 기능

- 단일 Markdown의 `##` 제목을 챕터로 자동 분리
- 여러 Markdown 파일을 파일별 챕터로 구성
- 책 제목, 저자, 챕터 제목과 순서 편집
- 책장 저장과 마지막으로 읽은 챕터 복원
- 목차, 이전·다음 장 이동, 글자 크기 조절
- 코드 문법 강조, 표, 인용문 등 Markdown 본문 지원
- DOMPurify를 통한 안전한 HTML 렌더링

## 실행

```bash
npm install
npm run dev
```

`http://localhost:3000`을 엽니다.

## 검증

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 기술 스택

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- marked, highlight.js, DOMPurify
- Vitest, JSDOM
