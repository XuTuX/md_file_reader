/**
 * AI 질문 대화 및 대화 기반 마크다운 문서 보충 유틸리티
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

/**
 * 멀티턴 대화: 기존 대화 히스토리와 새 질문을 받아 AI 대답을 생성합니다.
 */
export async function sendChatMessage(
  history: ChatMessage[],
  newQuestion: string,
  selectedText: string,
): Promise<ChatMessage> {
  // 비동기 AI 답변 시뮬레이션 (약 400ms)
  await new Promise((resolve) => setTimeout(resolve, 400));

  const q = newQuestion.trim();
  const target = selectedText.trim();
  const lowerQ = q.toLowerCase();
  const lowerTarget = target.toLowerCase();

  let replyContent = "";

  // 이전 대화 횟수 체크
  const userMessageCount = history.filter((m) => m.role === "user").length;

  if (userMessageCount === 0 && (q === "이게 뭐야?" || q === "이게 뭐야")) {
    // 첫 질문
    if (lowerTarget.includes("useeffect")) {
      replyContent = `**useEffect**는 React 컴포넌트에서 데이터 패칭, 구독, DOM 직접 수정 등 사이드 이펙트(Side Effect)를 수행할 때 사용하는 훅입니다.`;
    } else if (lowerTarget.includes("state") || lowerTarget.includes("usestate")) {
      replyContent = `**useState**는 React 컴포넌트 내부에서 동적인 데이터(상태)를 관리할 때 사용합니다. 값이 변경되면 UI가 자동으로 갱신됩니다.`;
    } else if (lowerTarget.includes("markdown") || lowerTarget.includes("마크다운")) {
      replyContent = `**마크다운(Markdown)**은 서식 있는 문서를 쉬운 일반 텍스트 기호로 작성할 수 있도록 만든 경량 마크업 언어입니다.`;
    } else {
      replyContent = `'**${target}**'은(는) 문서 내 주요 개념이나 항목을 나타냅니다. 혹시 어떤 부분이 구체적으로 궁금하신가요?`;
    }
  } else {
    // 꼬리 질문 / 멀티턴 대화 응답
    if (lowerQ.includes("예시") || lowerQ.includes("example") || lowerQ.includes("코드")) {
      replyContent = `'${target}' 관련 대표적인 예시입니다:\n\n\`\`\`js\n// 사용 예시\nfunction Example() {\n  // ${target} 활용 패턴\n}\n\`\`\`\n이와 같이 실제 코드나 실무에서 쉽게 활용할 수 있습니다.`;
    } else if (lowerQ.includes("왜") || lowerQ.includes("이유") || lowerQ.includes("목적")) {
      replyContent = `'${target}'을(를) 쓰는 주된 이유는 코드의 가독성을 높이고, 상태 관리나 예외 처리를 명확하게 정리하기 위함입니다.`;
    } else {
      replyContent = `질문하신 "**${q}**"에 대한 설명입니다:\n\n'${target}'의 맥락에서 볼 때, 전달주신 부분은 세부 동작 원리 및 설정 방법을 보충하는 데 중요한 내용입니다. 추가로 더 궁금한 부분이 있으신가요?`;
    }
  }

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: "assistant",
    content: replyContent,
    createdAt: Date.now(),
  };
}

/**
 * 나눈 전체 대화 히스토리를 AI가 종합 분석하여 마크다운 문서에 추가할 완성도 높은 보충 노트를 생성합니다.
 */
export async function summarizeConversationForDocument(
  history: ChatMessage[],
  selectedText: string,
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const target = selectedText.trim();
  const assistantMsgs = history.filter((m) => m.role === "assistant").map((m) => m.content);

  if (assistantMsgs.length === 0) {
    return `> 💡 **[보충 노트] ${target}**\n> '${target}'에 관한 세부 설명입니다.`;
  }

  // 대화 내용들을 체계적인 마크다운 보충 블록으로 종합 정리
  const combinedBody = assistantMsgs
    .map((text) => text.split("\n").join("\n> "))
    .join("\n>\n> ");

  return `> 💡 **[보충 노트] ${target} (AI 대화 요약)**\n> ${combinedBody}`;
}

/**
 * 생성된 대화 요약 노트를 마크다운 문서의 선택 구절 아래에 자연스럽게 삽입합니다.
 */
export function insertSummaryIntoMarkdown(
  originalMarkdown: string,
  selectedText: string,
  summaryContent: string,
): string {
  if (!originalMarkdown) return originalMarkdown;

  const target = selectedText.trim();
  const formattedNote = `\n\n${summaryContent}\n`;

  // 1. 완벽히 일치하는 위치 찾기
  const matchIndex = originalMarkdown.indexOf(target);

  if (matchIndex !== -1) {
    const lineEndIndex = originalMarkdown.indexOf("\n", matchIndex + target.length);
    const insertPosition = lineEndIndex !== -1 ? lineEndIndex : originalMarkdown.length;

    const before = originalMarkdown.slice(0, insertPosition);
    const after = originalMarkdown.slice(insertPosition);
    return before + formattedNote + after;
  }

  // 2. 일치하는 위치가 없을 시 문서 맨 끝에 부록 형태로 추가
  return `${originalMarkdown.trim()}\n\n---${formattedNote}`;
}
