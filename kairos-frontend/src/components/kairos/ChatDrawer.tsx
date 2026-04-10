import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAskKairos } from "../../hooks/useAskKairos";

export default function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const { ask, reset, response, loading, error } = useAskKairos();

  const handleAsk = () => {
    if (!question.trim()) return;
    ask(question);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
    setQuestion("");
  };

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

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 right-0 z-50 flex h-[520px] w-full max-w-md flex-col rounded-tl-2xl bg-[#0f0f12] ring-1 ring-white/10 shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">Kairos AI</p>
            <p className="text-xs text-white/40">Pose une question sur ta rentabilité</p>
          </div>
          <button onClick={handleClose} className="text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Réponse */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!response && !loading && !error && (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-white/30">
                Ex: "Quel produit arrêter de vendre ?"
              </p>
            </div>
          )}
          {loading && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-white/50">Analyse en cours...</p>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          {response && !loading && (
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
              {response}
            </p>
          )}
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
    </>
  );
}