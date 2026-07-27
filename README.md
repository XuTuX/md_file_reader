# Markdown to Notion HTML (Markdown → 노션 스타일 HTML 변환기)

Markdown (`.md`, `.markdown`) 파일을 읽기 편하고 깔끔한 **노션(Notion) 스타일의 단일 HTML 문서**로 변환해주는 웹 애플리케이션입니다.
서버로 파일이 전송되지 않으며, 모든 변환 작업은 사용자의 브라우저 내부에서 안전하게 실행됩니다.

---

## 🌟 주요 기능

1. **로컬 브라우저 내부 변환 (100% Client-side)**
   - 서버 업로드 없이 브라우저의 `FileReader` 및 JavaScript 엔진을 사용해 즉시 변환합니다.
   - 개인정보나 민감한 문서 내용이 외부에 유출되지 않습니다.

2. **자동 사이드바 목차 (Table of Contents)**
   - Markdown 본문의 제목(H1~H6) 구조를 자동 분석하여 왼쪽 사이드바 목차를 생성합니다.
   - `IntersectionObserver`를 활용하여 현재 읽고 있는 섹션을 실시간으로 강조합니다.
   - 목차 검색 입력창을 통해 원하는 섹션을 빠르게 검색할 수 있습니다.
   - H2, H3 등 하위 제목의 들여쓰기 계층 표현을 지원합니다.
   - 모바일 환경에서는 슬라이드-아웃 형태의 드로어 메뉴로 자연스럽게 전환됩니다.

3. **실시간 미리보기 & 분할 보기 (Split View)**
   - Markdown 원문 편집과 렌더링된 미리보기를 동시에 확인할 수 있는 분할 보기 모드를 제공합니다.
   - 미리보기는 독립된 `iframe` 샌드박스 영역에서 안전하게 렌더링됩니다.

4. **단일 HTML 파일 다운로드 (Standalone Single-file HTML)**
   - 다운로드된 HTML 파일은 모든 CSS 스타일시트, JS 런타임 logic, 문법 강조(Highlight.js) 스타일이 인라인되어 있습니다.
   - 외부 서버나 인터넷 연결이 전혀 없는 환경(오프라인, `file://` 프로토콜)에서도 원본과 동일하게 완벽 작동합니다.

5. **노션 미니멀 스타일 및 맞춤 설정**
   - 밝은 라이트 테마 기반의 심플하고 독서하기 편한 노션 문서 디자인을 제공합니다.
   - 한글 읽기에 최적화된 시스템 폰트 스택을 사용합니다.
   - 문서 제목, 파일명, 목차 표시 여부 및 깊이(H1~H4), 본문 최대 폭(720px ~ 1000px), 글자 크기(15px ~ 18px), 코드 복사 버튼, 읽기 진행률 바, 인쇄 버튼 표시 여부를 커스텀할 수 있습니다.
   - 사용자의 커스텀 설정은 브라우저 `localStorage`에 자동 저장되어 재방문 시 복원됩니다.

6. **코드 블록 및 표 지원**
   - 모든 코드 블록 오른쪽 위에 원터치 '복사' 버튼이 생성되며, 복사 성공 시 '완료' 상태로 전환됩니다.
   - 가로 스크롤을 지원하여 코드나 표가 길어져도 레이아웃이 깨지지 않습니다.
   - highlight.js 기반의 오프라인 문법 강조를 지원합니다.

7. **한글 제목 Slug 및 앵커 링크**
   - 한글 제목도 깨지지 않는 깔끔한 URL id slug를 생성합니다.
   - 동일한 제목이 복수 등장할 경우 `설치`, `설치-2`, `설치-3`과 같이 중복 없는 안전한 Anchor ID를 부여합니다.
   - 제목 마우스 오버 시 `#` 앵커가 나타나 특정 섹션으로 직접 링크를 공유할 수 있습니다.

8. **보안 (XSS 차단)**
   - `DOMPurify` 라이브러리를 통해 Markdown 내부의 임의 `<script>`, `<iframe>`, `<object>`, `<embed>`, 인라인 이벤트 핸들러(`onload`, `onerror` 등) 및 `javascript:` URL을 엄격히 정화(Sanitize)합니다.

---

## 🛠 기술 스택

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4 & Custom CSS Design Tokens
- **Markdown Parsing**: `marked` (GFM 지원)
- **HTML Sanitization**: `dompurify`
- **Syntax Highlighting**: `highlight.js`
- **Testing**: Vitest & JSDOM

---

## 📦 설치 및 실행 방법

### 1. 프로젝트 클론 및 패키지 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 사용합니다.

### 3. 단원/단위 테스트 실행

```bash
npm run test
```

Vitest를 실행하여 한글 slug 생성, ID 중복 처리, Markdown 변환, XSS 필터링, HTML Export 및 파일명 생성 로직을 검증합니다.

### 4. 프로덕션 빌드

```bash
npm run build
```

---

## 💡 사용 방법

1. **파일 업로드**:
   - 웹사이트 중앙의 드래그 앤 드롭 영역에 `.md` 또는 `.markdown` 파일을 놓거나, **[Markdown 파일 선택]** 버튼을 클릭해 로컬 파일을 선택합니다.
   - **[예제 Markdown 불러오기]** 버튼을 클릭하여 테스트용 문서를 바로 불러올 수도 있습니다.

