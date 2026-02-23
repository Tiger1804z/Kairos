import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useBusinessContext } from "../../business/BusinessContext";

// le resultat retourne par le backend apres un import (CSV ou demo)
type ImportResult = {
  jobId?: string;
  insertedCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: Array<{ rowNumber: number; message: string }>;
};

export default function ImportResultStep({ result }: { result: ImportResult | null }) {
  const navigate = useNavigate();
  const { refreshBusinesses } = useBusinessContext();

  // quand le user clique "Aller au dashboard" :
  // 1. on refresh les businesses pour que le nouveau business apparaisse dans le selector
  // 2. on navigue vers le dashboard
  async function handleGoDashboard() {
    await refreshBusinesses();
    // { state: { fromImport: true } } signale au DashboardPage de re-fetcher ses données
    navigate("/dashboard", { state: { fromImport: true } });
  }

  // si on arrive ici sans resultat (cas improbable), on affiche un fallback
  if (!result) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-4 text-xl font-semibold">Import terminé !</h2>
        <Button onClick={handleGoDashboard} className="mt-6 w-full">
          Aller au Dashboard →
        </Button>
      </Card>
    );
  }

  // import reussi si au moins une ligne inseree
  const isSuccess = result.insertedCount > 0;

  return (
    <div className="space-y-4">
      <Card className="p-8 text-center">
        <div className="text-4xl">{isSuccess ? "✅" : "⚠️"}</div>
        <h2 className="mt-4 text-xl font-semibold">
          {isSuccess ? "Import terminé avec succès !" : "Import terminé avec des problèmes"}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {isSuccess
            ? "Vos données sont prêtes. Explorez votre dashboard Kairos."
            : "Aucune ligne n'a pu être importée. Vérifiez votre fichier CSV."}
        </p>

        {/* compteurs : lignes inserees, ignorees, erreurs */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
            <div className="text-2xl font-semibold text-emerald-300">
              {result.insertedCount}
            </div>
            <div className="mt-1 text-xs text-white/60">Importées</div>
          </div>
          <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-2xl font-semibold text-white/70">
              {result.skippedCount}
            </div>
            <div className="mt-1 text-xs text-white/60">Ignorées</div>
          </div>
          <div className={`rounded-xl p-4 ring-1 ${result.errorCount > 0 ? "bg-red-500/10 ring-red-500/20" : "bg-white/5 ring-white/10"}`}>
            <div className={`text-2xl font-semibold ${result.errorCount > 0 ? "text-red-300" : "text-white/70"}`}>
              {result.errorCount}
            </div>
            <div className="mt-1 text-xs text-white/60">Erreurs</div>
          </div>
        </div>

        <Button onClick={handleGoDashboard} className="mt-6 w-full">
          Aller au Dashboard →
        </Button>
      </Card>

      {/* detail des erreurs si il y en a */}
      {result.errors && result.errors.length > 0 && (
        <Card className="p-6">
          <div className="text-sm font-semibold text-red-300">
            Détail des erreurs ({result.errors.length})
          </div>
          <div className="mt-3 space-y-2">
            {result.errors.map((err, i) => (
              <div key={i} className="rounded-lg bg-red-500/5 px-3 py-2 text-xs text-white/70 ring-1 ring-red-500/10">
                <span className="text-red-300">Ligne {err.rowNumber} :</span> {err.message}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
