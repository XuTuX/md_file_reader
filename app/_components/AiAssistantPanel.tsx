"use client";

import { useState, useEffect, useRef } from "react";
import {
  sendChatMessage,
  summarizeConversationForDocument,
  type ChatMessage,
} from "../_lib/aiAssistant";
import { CloseIcon } from "./icons";

interface Props {
  selectedText: string;
  onAddToDocument: (selectedText: string, summary: string) => void;
  onClose: () => void;
}

export default function AiAssistantPanel({ selectedText, onAddToDocument, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: `user-init-${Date.now()}`,
      role: "user",
      content: "이게 뭐야?",
      createdAt: Date.now(),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 최초 렌더링 시 첫 질문("이게 뭐야?") 자동 시작
  useEffect(() => {
    if (!selectedText) return;
    let isMounted = true;

    sendChatMessage([], "이게 뭐야?", selectedText)
      .then((aiResponse) => {
        if (isMounted) {
          setMessages((prev) => [...prev, aiResponse]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedText]);

  // 사용자 추가 질문 전송
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = inputQuestion.trim();
    if (!q || loading || summarizing) return;

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      createdAt: Date.now(),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInputQuestion("");
    setLoading(true);

    try {
      const aiReply = await sendChatMessage(updatedHistory, q, selectedText);
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // 대화 내용을 종합하여 문서에 반영
  const handleSummarizeAndAdd = async () => {
    if (summarizing || messages.length === 0) return;
    setSummarizing(true);

    try {
      const summary = await summarizeConversationForDocument(messages, selectedText);
      onAddToDocument(selectedText, summary);
    } catch {
      // ignore
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[90vw] max-w-md flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 sm:w-[440px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
            💬
          </span>
          <div>
            <h3 className="font-semibold text-stone-800 text-sm">AI 문맥 실시간 대화</h3>
            <p className="text-[11px] text-stone-400">자유롭게 추가 질문 후 문서에 반영하세요</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          aria-label="닫기"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Selected Text Badge */}
      <div className="mt-2 shrink-0 rounded-lg bg-stone-50 p-2 border border-stone-200/60">
        <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400 block mb-0.5">
          대화 대상 구절
        </span>
        <p className="text-xs font-medium text-stone-700 line-clamp-1 italic">
          &quot;{selectedText}&quot;
        </p>
      </div>

      {/* Messages Feed */}
      <div
        ref={chatContainerRef}
        className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1 text-xs leading-relaxed"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-stone-100 text-stone-800 rounded-bl-none border border-stone-200/60"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="rounded-2xl rounded-bl-none bg-stone-100 px-3.5 py-2 text-stone-400 flex items-center gap-1.5 border border-stone-200/60">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span>답변을 작성하는 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2 shrink-0">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="궁금한 점을 계속 질문해 보세요..."
          disabled={loading || summarizing}
          className="flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-800 shadow-sm placeholder:text-stone-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || loading || summarizing}
          className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          전송
        </button>
      </form>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-stone-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
        >
          넘어가기
        </button>
        <button
          type="button"
          disabled={messages.length === 0 || summarizing}
          onClick={handleSummarizeAndAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {summarizing ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>대화 요약 중...</span>
            </>
          ) : (
            <>
              <span>📄</span> 대화 내용 문서에 추가
            </>
          )}
        </button>
      </div>
    </div>
  );
}
