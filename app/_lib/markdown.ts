import { Marked, Renderer, type RendererObject, type Tokens } from "marked";
import hljs from "highlight.js/lib/common";
import { SlugGenerator } from "./slug";

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export interface ConvertResult {
  /** sanitize 전의 본문 HTML */
  html: string;
  /** 문서에 등장한 모든 제목 (H1~H6) */
  toc: TocItem[];
  /** 첫 번째 H1 텍스트. 없으면 null */
  title: string | null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 코드 블록의 언어 지정에서 첫 토큰만 취한다: "```js title=a.js" -> "js" */
function normalizeLang(lang: string | undefined): string {
  return (lang ?? "").trim().split(/\s+/)[0].toLowerCase();
}

/**
 * marked 는 renderer 로 넘긴 객체를 `for...in` 으로 순회해 기본 렌더러를 덮어쓴다.
 * 따라서 클래스 인스턴스(메서드가 열거 불가)가 아니라 평범한 객체 리터럴을 넘겨야 하고,
 * 목차 배열 같은 상태는 클로저에 담아야 한다.
 *
 * 기본 구현을 감싸야 하는 경우에는 Renderer.prototype 의 메서드를 직접 호출한다.
 * 이때 `this` 는 marked 가 만든 실제 Renderer 인스턴스라서 `this.parser` 를 그대로 쓸 수 있다.
 */
function createRendererObject(toc: TocItem[]): RendererObject {
  const slugs = new SlugGenerator();
  const base = Renderer.prototype;

  const renderer = {
    heading(this: Renderer, { tokens, depth }: Tokens.Heading): string {
      const content = this.parser.parseInline(tokens);
      const plain = this.parser.parseInline(tokens, this.parser.textRenderer).trim();
      const id = slugs.create(plain || `heading-${toc.length + 1}`);

      toc.push({ id, text: plain, depth });

      return (
        `<h${depth} id="${escapeHtml(id)}" class="md-heading">` +
        `${content}` +
        `<a class="md-anchor" href="#${escapeHtml(id)}" aria-label="${escapeHtml(plain)} 섹션 링크">#</a>` +
        `</h${depth}>\n`
      );
    },

    code({ text, lang, escaped }: Tokens.Code): string {
      const language = normalizeLang(lang);
      let body: string;
      let className = "hljs";

      if (!escaped && language && hljs.getLanguage(language)) {
        try {
          body = hljs.highlight(text, { language, ignoreIllegals: true }).value;
          className = `hljs language-${language}`;
        } catch {
          body = escapeHtml(text);
        }
      } else {
        body = escaped ? text : escapeHtml(text);
      }

      const langLabel = language ? ` data-lang="${escapeHtml(language)}"` : "";
      return `<div class="md-code"${langLabel}><pre><code class="${className}">${body}</code></pre></div>\n`;
    },

    table(this: Renderer, token: Tokens.Table): string {
      const table = base.table.call(this, token);
      return `<div class="md-table-wrap" tabindex="0" role="region" aria-label="표">${table}</div>\n`;
    },

    listitem(this: Renderer, item: Tokens.ListItem): string {
      const html = base.listitem.call(this, item);
      // 체크박스 목록은 별도 스타일이 필요하므로 클래스를 붙인다.
      return item.task ? html.replace("<li>", '<li class="md-task">') : html;
    },
  };

  return renderer as RendererObject;
}

/**
 * Markdown 문자열을 HTML 로 변환하고 목차를 함께 추출한다.
 * 반환되는 HTML 은 아직 sanitize 되지 않았으므로 반드시 sanitizeHtml() 을 거쳐야 한다.
 */
export function convertMarkdown(markdown: string): ConvertResult {
  const toc: TocItem[] = [];
  const marked = new Marked({
    gfm: true,
    breaks: false,
    pedantic: false,
  });
  marked.use({ renderer: createRendererObject(toc) });

  const html = marked.parse(markdown, { async: false }) as string;
  const firstH1 = toc.find((item) => item.depth === 1);

  return {
    html,
    toc,
    title: firstH1?.text ?? null,
  };
}
