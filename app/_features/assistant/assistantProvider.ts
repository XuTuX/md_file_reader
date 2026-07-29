export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface AssistantProvider {
  sendMessage(
    history: ChatMessage[],
    question: string,
    selectedText: string,
  ): Promise<ChatMessage>;
  summarize(history: ChatMessage[], selectedText: string): Promise<string>;
}

