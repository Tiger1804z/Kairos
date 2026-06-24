import { useState } from "react";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const CURRENCIES = ["CAD", "USD", "EUR", "GBP"];

export default function BusinessInfoStep({ onNext }: { onNext: () => void }) {
  // champs du formulaire
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("CAD");

  const [consentAccepted, setConsentAccepted] = useState(false);

  // etat de la requete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // empeche le rechargement de la page
    setLoading(true);
    setError(null);

    try {
      // appel POST /onboarding/business pour creer le business
      await api.post("/onboarding/business", { name, currency, consent_accepted: consentAccepted });

      // le backend retourne l'id du business cree
      onNext();
    } catch (err: any) {
      // le backend retourne { error: "CODE" } sans champ message
      // on mappe les codes d'erreur connus vers des messages lisibles
      const errCode = err.response?.data?.error;
      const errMsg =
        errCode === "BUSINESS_NAME_ALREADY_EXISTS"
          ? "Un business avec ce nom existe déjà."
          : (err.response?.data?.message ?? "Erreur lors de la création du business.");
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-8">
      <h2 className="text-xl font-semibold">Créez votre business</h2>
      <p className="mt-1 text-sm text-white/60">
        Ces informations seront utilisées pour configurer votre espace Kairos.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* nom du business - obligatoire */}
        <div>
          <label className="mb-1 block text-sm text-white/60">Nom du business *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Acme Corp"
            required
          />
        </div>

        {/* devise - obligatoire */}
        <div>
          <label className="mb-1 block text-sm text-white/60">Devise *</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-white/20"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c} className="bg-gray-900">{c}</option>
            ))}
          </select>
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

        {/* message d'erreur si l'appel API echoue */}
        {error && (
          <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading || !consentAccepted} className="w-full">
          {loading ? "Création en cours..." : "Continuer →"}
        </Button>
      </form>
    </Card>
  );
}
