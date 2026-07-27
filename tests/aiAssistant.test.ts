import { describe, expect, it } from "vitest";
import {
  sendChatMessage,
  summarizeConversationForDocument,
  insertSummaryIntoMarkdown,
  type ChatMessage,
} from "../app/_lib/aiAssistant";

describe("aiAssistant 멀티턴 대화 & 요약 유틸리티 테스트", () => {
  it("sendChatMessage가 멀티턴 질문에 답변을 생성해야 한다", async () => {
    const history: ChatMessage[] = [];
    const reply1 = await sendChatMessage(history, "이게 뭐야?", "useEffect");
    expect(reply1.role).toBe("assistant");
    expect(reply1.content).toContain("useEffect");

    const history2 = [
      { id: "1", role: "user" as const, content: "이게 뭐야?", createdAt: Date.now() },
      reply1,
    ];
    const reply2 = await sendChatMessage(history2, "예시 코드를 보여줘", "useEffect");
    expect(reply2.content).toContain("예시");
  });

  it("summarizeConversationForDocument가 대화 히스토리를 종합하여 마크다운 요약을 생성해야 한다", async () => {
    const history: ChatMessage[] = [
      { id: "1", role: "user", content: "이게 뭐야?", createdAt: Date.now() },
      { id: "2", role: "assistant", content: "React의 사이드 이펙트 훅입니다.", createdAt: Date.now() },
    ];

    const summary = await summarizeConversationForDocument(history, "useEffect");
    expect(summary).toContain("> 💡 **[보충 노트] useEffect (AI 대화 요약)**");
    expect(summary).toContain("> React의 사이드 이펙트 훅입니다.");
  });

  it("insertSummaryIntoMarkdown이 마크다운 내 선택 텍스트 아래에 대화 요약 노트를 삽입해야 한다", () => {
    const original = "React의 useEffect는 사이드 이펙트를 처리합니다.\n다음 문장입니다.";
    const summary = "> 💡 **[보충 노트] useEffect**\n> 대화 내용 정리본입니다.";

    const patched = insertSummaryIntoMarkdown(original, "useEffect", summary);
    expect(patched).toContain("React의 useEffect는 사이드 이펙트를 처리합니다.");
    expect(patched).toContain("> 💡 **[보충 노트] useEffect**");
  });
});
