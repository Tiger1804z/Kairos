import { useState } from "react";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function ImportModeStep({
  businessId,
  onCsv,
  onDemo,
}: {
  businessId: number;
  onCsv: () => void;
  onDemo: (result: any) => void;
}) {
  // loading uniquement pour le bouton demo (CSV n'a pas de loading ici)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDemo() {
    setLoading(true);
    setError(null);

    try {
      // appel POST /onboarding/seed-demo pour inserer les donnees de demo
      const res = await api.post(`/onboarding/seed-demo`, { businessId });
      onDemo(res.data); // passer le resultat au parent (step 3)
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Erreur lors du chargement des données démo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Comment voulez-vous importer vos données ?</h2>
        <p className="mt-1 text-sm text-white/60">
          Choisissez votre source de données pour commencer.
        </p>
      </div>

      {/* option CSV - recommandee */}
      <Card
        className="cursor-pointer p-6 transition hover:ring-white/30"
        onClick={onCsv}
      >
        <div className="flex items-start gap-4">
          <div className="text-2xl">📄</div>
          <div>
            <div className="font-semibold">Importer un fichier CSV</div>
            <div className="mt-1 text-sm text-white/60">
              Importez vos transactions existantes depuis un fichier CSV.
              L'IA détectera automatiquement les colonnes.
            </div>
            <div className="mt-3">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 ring-1 ring-emerald-500/20">
                Recommandé
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* option donnees demo */}
      <Card
        className={`p-6 transition ${loading ? "opacity-50" : "cursor-pointer hover:ring-white/30"}`}
        onClick={loading ? undefined : handleDemo}
      >
        <div className="flex items-start gap-4">
          <div className="text-2xl">🧪</div>
          <div>
            <div className="font-semibold">Utiliser des données de démonstration</div>
            <div className="mt-1 text-sm text-white/60">
              Chargez des données fictives pour explorer Kairos sans fichier CSV.
              Idéal pour tester la plateforme.
            </div>
            {loading && (
              <div className="mt-2 text-xs text-white/40">Chargement en cours...</div>
            )}
          </div>
        </div>
      </Card>

      {/* erreur API */}
      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
          {error}
        </div>
      )}
    </div>
  );
}
