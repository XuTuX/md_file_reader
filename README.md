# Markdown Document Studio

Markdown 파일이나 복사한 텍스트를 읽기 좋은 문서로 만들고 HTML·Markdown·PDF·공유 링크로 내보내는 브라우저 앱입니다.

문서 변환, 자동 저장, 공유 링크 생성은 모두 브라우저에서 실행되며 원문을 서버로 전송하지 않습니다.

## 주요 기능

- 파일 드롭, 클립보드 붙여넣기, 직접 입력
- Markdown 편집, 미리보기, 분할 보기와 스크롤 동기화
- 목차, 목차 검색, 코드 문법 강조와 복사
- 최근 8개 문서 자동 저장·마지막 작업 복구
- 서버 업로드 없는 URL fragment 공유 링크
- 오프라인에서도 동작하는 단일 HTML, Markdown 원문, PDF/인쇄 내보내기
- DOMPurify와 sandbox iframe을 활용한 XSS 방어

## 실행

```bash
npm install
npm run dev
```

`http://localhost:3000`을 엽니다.

## 검증

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## 공유 방식

공유 링크는 Markdown 문서를 인코딩해 URL의 `#share=` fragment에 담습니다. Fragment는 HTTP 요청에 포함되지 않으므로 앱 서버에 원문이 전송되지 않습니다. 문서가 너무 길어 URL 제한을 넘으면 HTML 파일 공유를 안내합니다.

## 기술 스택

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- marked, highlight.js, DOMPurify
- Vitest, JSDOM