2. **문서 편집 및 맞춤 설정**:
   - 상단 툴바의 **[원문] / [미리보기] / [분할]** 버튼으로 편집 모드를 전환합니다.
   - 왼쪽 설정 패널에서 **문서 제목**, **목차 표시/깊이**, **본문 폭**, **글자 크기** 등의 옵션을 실시간으로 조절합니다.

3. **HTML 다운로드 및 활용**:
   - 상단 툴바의 **[HTML 다운로드]** 버튼을 누르면 설정과 Markdown 내용이 반영된 단일 `.html` 파일이 다운로드됩니다.
   - 다운로드된 파일은 인터넷 연결 없이 더블 클릭하여 바로 열람할 수 있습니다.

---

## ⚙️ 최종 HTML 생성 방식 (Standalone Architecture)

다운로드되는 `.html` 파일은 다음과 같은 구조로 조립되어 완전한 독립형 파일로 내보내집니다:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>문서 제목</title>
  <style>
    /* 노션 스타일 CSS + Highlight.js 테마 스타일 인라인 */
  </style>
</head>
<body class="...">
  <div class="doc-progress"><i></i></div>
  <header class="doc-topbar">...</header>
  <div class="doc-layout">
    <aside class="doc-sidebar">...</aside>
    <main class="doc-main">
      <article class="doc-article">
        <!-- Sanitize 처리된 변환 HTML 본문 -->
      </article>
    </main>
  </div>
  <!-- Markdown 원문 보존 -->
  <template id="doc-markdown-source">...</template>
  <!-- 런타임 설정 주입 및 목차/복사/진행률 런타임 스크립트 -->
  <script>window.__DOC__ = { ... };</script>
  <script>
    /* 순수 Vanilla JS 로 작성된 목차 스크롤, 검색, 코드 복사, 진행률 스크립트 */
  </script>
</body>
</html>
```

---

## 🔒 보안 처리 방식 (Security & Anti-XSS)

Markdown 변환 과정 및 내보내기 시점에 2단계 필터링이 적용됩니다:

1. **Parser Level Escaping**: `marked` 렌더러에서 코드 블록 및 텍스트 렌더링 시 기본 HTML escape 처리를 수행합니다.
2. **DOMPurify Sanitization**: 렌더링 직전 `sanitizeHtml()`을 거쳐 다음과 같은 위험 요소들을 완전히 제거합니다:
   - 태그 제거: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<applet>`, `<frame>`, `<base>`, `<form>` 등
   - 속성 제거: `onload`, `onerror`, `onclick` 등의 인라인 이벤트 핸들러, `srcdoc`, `formaction` 등
   - 프로토콜 차단: `javascript:`, `data:` (이미지 외) 등 위험 스키마 제거
   - 외부 링크 안전화: `http://`, `https://` 링크에 `target="_blank"` 및 `rel="noopener noreferrer"` 자동 부여

---

## 📁 프로젝트 구조

```text
markdown-notion-converter/
├─ app/
│  ├─ _components/
│  │  ├─ ConverterApp.tsx     # 메인 변환기 애플리케이션 콘테이너
│  │  ├─ FileDropzone.tsx     # 첫 화면 랜딩 및 파일 드롭존
│  │  ├─ MarkdownSource.tsx   # Markdown 원문 편집 영역
│  │  ├─ Preview.tsx          # iframe 기반 오프라인 미리보기
│  │  ├─ SettingsPanel.tsx    # 문서 및 테마 커스텀 설정 패널
│  │  ├─ Toolbar.tsx          # 상단 액션/모드 전환 툴바
│  │  └─ icons.tsx            # SVG 아이콘 모듈
│  ├─ _lib/
│  │  ├─ documentCss.ts       # Standalone HTML용 인라인 CSS 생성기
│  │  ├─ documentScript.ts    # Standalone HTML용 런타임 JS 스크립트
│  │  ├─ exportHtml.ts        # 최종 단일 HTML 문서 빌더
│  │  ├─ markdown.ts          # marked 기반 Markdown Parser & TOC 추출
│  │  ├─ readFile.ts          # FileReader 및 파일 유효성 검사
│  │  ├─ sample.ts            # 예제 Markdown 샘플 문서
│  │  ├─ sanitize.ts          # DOMPurify 기반 HTML Sanitizer
│  │  ├─ settings.ts          # 설정 타입 및 localStorage 동기화
│  │  └─ slug.ts              # 한글 지원 Slug 및 Anchor ID 생성기
│  ├─ globals.css             # TailwindCSS & 노션 기본 변수
│  ├─ layout.tsx              # Root Layout & Metadata
│  └─ page.tsx                # 메인 엔트리 페이지
├─ tests/
│  ├─ exportHtml.test.ts      # HTML 내보내기 & 파일명 테스트
│  ├─ markdown.test.ts        # Markdown 변환 & TOC 추출 테스트
│  ├─ readFile.test.ts        # 파일 유효성 & 크기 제한 테스트
│  ├─ sanitize.test.ts        # XSS 방지 필터링 테스트
│  └─ slug.test.ts            # 한글 Slug & 중복 ID 생성 테스트
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
└─ README.md
```
# md_file_reader
