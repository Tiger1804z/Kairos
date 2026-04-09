import { useEffect, useState } from "react";
import { useBusinessContext } from "../../business/BusinessContext";
import { computeInsights, getInsights, type Insight, type InsightSeverity } from "../../services/insightService";
import { Card } from "../../components/ui/Card";

const SEVERITY_ORDER: InsightSeverity[] = ["critical", "warning", "info"];

const SEVERITY_STYLES: Record<InsightSeverity, { bar: string; badge: string; label: string }> = {
  critical: {
    bar: "bg-red-500",
    badge: "bg-red-500/10 text-red-400 ring-1 ring-red-500/30",
    label: "Critique",
  },
  warning: {
    bar: "bg-yellow-400",
    badge: "bg-yellow-400/10 text-yellow-300 ring-1 ring-yellow-400/30",
    label: "Attention",
  },
  info: {
    bar: "bg-blue-400",
    badge: "bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/30",
    label: "Info",
  },
};

function InsightCard({ insight }: { insight: Insight }) {
  const style = SEVERITY_STYLES[insight.severity];
  return (
    <div className="flex gap-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className={`mt-1 h-full w-1 shrink-0 rounded-full ${style.bar}`} />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style.badge}`}>
            {style.label}
          </span>
        </div>
        <p className="text-sm font-medium text-white">{insight.title}</p>
        <p className="text-xs text-white/60">{insight.message}</p>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { selectedBusinessId } = useBusinessContext();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsights() {
    if (!selectedBusinessId) return;
    try {
      const data = await getInsights(selectedBusinessId);
      setInsights(data);
    } catch {
      setError("Impossible de charger les insights.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompute() {
    if (!selectedBusinessId) return;
    setComputing(true);
    setError(null);
    try {
      const data = await computeInsights(selectedBusinessId);
      setInsights(data);
    } catch {
      setError("Erreur lors du calcul des insights.");
    } finally {
      setComputing(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchInsights();
  }, [selectedBusinessId]);

  const grouped = SEVERITY_ORDER.reduce<Record<InsightSeverity, Insight[]>>(
    (acc, sev) => {
      acc[sev] = insights.filter((i) => i.severity === sev);
      return acc;
    },
    { critical: [], warning: [], info: [] }
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Insights</h1>
          <p className="mt-1 text-sm text-white/50">
            Alertes et opportunités détectées automatiquement sur vos produits.
          </p>
        </div>
        <button
          onClick={handleCompute}
          disabled={computing || !selectedBusinessId}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 transition hover:bg-white/20 disabled:opacity-50"
        >
          {computing ? "Calcul en cours…" : "Recalculer"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p className="text-sm text-white/40">Chargement…</p>
      ) : insights.length === 0 ? (
        <Card>
          <p className="text-sm text-white/50">
            Aucun insight disponible. Cliquez sur <strong>Recalculer</strong> pour lancer l'analyse.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {SEVERITY_ORDER.map((sev) => {
            const group = grouped[sev];
            if (group.length === 0) return null;
            const style = SEVERITY_STYLES[sev];
            return (
              <section key={sev}>
                <h2 className={`mb-3 text-xs font-semibold uppercase tracking-widest ${style.badge.split(" ")[1]}`}>
                  {style.label} ({group.length})
                </h2>
                <div className="space-y-3">
                  {group.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
