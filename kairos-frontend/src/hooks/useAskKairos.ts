import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useBusinessContext } from "../business/BusinessContext";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function useAskKairos() {
  const { selectedBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-load de la dernière conversation au montage
  const loadLastConversation = useCallback(async () => {
    if (!selectedBusiness) return;
    try {
      const res = await api.get(`/ai/shopify/${selectedBusiness.id_business}/conversations`);
      const conversations = res.data.conversations;
      if (conversations.length === 0) return;

      const last = conversations[0];
      const msgsRes = await api.get(`/ai/shopify/conversations/${last.id}`);
      setConversationId(last.id);
      setMessages(msgsRes.data.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })));
    } catch {
      // Pas de conversation existante, on démarre vide
    }
  }, [selectedBusiness]);

  useEffect(() => {
    loadLastConversation();
  }, [loadLastConversation]);

  async function ask(question: string) {
    if (!selectedBusiness) return;

    // Ajoute le message user immédiatement (UX optimiste)
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/ai/shopify/${selectedBusiness.id_business}/ask`, {
        question,
        conversationId,
      });
      setConversationId(res.data.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.answer }]);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Request failed");
      // Retire le message user optimiste si erreur
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }

  const [expanded, setExpanded] = useState(false);

  return { ask, newConversation, messages, loading, error, conversationId, expanded, setExpanded };
}
