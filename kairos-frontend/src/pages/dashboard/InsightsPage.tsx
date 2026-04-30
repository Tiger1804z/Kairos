import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessContext } from "../../business/BusinessContext";
import { computeInsights, getInsights, type Insight, type InsightSeverity } from "../../services/insightService";
import { Card } from "../../components/ui/Card";

const SEVERITY_ORDER: InsightSeverity[] = ["critical", "warning", "info"];

const SEVERITY_STYLES: Record<InsightSeverity, {
  bar: string;
  badge: string;
  card: string;
  heading: string;
  label: string;
}> = {
  critical: {
    bar: "bg-red-500",
    badge: "bg-red-500/10 text-red-400 ring-1 ring-red-500/30",
    card: "bg-red-500/[0.07] ring-1 ring-red-500/30",
    heading: "text-red-400",
    label: "Critique",
  },
  warning: {
    bar: "bg-warning",
    badge: "bg-warning/10 text-orange-300 ring-1 ring-warning/20",
    card: "bg-orange-500/[0.06] ring-1 ring-orange-500/25",
    heading: "text-orange-400",
    label: "Attention",
  },
  info: {
    bar: "bg-blue-400",
    badge: "bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/30",
    card: "bg-white/[0.06] ring-1 ring-white/10",
    heading: "text-blue-400",
    label: "Info",
  },
};

function InsightCard({ insight, onViewProduct }: { insight: Insight; onViewProduct: (productId: string) => void }) {
  const style = SEVERITY_STYLES[insight.severity];
  const productId = insight.metadata?.product_id ?? null;
  return (
    <div className={`flex gap-4 rounded-xl p-4 ${style.card}`}>
      <div className={`self-stretch w-1 shrink-0 rounded-full ${style.bar}`} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style.badge}`}>
            {style.label}
          </span>
        </div>
        <p className="text-sm font-semibold text-white leading-snug">{insight.title}</p>
        <p className="text-sm text-white/70 leading-relaxed">{insight.message}</p>
        {insight.action && (
          <p className="text-xs font-medium text-accent/80">
            → {insight.action}
          </p>
        )}
        {productId && (
          <button
            onClick={() => onViewProduct(productId)}
            className="mt-1 self-start inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent ring-1 ring-accent/20 transition hover:bg-accent/15"
          >
            Voir le produit →
          </button>
        )}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { selectedBusinessId } = useBusinessContext();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleViewProduct(productId: string) {
    navigate(`/dashboard/products?highlight=${productId}`);
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
          <p className="mt-1 text-sm text-white/40">
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

      {/* Content */}
      {loading ? (
        <p className="text-sm text-white/40">Chargement…</p>
      ) : insights.length === 0 ? (
        <Card>
          <p className="p-6 text-sm text-white/40">
            Aucun insight disponible. Cliquez sur{" "}
            <strong className="text-white/70">Recalculer</strong> pour lancer l'analyse.
          </p>
        </Card>
      ) : (
        <div className="space-y-10">
          {SEVERITY_ORDER.map((sev) => {
            const group = grouped[sev];
            if (group.length === 0) return null;
            const style = SEVERITY_STYLES[sev];
            return (
              <section key={sev}>
                <div className={`mb-5 text-xs font-semibold uppercase tracking-widest ${style.heading}`}>
                  {style.label} · {group.length}
                </div>
                <div className="space-y-3">
                  {group.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} onViewProduct={handleViewProduct} />
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
