import { useState } from "react";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

// les secteurs d'activite disponibles dans le dropdown
const INDUSTRIES = [
  "Technology", "Retail", "Food & Beverage", "Healthcare",
  "Construction", "Consulting", "Education", "Finance", "Other",
];

// les devises supportees
const CURRENCIES = ["CAD", "USD", "EUR", "GBP"];

export default function BusinessInfoStep({ onNext }: { onNext: (id: number) => void }) {
  // champs du formulaire
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [industry, setIndustry] = useState("");

  // etat de la requete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // empeche le rechargement de la page
    setLoading(true);
    setError(null);

    try {
      // appel POST /onboarding/business pour creer le business
      const res = await api.post("/onboarding/business", {
        name,
        currency,
        industry: industry || undefined, // optionnel, on envoie pas si vide
      });

      // le backend retourne l'id du business cree
      onNext(res.data.id_business);
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

        {/* secteur d'activite - optionnel */}
        <div>
          <label className="mb-1 block text-sm text-white/60">Secteur d'activité (optionnel)</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-white/20"
          >
            <option value="" className="bg-gray-900">-- Choisir --</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind} className="bg-gray-900">{ind}</option>
            ))}
          </select>
        </div>

        {/* message d'erreur si l'appel API echoue */}
        {error && (
          <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Création en cours..." : "Continuer →"}
        </Button>
      </form>
    </Card>
  );
}
