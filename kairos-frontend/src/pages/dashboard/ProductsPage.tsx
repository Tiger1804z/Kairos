import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBusinessContext } from "../../business/BusinessContext";
import { getProducts, createCost, computeProfitability, importCostsCsv } from "../../services/productService";
import { Card } from "../../components/ui/Card";
import { useI18n } from "../../i18n/useI18n";


interface ProductCost {
    id: string;
    cost_per_unit: string;
    effective_from: string;

}

interface Product {
  id: string;
  title: string;
  vendor: string | null;
  status: string;
  costs: ProductCost[];
}

export default function ProductsPage() {
    const { t } = useI18n();
    const {selectedBusinessId} = useBusinessContext();
    const [searchParams] = useSearchParams();
    const highlightParam = searchParams.get("highlight");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [marginMap, setMarginMap] = useState<Record<string, number>>({});
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    // Modal state
    const [modalProduct, setModalProduct] = useState<Product | null>(null);
    const [costInput, setCostInput] = useState("");
    const [saving, setSaving] = useState(false);

    // CSV import state
    const [csvImporting, setCsvImporting] = useState(false);
    const [csvResult, setCsvResult] = useState<{ imported: number; errors: { row: number; reason: string }[] } | null>(null);

    async function fetchProducts(){
        if (!selectedBusinessId) return;
        try {
            const data = await getProducts(selectedBusinessId);
            setProducts(data);
        } catch {
            setError(t("products.error.load"));
            setLoading(false);
            return;
        }
        try {
            const snapshots = await computeProfitability(selectedBusinessId);
            const map: Record<string, number> = {};
            for (const s of snapshots) {
                map[s.product_id] = s.gross_margin_pct;
            }
            setMarginMap(map);
        } catch {
            // Marges non disponibles (service Python injoignable) — produits toujours affichés
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProducts();
    }, [selectedBusinessId]);

    useEffect(() => {
        if (!highlightParam || loading || products.length === 0) return;
        const frame = requestAnimationFrame(() => {
            const el = document.querySelector(`[data-product-id="${highlightParam}"]`) as HTMLElement | null;
            if (!el) return;
            setHighlightedId(highlightParam);
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => setHighlightedId(null), 4000);
        });
        return () => cancelAnimationFrame(frame);
    }, [highlightParam, products, loading]);

    async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!selectedBusinessId) {
            setError(t("products.error.csv"));
            e.target.value = "";
            return;
        }
        setCsvImporting(true);
        setCsvResult(null);
        try {
            const result = await importCostsCsv(selectedBusinessId, file);
            setCsvResult(result);
            await fetchProducts();
        } catch {
            setError(t("products.error.csv"));
        } finally {
            setCsvImporting(false);
            e.target.value = "";
        }
    }

    async function handleSaveCost(){
      if (!modalProduct || !costInput) return;
      setSaving(true);
      try{
        await createCost({
            product_id: modalProduct.id,
            cost_per_unit: parseFloat(costInput),
        });
        setModalProduct(null);
        setCostInput("");
        await fetchProducts(); // refresh
      }catch{
        setError(t("products.error.saveCost"));
      }finally{
        setSaving(false);
      }
    }

    return (
    <div className="mx-auto w-full max-w-6xl min-w-0 overflow-x-hidden py-4 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("products.title")}</h1>
        <label className={`cursor-pointer rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition ${csvImporting ? "opacity-40 pointer-events-none" : ""}`}>
          {csvImporting ? t("products.importing") : t("products.importCsv")}
          <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
        </label>
      </div>

      {csvResult && (
        <div className="mb-6 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
          {t("products.importedCosts", { count: csvResult.imported })}
          {csvResult.errors.length > 0 && (
            <ul className="mt-2 text-orange-400">
              {csvResult.errors.map((e) => (
                <li key={e.row}>{t("products.importRowError", { row: e.row, reason: e.reason })}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
          {error}
        </div>
      )}

      <Card className="min-w-0 max-w-full overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-white/40">
                <th className="px-6 py-4">{t("products.table.product")}</th>
                <th className="px-6 py-4">{t("products.table.vendor")}</th>
                <th className="px-6 py-4">{t("products.table.status")}</th>
                <th className="px-6 py-4">{t("products.table.unitCost")}</th>
                <th className="px-6 py-4">{t("products.table.margin")}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">{t("common.loading")}</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">{t("products.empty")}</td>
                </tr>
              ) : (
                products.map((p) => {
                  const latestCost = p.costs[0];
                  const margin = marginMap[p.id];
                  const isNegative = margin !== undefined && margin < 0;
                  const isHighlighted = highlightedId === p.id;
                  return (
                    <tr
                      key={p.id}
                      data-product-id={p.id}
                      className={`border-b border-white/5 transition-colors duration-300 ${
                        isHighlighted
                          ? "bg-violet-500/15 ring-2 ring-inset ring-violet-400/60"
                          : isNegative
                            ? "bg-red-500/5 hover:bg-red-500/[0.08]"
                            : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold">
                        <div className="flex items-center gap-2">
                          {p.title}
                          {!latestCost && (
                            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-400 ring-1 ring-orange-500/20">
                              {t("products.badge.missingCost")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/40">{p.vendor ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40 ring-1 ring-white/10">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {latestCost
                          ? <span className="text-emerald-300">${parseFloat(latestCost.cost_per_unit).toFixed(2)}</span>
                          : <span className="text-orange-400/80">{t("products.cost.undefined")}</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        {margin !== undefined
                          ? <span className={margin >= 15 ? "text-emerald-300" : margin >= 0 ? "text-orange-400" : "text-red-400 font-semibold"}>
                              {margin.toFixed(1)}%
                            </span>
                          : <span className="text-white/40">—</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setModalProduct(p); setCostInput(latestCost?.cost_per_unit ?? ""); }}
                          className={latestCost
                            ? "rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition"
                            : "rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400 ring-1 ring-orange-500/20 hover:bg-orange-500/15 transition"
                          }
                        >
                          {latestCost ? t("products.action.edit") : t("products.action.enterCost")}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {modalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-card p-6 ring-1 ring-white/10">
            <h2 className="mb-1 text-lg font-semibold">{modalProduct.title}</h2>
            <p className="mb-6 text-sm text-white/50">{t("products.modal.subtitle")}</p>

            <label className="mb-1 block text-xs text-white/40">{t("products.modal.unitCost")}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
              placeholder={t("products.modal.placeholder")}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalProduct(null)}
                className="rounded-xl px-4 py-2 text-sm text-white/50 hover:text-white transition"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSaveCost}
                disabled={saving || !costInput}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition disabled:opacity-40"
              >
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
