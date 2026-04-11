import { useOutletContext, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { useBusinessContext } from "../../business/BusinessContext";
import { useShopifyKpis } from "../../hooks/useShopifyKpis";

type MeUser = {
  id_user: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "owner" | "admin" | "employee";
};

const SEVERITY_STYLES = {
  critical: "bg-red-500/10 text-red-300 ring-red-500/20",
  warning: "bg-orange-500/10 text-orange-300 ring-orange-500/20",
  info: "bg-blue-500/10 text-blue-300 ring-blue-500/20",
};

const SEVERITY_DOT = {
  critical: "bg-red-400",
  warning: "bg-orange-400",
  info: "bg-blue-400",
};

export default function DashboardPage() {
  const { me, loadingMe } = useOutletContext<{ me: MeUser | null; loadingMe: boolean }>();
  const { selectedBusinessId, loading: loadingBusiness } = useBusinessContext();
  const { kpis, loading, error } = useShopifyKpis(selectedBusinessId);
  const navigate = useNavigate();

  const name = me ? `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() || me.email : "—";

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);

  const marginColor = (pct: number) =>
    pct < 0 ? "text-red-400" : pct < 15 ? "text-orange-400" : "text-emerald-400";

  // Signaux critiques affichés dans le header
  const signals = kpis && !loading
    ? [
        kpis.negativeProfitCount > 0 && {
          label: `${kpis.negativeProfitCount} product${kpis.negativeProfitCount > 1 ? "s" : ""} losing money`,
          dot: "bg-red-400",
          pill: "bg-red-500/10 text-red-300 ring-1 ring-red-500/20 hover:bg-red-500/20",
          to: "/dashboard/products",
        },
        kpis.missingCostsCount > 0 && {
          label: `${kpis.missingCostsCount} missing cost${kpis.missingCostsCount > 1 ? "s" : ""}`,
          dot: "bg-orange-400",
          pill: "bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/20 hover:bg-orange-500/20",
          to: "/dashboard/products",
        },
        kpis.recentInsights.length > 0 && {
          label: `${kpis.recentInsights.length} active insight${kpis.recentInsights.length > 1 ? "s" : ""}`,
          dot: "bg-blue-400",
          pill: "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 hover:bg-blue-500/20",
          to: "/dashboard/insights",
        },
      ].filter(Boolean) as { label: string; dot: string; pill: string; to: string }[]
    : [];

  return (
    <div className="relative">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-260px] h-[560px] w-[880px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">

        {/* ── Executive Summary Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {loadingMe ? "..." : `Welcome back, ${name}.`}
            </h1>
            <p className="mt-0.5 text-sm text-white/40">Shopify profit overview</p>
          </div>

          {/* Status signals — n'apparaissent que si des données existent */}
          {signals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {signals.map((s) => (
                <button
                  key={s.label}
                  onClick={() => navigate(s.to)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${s.pill}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="mt-6 border-t border-white/5" />

        {/* Erreur */}
        {error && (
          <div className="mt-6 rounded-2xl bg-red-500/10 p-4 text-center text-sm text-red-300 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        {/* No business */}
        {!selectedBusinessId && !loadingBusiness && (
          <div className="mt-6 rounded-2xl bg-yellow-500/10 p-4 text-center text-sm text-yellow-300 ring-1 ring-yellow-500/20">
            Please select a business to view your dashboard
          </div>
        )}

        {selectedBusinessId && (
          <div className="mt-6 space-y-6">

            {/* ── Row 1 — Métriques globales ── */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-6">
                <div className="text-xs text-white/50 uppercase tracking-wider">Total Revenue</div>
                <div className="mt-2 text-2xl font-semibold">
                  {loading ? "..." : fmt(kpis?.totalRevenue ?? 0)}
                </div>
                <div className="mt-1 text-xs text-white/40">
                  {kpis?.productsTracked ?? 0} products tracked
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-xs text-white/50 uppercase tracking-wider">Real Profit</div>
                <div className={`mt-2 text-2xl font-semibold ${kpis ? marginColor(kpis.totalProfit) : ""}`}>
                  {loading ? "..." : fmt(kpis?.totalProfit ?? 0)}
                </div>
                <div className="mt-1 text-xs text-white/40">After COGS</div>
              </Card>

              <Card className="p-6">
                <div className="text-xs text-white/50 uppercase tracking-wider">Avg Margin</div>
                <div className={`mt-2 text-2xl font-semibold ${kpis ? marginColor(kpis.avgMarginPct) : ""}`}>
                  {loading ? "..." : `${kpis?.avgMarginPct ?? 0}%`}
                </div>
                <div className="mt-1 text-xs text-white/40">Weighted by revenue</div>
              </Card>

              <Card className={`p-6 ${kpis && kpis.missingCostsCount > 0 ? "ring-1 ring-orange-500/30" : ""}`}>
                <div className="text-xs text-white/50 uppercase tracking-wider">Missing Costs</div>
                <div className={`mt-2 text-2xl font-semibold ${kpis && kpis.missingCostsCount > 0 ? "text-orange-400" : "text-white/60"}`}>
                  {loading ? "..." : kpis?.missingCostsCount ?? 0}
                </div>
                {kpis && kpis.missingCostsCount > 0 ? (
                  <button
                    onClick={() => navigate("/dashboard/products")}
                    className="mt-1 text-xs text-orange-400/80 hover:text-orange-300 transition text-left"
                  >
                    Fix in Products →
                  </button>
                ) : (
                  <div className="mt-1 text-xs text-white/40">All costs entered</div>
                )}
              </Card>
            </div>

            {/* ── Row 2 — Signaux de risque ── */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className={`p-6 ${kpis && kpis.negativeProfitCount > 0 ? "ring-1 ring-red-500/30" : ""}`}>
                <div className="text-xs text-white/50 uppercase tracking-wider">Products Losing Money</div>
                <div className={`mt-2 text-2xl font-semibold ${kpis && kpis.negativeProfitCount > 0 ? "text-red-400" : "text-white/60"}`}>
                  {loading ? "..." : kpis?.negativeProfitCount ?? 0}
                </div>
                <div className="mt-1 text-xs text-white/40">Negative gross profit</div>
              </Card>

              <Card className={`p-6 ${kpis && kpis.lowMarginCount > 0 ? "ring-1 ring-orange-500/20" : ""}`}>
                <div className="text-xs text-white/50 uppercase tracking-wider">Low Margin</div>
                <div className={`mt-2 text-2xl font-semibold ${kpis && kpis.lowMarginCount > 0 ? "text-orange-400" : "text-white/60"}`}>
                  {loading ? "..." : kpis?.lowMarginCount ?? 0}
                </div>
                <div className="mt-1 text-xs text-white/40">Products under 15% margin</div>
              </Card>

              <Card className="p-6">
                <div className="text-xs text-white/50 uppercase tracking-wider">Top Profit Product</div>
                {loading ? (
                  <div className="mt-2 text-2xl font-semibold">...</div>
                ) : kpis?.topProfitProduct ? (
                  <>
                    <div className="mt-2 text-sm font-semibold text-emerald-400 leading-tight truncate">
                      {kpis.topProfitProduct.title}
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      {fmt(kpis.topProfitProduct.profit)} · {kpis.topProfitProduct.marginPct}% margin
                    </div>
                  </>
                ) : (
                  <div className="mt-2 text-sm text-white/40">No data yet</div>
                )}
              </Card>

              <Card className={`p-6 ${kpis && kpis.revenueAtRisk > 0 ? "ring-1 ring-red-500/20" : ""}`}>
                <div className="text-xs text-white/50 uppercase tracking-wider">Revenue at Risk</div>
                <div className={`mt-2 text-2xl font-semibold ${kpis && kpis.revenueAtRisk > 0 ? "text-red-400" : "text-white/60"}`}>
                  {loading ? "..." : fmt(kpis?.revenueAtRisk ?? 0)}
                </div>
                <div className="mt-1 text-xs text-white/40">
                  Negative margin or missing cost
                </div>
              </Card>
            </div>

            {/* ── Panels ── */}
            <div className="grid gap-6 md:grid-cols-2">

              {/* Top Products by Profit */}
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold">Top Products by Profit</div>
                  <button
                    onClick={() => navigate("/dashboard/products")}
                    className="text-xs text-white/40 hover:text-white/70 transition"
                  >
                    View all →
                  </button>
                </div>
                {loading ? (
                  <div className="flex h-48 items-center justify-center text-sm text-white/40">Loading...</div>
                ) : kpis?.topProductsByProfit && kpis.topProductsByProfit.length > 0 ? (
                  <div className="space-y-2">
                    {kpis.topProductsByProfit.map((p) => (
                      <div key={p.productId} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{p.title}</div>
                          <div className="text-xs text-white/40">{p.unitsSold} sold · {fmt(p.revenue)} rev</div>
                        </div>
                        <div className="ml-4 text-right shrink-0">
                          <div className={`text-sm font-semibold ${marginColor(p.marginPct)}`}>
                            {fmt(p.grossProfit)}
                          </div>
                          <div className={`text-xs ${marginColor(p.marginPct)}`}>{p.marginPct}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-white/40">
                    No profitability data — compute it in Products
                  </div>
                )}
              </Card>

              {/* Highest Risk Products */}
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold">Highest Risk Products</div>
                  <button
                    onClick={() => navigate("/dashboard/insights")}
                    className="text-xs text-white/40 hover:text-white/70 transition"
                  >
                    See insights →
                  </button>
                </div>
                {loading ? (
                  <div className="flex h-48 items-center justify-center text-sm text-white/40">Loading...</div>
                ) : kpis?.highestRiskProducts && kpis.highestRiskProducts.length > 0 ? (
                  <div className="space-y-2">
                    {kpis.highestRiskProducts.map((p) => (
                      <div key={p.productId} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/5">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{p.title}</div>
                          <div className="text-xs text-white/40">{fmt(p.revenue)} revenue</div>
                        </div>
                        <div className="ml-4 text-right shrink-0">
                          <div className={`text-sm font-semibold ${p.marginPct < 0 ? "text-red-400" : "text-orange-400"}`}>
                            {p.marginPct}%
                          </div>
                          <div className={`text-[11px] uppercase tracking-wide ${p.riskReason === "negative_margin" ? "text-red-400/70" : "text-orange-400/70"}`}>
                            {p.riskReason === "negative_margin" ? "losing money" : "no cost"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-emerald-400/60">
                    No risk signals detected
                  </div>
                )}
              </Card>

              {/* Active Insights */}
              <Card className="p-6 md:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold">Active Insights</div>
                  <button
                    onClick={() => navigate("/dashboard/insights")}
                    className="text-xs text-white/40 hover:text-white/70 transition"
                  >
                    View all →
                  </button>
                </div>
                {loading ? (
                  <div className="flex h-20 items-center justify-center text-sm text-white/40">Loading...</div>
                ) : kpis?.recentInsights && kpis.recentInsights.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {kpis.recentInsights.map((insight, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-4 ring-1 ${SEVERITY_STYLES[insight.severity]}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[insight.severity]}`} />
                          <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                            {insight.severity}
                          </span>
                        </div>
                        <div className="text-sm font-semibold leading-snug">{insight.title}</div>
                        <div className="mt-1 text-xs opacity-70 line-clamp-2">{insight.message}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-20 items-center justify-center text-sm text-white/40">
                    No insights yet — compute them in Insights
                  </div>
                )}
              </Card>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
