import { useRef, useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import type { ChatMessage } from "../../hooks/useAskKairos";

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
      <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-[#0f0f12] ring-1 ring-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-white">Kairos AI</p>
            <p className="text-xs text-white/40">Historique complet</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onNewConversation}
              title="Nouvelle conversation"
              className="text-white/40 hover:text-white transition"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && !loading && !error && (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-white/30">
                Ex: "Quel produit arrêter de vendre ?"
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white/8 text-white/80 rounded-bl-sm ring-1 ring-white/10"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <span className="text-sm text-white/40">Kairos réfléchit...</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 px-6 py-4 flex gap-3">
          <textarea
            rows={2}
            className="flex-1 resize-none rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 ring-1 ring-white/10 focus:outline-none focus:ring-white/30"
            placeholder="Ta question..."
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
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed self-end"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
