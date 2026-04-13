import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Plus, Maximize2 } from "lucide-react";
import { useAskKairos } from "../../hooks/useAskKairos";
import ChatModal from "./ChatModal";

export default function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const { ask, newConversation, messages, loading, error, expanded, setExpanded } = useAskKairos();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll auto vers le bas à chaque nouveau message
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

  // Drawer affiche seulement les 3 derniers messages
  const visibleMessages = messages.slice(-3);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition"
      >
        <MessageCircle className="h-4 w-4" />
        Ask Kairos
      </button>

      {/* Overlay drawer */}
      {open && !expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 right-0 z-50 flex h-[560px] w-full max-w-md flex-col rounded-tl-2xl bg-[#0f0f12] ring-1 ring-white/10 shadow-2xl transition-transform duration-300 ${
          open && !expanded ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">Kairos AI</p>
            <p className="text-xs text-white/40">
              {messages.length > 3 ? `${messages.length} messages — vue partielle` : "Pose une question sur ta rentabilité"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(true)}
              title="Agrandir"
              className="text-white/40 hover:text-white transition"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={newConversation}
              title="Nouvelle conversation"
              className="text-white/40 hover:text-white transition"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button onClick={handleClose} className="text-white/40 hover:text-white transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages (3 derniers) */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && !loading && !error && (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-white/30">
                Ex: "Quel produit arrêter de vendre ?"
              </p>
            </div>
          )}

          {messages.length > 3 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 transition py-1"
            >
              ↑ Voir les {messages.length - 3} messages précédents
            </button>
          )}

          {visibleMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-line ${
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
              <div className="rounded-2xl rounded-bl-sm bg-white/8 px-4 py-2 ring-1 ring-white/10">
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
        <div className="border-t border-white/10 px-5 py-4 flex gap-3">
          <input
            type="text"
            className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 ring-1 ring-white/10 focus:outline-none focus:ring-white/30"
            placeholder="Ta question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAsk();
            }}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Envoyer
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
