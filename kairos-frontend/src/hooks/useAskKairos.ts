import { useState } from "react";
import { api } from "../lib/api";
import { useBusinessContext } from "../business/BusinessContext";

export function useAskKairos() {
  const { selectedBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    if (!selectedBusiness) {
      setError("No business selected");
      return;
    }
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await api.post(`/ai/shopify/${selectedBusiness.id_business}/ask`, { question });
      setResponse(res.data.answer);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResponse(null);
    setError(null);
    setLoading(false);
  }

  return { ask, reset, response, loading, error };
}
