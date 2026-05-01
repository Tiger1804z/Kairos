import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Plus, Maximize2 } from "lucide-react";
import { useAskKairos } from "../../hooks/useAskKairos";
import { MessageContent } from "./MessageContent";
import ChatModal from "./ChatModal";
import { useI18n } from "../../i18n/useI18n";

export default function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const { ask, newConversation, messages, loading, error, expanded, setExpanded } = useAskKairos();
  const { t } = useI18n();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleAsk = () => {
    if (!question.trim() || loading) return;
    ask(question);
    setQuestion("");
  };

  const handleClose = () => {
    setOpen(false);
    setQuestion("");
  };

  const visibleMessages = messages.slice(-3);

  return (
    <>
      {/* Bouton flottant — remonté sur mobile pour laisser place à la bottom nav */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-accent-hover md:bottom-6 md:right-6"
      >
        <MessageCircle className="h-4 w-4" />
        {t("chat.askKairos")}
      </button>

      {/* Overlay */}
      {open && !expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex h-[560px] w-full max-w-full flex-col bg-surface ring-1 ring-white/10 shadow-2xl transition-transform duration-300 sm:left-auto sm:max-w-md sm:rounded-tl-2xl ${
          open && !expanded ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <p className="text-sm font-bold text-white">{t("chat.title")}</p>
            </div>
            <p className="mt-0.5 text-xs text-white/40">
              {messages.length > 3
                ? t("chat.messages", { count: messages.length, plural: messages.length > 1 ? "s" : "" })
                : t("chat.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(true)}
              title={t("chat.expand")}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={newConversation}
              title={t("chat.newConversation")}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && !loading && !error && (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-white/40">
                {t("chat.example")}
              </p>
            </div>
          )}

          {messages.length > 3 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-accent/60 hover:bg-white/[0.04] hover:text-accent transition"
            >
              <span>↑</span>
              <span>{t("chat.previous", { count: messages.length - 3 })}</span>
            </button>
          )}

          {visibleMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
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
              <div className="rounded-2xl rounded-bl-sm bg-card px-4 py-3 ring-1 ring-white/10">
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
        <div className="border-t border-white/10 bg-white/[0.02] px-5 py-4 flex gap-3">
          <input
            type="text"
            className="min-w-0 flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-accent/30"
            placeholder={t("chat.input.placeholder")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAsk();
            }}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("chat.send")}
          </button>
        </div>
      </div>

      {/* Modal étendu */}
      {expanded && (
        <ChatModal
          messages={messages}
          loading={loading}
          error={error}
          onAsk={(q) => ask(q)}
          onClose={() => setExpanded(false)}
          onNewConversation={() => { newConversation(); }}
        />
      )}
    </>
  );
}
