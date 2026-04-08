import { useEffect, useState } from "react";
import { useBusinessContext } from "../../business/BusinessContext";
import { getProducts, createCost, computeProfitability, importCostsCsv } from "../../services/productService";
import { Card } from "../../components/ui/Card";


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
    const {selectedBusinessId} = useBusinessContext();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [marginMap, setMarginMap] = useState<Record<string, number>>({});

    // Modal state
    const [modalProduct, setModalProduct] = useState<Product | null>(null);
    const [costInput, setCostInput] = useState("");
    const [saving, setSaving] = useState(false);

    // CSV import state
    const [csvImporting, setCsvImporting] = useState(false);
    const [csvResult, setCsvResult] = useState<{ imported: number; errors: { row: number; reason: string }[] } | null>(null);

    async function fetchProducts(){
        if (!selectedBusinessId) return;
        try{
            const data = await getProducts(selectedBusinessId);
            setProducts(data);

            const snapshots = await computeProfitability(selectedBusinessId);
            const map: Record<string, number> = {};
            for (const s of snapshots) {
                map[s.product_id] = s.gross_margin_pct;
            }
            setMarginMap(map);
        }catch{
            setError("Impossible de charger les produits");
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProducts();
    }, [selectedBusinessId]);

    async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvImporting(true);
        setCsvResult(null);
        try {
            const result = await importCostsCsv(file);
            setCsvResult(result);
            await fetchProducts();
        } catch {
            setError("Erreur lors de l'import CSV");
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
        setError("Erreur lors de la sauvegarde du coût");
      }finally{
        setSaving(false);
      }
    }

    return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <label className={`cursor-pointer rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition ${csvImporting ? "opacity-40 pointer-events-none" : ""}`}>
          {csvImporting ? "Import en cours..." : "Importer CSV"}
          <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
        </label>
      </div>

      {csvResult && (
        <div className="mb-6 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
          {csvResult.imported} coût(s) importé(s).
          {csvResult.errors.length > 0 && (
            <ul className="mt-2 text-orange-400">
              {csvResult.errors.map((e) => (
                <li key={e.row}>Ligne {e.row} : {e.reason}</li>
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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-white/40">
                <th className="px-6 py-4">Produit</th>
                <th className="px-6 py-4">Vendeur</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Coût unitaire</th>
                <th className="px-6 py-4">Marge brute</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">Loading...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">Aucun produit — lance une sync Shopify dans Settings</td>
                </tr>
              ) : (
                products.map((p) => {
                  const latestCost = p.costs[0];
                  return (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="px-6 py-4 font-medium">{p.title}</td>
                      <td className="px-6 py-4 text-white/60">{p.vendor ?? "—"}</td>
                      <td className="px-6 py-4 text-white/60">{p.status}</td>
                      <td className="px-6 py-4">
                        {latestCost
                          ? <span className="text-emerald-300">${parseFloat(latestCost.cost_per_unit).toFixed(2)}</span>
                          : <span className="text-orange-400/80">Non défini</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        {marginMap[p.id] !== undefined
                          ? <span className={marginMap[p.id] >= 15 ? "text-emerald-300" : marginMap[p.id] >= 0 ? "text-orange-400" : "text-red-400"}>
                              {marginMap[p.id].toFixed(1)}%
                            </span>
                          : <span className="text-white/30">—</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setModalProduct(p); setCostInput(latestCost?.cost_per_unit ?? ""); }}
                          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10 transition"
                        >
                          {latestCost ? "Modifier" : "Entrer coût"}
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
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a2e] p-6 ring-1 ring-white/10">
            <h2 className="mb-1 text-lg font-semibold">{modalProduct.title}</h2>
            <p className="mb-6 text-sm text-white/50">Saisir le coût unitaire (fournisseur)</p>

            <label className="mb-1 block text-xs text-white/40">Coût par unité ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
              placeholder="ex: 12.50"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalProduct(null)}
                className="rounded-xl px-4 py-2 text-sm text-white/50 hover:text-white transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCost}
                disabled={saving || !costInput}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition disabled:opacity-40"
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}