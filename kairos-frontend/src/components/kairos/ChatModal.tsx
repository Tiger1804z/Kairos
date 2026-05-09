import { useRef, useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import type { ChatMessage } from "../../hooks/useAskKairos";
import { MessageContent } from "./MessageContent";
import { useI18n } from "../../i18n/useI18n";

interface ChatModalProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  onAsk: (question: string) => void;
  onClose: () => void;
  onNewConversation: () => void;
}

export default function ChatModal({
  messages,
  loading,
  error,
  onAsk,
  onClose,
  onNewConversation,
}: ChatModalProps) {
  const [question, setQuestion] = useState("");
  const { t } = useI18n();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = () => {
    if (!question.trim() || loading) return;
    onAsk(question);
    setQuestion("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex h-[82vh] w-full max-w-2xl flex-col rounded-2xl bg-surface ring-1 ring-white/10 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <p className="text-sm font-bold text-white">{t("chat.title")}</p>
            </div>
            <p className="mt-0.5 text-xs text-white/40">
              {messages.length > 0
                ? t("chat.messages", { count: messages.length, plural: messages.length > 1 ? "s" : "" })
                : t("chat.fullHistory")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewConversation}
              title={t("chat.newConversation")}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.length === 0 && !loading && !error && (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-white/40">
                {t("chat.example")}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-card text-white/70 rounded-bl-sm ring-1 ring-white/10"
                }`}
              >
                <MessageContent text={msg.content} isUser={msg.role === "user"} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-card px-4 py-3.5 ring-1 ring-white/10">
                <div className="flex items-center gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 rounded-full bg-white/30 animate-pulse"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 bg-white/[0.02] px-6 py-4 flex gap-3">
          <textarea
            rows={2}
            className="min-w-0 flex-1 resize-none rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-accent/30"
            placeholder={t("chat.input.placeholder")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="shrink-0 self-end rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("chat.send")}
          </button>
        </div>

      </div>
    </div>
  );
}
