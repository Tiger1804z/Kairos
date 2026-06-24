import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BusinessInfoStep from "./BusinessInfoStep";
import { useBusinessContext } from "../../business/BusinessContext";
import { connectShopify } from "../../services/shopifyService";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const CURRENCIES = ["CAD", "USD", "EUR", "GBP"];

type View = "choice" | "shopify" | "manual";

export default function OnboardingPage() {
  const { refreshBusinesses } = useBusinessContext();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("choice");
  const [businessName, setBusinessName] = useState("");
  const [businessCurrency, setBusinessCurrency] = useState("CAD");
  const [shopDomain, setShopDomain] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNext() {
    await refreshBusinesses();
    navigate("/dashboard");
  }

  async function handleConnectShopify(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim() || !shopDomain.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      // create business first so backend callback has a valid businessId
      const bizRes = await api.post("/onboarding/business", {
        name: businessName.trim(),
        currency: businessCurrency,
        consent_accepted: consentAccepted,
      });
      const businessId = bizRes.data?.business?.id_business ?? bizRes.data?.id_business;
      if (!businessId) {
        setError("Erreur: impossible de récupérer l'identifiant du business créé.");
        setConnecting(false);
        return;
      }

      await refreshBusinesses();
      sessionStorage.setItem("shopify_from_onboarding", "1");

      const data = await connectShopify(shopDomain.trim(), businessId);
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err: any) {
      const errCode = err.response?.data?.error;
      const errMsg =
        errCode === "BUSINESS_NAME_ALREADY_EXISTS"
          ? "Un business avec ce nom existe déjà."
          : (err.response?.data?.message ?? "Erreur lors de la connexion Shopify.");
      setError(errMsg);
      setConnecting(false);
    }
  }

  if (view === "manual") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-white">
        <div className="w-full max-w-2xl">
          <BusinessInfoStep onNext={handleNext} />
        </div>
      </div>
    );
  }

  if (view === "shopify") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-white">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <h2 className="text-xl font-semibold">Connecter votre boutique Shopify</h2>
            <p className="mt-1 text-sm text-white/60">
              Créez votre business et connectez votre boutique en une étape.
            </p>
            <form onSubmit={handleConnectShopify} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/60">Nom du business *</label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Acme Corp"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60">Devise *</label>
                <select
                  value={businessCurrency}
                  onChange={(e) => setBusinessCurrency(e.target.value)}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-white/20"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c} className="bg-gray-900">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60">Domaine Shopify *</label>
                <Input
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  placeholder="votre-boutique.myshopify.com"
                  required
                />
              </div>
              {/* consentement politique de confidentialite — obligatoire, non precoché */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-500"
                  required
                />
                <span className="text-sm text-white/60">
                  J'accepte la politique de confidentialité et le traitement de mes données conformément à la Loi 25 / RGPD.
                </span>
              </label>
              {error && (
                <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
                  {error}
                </div>
              )}
              <Button type="submit" disabled={connecting || !consentAccepted} className="w-full">
                {connecting ? "Connexion..." : "Connecter →"}
              </Button>
              <button
                type="button"
                onClick={() => setView("choice")}
                className="w-full text-center text-sm text-white/40 transition hover:text-white/60"
              >
                ← Retour
              </button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">Bienvenue sur Kairos</h1>
          <p className="mt-2 text-sm text-white/60">
            Connectez votre boutique Shopify pour démarrer automatiquement.
          </p>
        </div>
        <div className="space-y-3">
          <Button className="w-full" onClick={() => setView("shopify")}>
            Connecter ma boutique Shopify
          </Button>
          <button
            type="button"
            onClick={() => setView("manual")}
            className="w-full rounded-xl px-4 py-3 text-sm text-white/50 ring-1 ring-white/10 transition hover:text-white/70 hover:ring-white/20"
          >
            Continuer sans Shopify
          </button>
        </div>
      </div>
    </div>
  );
}
