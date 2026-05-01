import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { useBusinessContext } from "../../business/BusinessContext";
import { useShopifyKpis } from "../../hooks/useShopifyKpis";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n/useI18n";

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
  const { language, t } = useI18n();
  const { selectedBusinessId, loading: loadingBusiness } = useBusinessContext();
  const { kpis, loading, error, refetch } = useShopifyKpis(selectedBusinessId);
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleLoadDemo = async () => {
    if (!selectedBusinessId) return;
    setLoadingDemo(true);
    setDemoError(null);
    try {
      await api.post(`/demo/${selectedBusinessId}/load`);
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t("dashboard.demo.load");
      setDemoError(msg);
    } finally {
      setLoadingDemo(false);
    }
  };

  const name = me ? `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() || me.email : "—";

  const fmt = (amount: number) =>
    new Intl.NumberFormat(language === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(amount);

  const marginColor = (pct: number) =>
    pct < 0 ? "text-red-400" : pct < 15 ? "text-orange-400" : "text-emerald-400";

  const severityLabel = (severity: "critical" | "warning" | "info") =>
    t(`insights.severity.${severity}`);

  const signals = kpis && !loading
    ? [
        kpis.negativeProfitCount > 0 && {
          label: t("dashboard.signal.losingMoney", { count: kpis.negativeProfitCount, plural: kpis.negativeProfitCount > 1 ? "s" : "" }),
          dot: "bg-red-400",
          pill: "bg-red-500/10 text-red-300 ring-1 ring-red-500/20 hover:bg-red-500/20",
          to: "/dashboard/products",
        },
        kpis.missingCostsCount > 0 && {
          label: t("dashboard.signal.missingCost", { count: kpis.missingCostsCount, plural: kpis.missingCostsCount > 1 ? "s" : "" }),
          dot: "bg-orange-400",
          pill: "bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/20 hover:bg-orange-500/20",
          to: "/dashboard/products",
        },
        kpis.recentInsights.length > 0 && {
          label: t("dashboard.signal.activeInsight", { count: kpis.recentInsights.length, plural: kpis.recentInsights.length > 1 ? "s" : "" }),
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

      <div className="relative mx-auto max-w-6xl py-4">

        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {loadingMe ? "..." : t("dashboard.welcome", { name })}
            </h1>
            <p className="mt-1 text-sm text-white/40">{t("dashboard.subtitle")}</p>
          </div>

          {signals.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:mt-1">
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

        <div className="mt-6 border-t border-white/5" />

        {/* Demo banner */}
        {selectedBusinessId && !loading && (!kpis || kpis.productsTracked === 0) && (
          <div className="mt-6 rounded-2xl bg-accent/10 px-5 py-4 ring-1 ring-accent/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">{t("dashboard.demo.emptyTitle")}</div>
                <div className="mt-0.5 text-xs text-white/40">
                  {t("dashboard.demo.emptyText")}
                </div>
              </div>
              <button
                onClick={handleLoadDemo}
                disabled={loadingDemo}
                className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
              >
                {loadingDemo ? t("dashboard.demo.loading") : t("dashboard.demo.load")}
              </button>
            </div>
            {demoError && (
              <div className="mt-3 text-xs text-orange-400">
                {demoError.includes("produit") || demoError.includes("product")
                  ? t("dashboard.demo.shopifyRequired")
                  : demoError}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-500/10 p-4 text-center text-sm text-red-300 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        {!selectedBusinessId && !loadingBusiness && (
          <div className="mt-6 rounded-2xl bg-warning/10 p-4 text-center text-sm text-orange-300 ring-1 ring-warning/20">
            {t("dashboard.noBusiness")}
          </div>
        )}

        {selectedBusinessId && (
          <div className="mt-8 space-y-8">

            {/* ── Row 1 — Global metrics ── */}
            <div className="space-y-3">
              <div className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">{t("dashboard.section.overview")}</div>
              <div className="grid gap-4 md:grid-cols-4">

                <Card className="p-6">
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("dashboard.kpi.totalRevenue")}</div>
                  <div className="mt-3 text-3xl font-bold tabular-nums">
                    {loading ? "—" : fmt(kpis?.totalRevenue ?? 0)}
                  </div>
                  <div className="mt-2 text-xs text-white/40">
                    {t("dashboard.kpi.productsTracked", { count: kpis?.productsTracked ?? 0 })}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("dashboard.kpi.realProfit")}</div>
                  <div className={`mt-3 text-3xl font-bold tabular-nums ${kpis ? marginColor(kpis.totalProfit) : ""}`}>
                    {loading ? "—" : fmt(kpis?.totalProfit ?? 0)}
                  </div>
                  <div className="mt-2 text-xs text-white/40">{t("dashboard.kpi.afterCogs")}</div>
                </Card>

                <Card className="p-6">
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("dashboard.kpi.avgMargin")}</div>
                  <div className={`mt-3 text-3xl font-bold tabular-nums ${kpis ? marginColor(kpis.avgMarginPct) : ""}`}>
                    {loading ? "—" : `${kpis?.avgMarginPct ?? 0}%`}
                  </div>
                  <div className="mt-2 text-xs text-white/40">{t("dashboard.kpi.weightedByRevenue")}</div>
                </Card>

                <Card className={`p-6 ${kpis && kpis.missingCostsCount > 0 ? "ring-1 ring-orange-500/40" : ""}`}>
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("dashboard.kpi.missingCosts")}</div>
                  <div className={`mt-3 text-3xl font-bold tabular-nums ${kpis && kpis.missingCostsCount > 0 ? "text-orange-400" : "text-white/70"}`}>
                    {loading ? "—" : kpis?.missingCostsCount ?? 0}
                  </div>
                  {kpis && kpis.missingCostsCount > 0 ? (
                    <button
                      onClick={() => navigate("/dashboard/products")}
                      className="mt-2 text-xs text-orange-400/70 hover:text-orange-300 transition text-left"
                    >
                      {t("dashboard.kpi.fixInProducts")}
                    </button>
                  ) : (
                    <div className="mt-2 text-xs text-white/40">{t("dashboard.kpi.allCostsEntered")}</div>
                  )}
                </Card>

              </div>
            </div>

            {/* ── Row 2 — Risk signals ── */}
            <div className="space-y-3">
              <div className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">{t("dashboard.section.riskSignals")}</div>
              <div className="grid gap-4 md:grid-cols-4">

                <Card className={`p-6 ${kpis && kpis.negativeProfitCount > 0 ? "ring-1 ring-red-500/40 bg-red-500/[0.03]" : ""}`}>
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("dashboard.kpi.productsLosingMoney")}</div>
                  <div className={`mt-3 text-3xl font-bold tabular-nums ${kpis && kpis.negativeProfitCount > 0 ? "text-red-400" : "text-white/70"}`}>
                    {loading ? "—" : kpis?.negativeProfitCount ?? 0}
                  </div>
                  <div className="mt-2 text-xs text-white/40">{t("dashboard.kpi.negativeGrossProfit")}</div>
                </Card>

                <Card className={`p-6 ${kpis && kpis.lowMarginCount > 0 ? "ring-1 ring-orange-500/30" : ""}`}>
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("dashboard.kpi.lowMargin")}</div>
                  <div className={`mt-3 text-3xl font-bold tabular-nums ${kpis && kpis.lowMarginCount > 0 ? "text-orange-400" : "text-white/70"}`}>
                    {loading ? "—" : kpis?.lowMarginCount ?? 0}
                  </div>
                  <div className="mt-2 text-xs text-white/40">{t("dashboard.kpi.productsUnderMargin")}</div>
                </Card>

                <Card className="p-6">
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("dashboard.kpi.topProfitProduct")}</div>
                  {loading ? (
                    <div className="mt-3 text-2xl font-bold">—</div>
                  ) : kpis?.topProfitProduct ? (
                    <>
                      <div className="mt-3 text-sm font-semibold text-emerald-400 leading-tight truncate">
                        {kpis.topProfitProduct.title}
                      </div>
                      <div className="mt-1.5 text-xs text-white/40">
                        {fmt(kpis.topProfitProduct.profit)} · {t("dashboard.product.margin", { margin: kpis.topProfitProduct.marginPct })}
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 text-sm text-white/40">{t("common.noDataYet")}</div>
                  )}
                </Card>

                <Card className={`p-6 ${kpis && kpis.revenueAtRisk > 0 ? "ring-1 ring-red-500/30 bg-red-500/[0.03]" : ""}`}>
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("dashboard.kpi.revenueAtRisk")}</div>
                  <div className={`mt-3 text-3xl font-bold tabular-nums ${kpis && kpis.revenueAtRisk > 0 ? "text-red-400" : "text-white/70"}`}>
                    {loading ? "—" : fmt(kpis?.revenueAtRisk ?? 0)}
                  </div>
                  <div className="mt-2 text-xs text-white/40">
                    {t("dashboard.kpi.riskRevenueNote")}
                  </div>
                </Card>

              </div>
            </div>

            {/* ── Panels ── */}
            <div className="grid gap-6 md:grid-cols-2">

              {/* Top Products by Profit */}
              <Card className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="text-base font-semibold">{t("dashboard.panel.topProducts")}</div>
                  <button
                    onClick={() => navigate("/dashboard/products")}
                    className="text-xs text-white/40 hover:text-accent transition"
                  >
                    {t("dashboard.cta.viewAll")}
                  </button>
                </div>
                {loading ? (
                  <div className="flex h-48 items-center justify-center text-sm text-white/40">{t("common.loading")}</div>
                ) : kpis?.topProductsByProfit && kpis.topProductsByProfit.length > 0 ? (
                  <div className="space-y-2">
                    {kpis.topProductsByProfit.map((p) => (
                      <div key={p.productId} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3.5 hover:bg-white/[0.08] transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{p.title}</div>
                          <div className="mt-0.5 text-xs text-white/40">
                            {t("dashboard.product.soldRevenue", { sold: p.unitsSold, revenue: fmt(p.revenue) })}
                          </div>
                        </div>
                        <div className="ml-4 text-right shrink-0">
                          <div className={`text-sm font-bold tabular-nums ${marginColor(p.marginPct)}`}>
                            {fmt(p.grossProfit)}
                          </div>
                          <div className={`text-xs font-medium ${marginColor(p.marginPct)}`}>{p.marginPct}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-white/40">
                    {t("dashboard.empty.noProfitability")}
                  </div>
                )}
              </Card>

              {/* Highest Risk Products */}
              <Card className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="text-base font-semibold">{t("dashboard.panel.highestRisk")}</div>
                  <button
                    onClick={() => navigate("/dashboard/insights")}
                    className="text-xs text-white/40 hover:text-accent transition"
                  >
                    {t("dashboard.cta.seeInsights")}
                  </button>
                </div>
                {loading ? (
                  <div className="flex h-48 items-center justify-center text-sm text-white/40">{t("common.loading")}</div>
                ) : kpis?.highestRiskProducts && kpis.highestRiskProducts.length > 0 ? (
                  <div className="space-y-2">
                    {kpis.highestRiskProducts.map((p) => (
                      <div key={p.productId} className="flex items-center justify-between rounded-xl bg-red-500/5 px-4 py-3.5 ring-1 ring-red-500/10 hover:bg-red-500/[0.08] transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{p.title}</div>
                          <div className="mt-0.5 text-xs text-white/40">
                            {t("dashboard.product.revenue", { revenue: fmt(p.revenue) })}
                          </div>
                        </div>
                        <div className="ml-4 text-right shrink-0">
                          <div className={`text-sm font-bold tabular-nums ${p.marginPct < 0 ? "text-red-400" : "text-orange-400"}`}>
                            {p.marginPct}%
                          </div>
                          <div className={`text-[11px] font-medium uppercase tracking-wide ${p.riskReason === "negative_margin" ? "text-red-400/70" : "text-orange-400/70"}`}>
                            {p.riskReason === "negative_margin" ? t("dashboard.risk.losingMoney") : t("dashboard.risk.noCost")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-emerald-400/60">
                    {t("dashboard.empty.noRisk")}
                  </div>
                )}
              </Card>

              {/* Active Insights */}
              <Card className="p-6 md:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div className="text-base font-semibold">{t("dashboard.panel.activeInsights")}</div>
                  <button
                    onClick={() => navigate("/dashboard/insights")}
                    className="text-xs text-white/40 hover:text-accent transition"
                  >
                    {t("dashboard.cta.viewAll")}
                  </button>
                </div>
                {loading ? (
                  <div className="flex h-20 items-center justify-center text-sm text-white/40">{t("common.loading")}</div>
                ) : kpis?.recentInsights && kpis.recentInsights.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {kpis.recentInsights.map((insight, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-4 ring-1 ${SEVERITY_STYLES[insight.severity]}`}
                      >
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[insight.severity]}`} />
                          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
                            {severityLabel(insight.severity)}
                          </span>
                        </div>
                        <div className="text-sm font-semibold leading-snug">{insight.title}</div>
                        <div className="mt-1.5 text-xs opacity-50 line-clamp-2">{insight.message}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-20 items-center justify-center text-sm text-white/40">
                    {t("dashboard.empty.noInsights")}
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
