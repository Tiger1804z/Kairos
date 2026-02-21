import { useState } from "react";
import { useBusinessContext } from "../../business/BusinessContext";
import { useTransactions } from "../../hooks/useTransactions";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

// Les 3 valeurs possibles pour le filtre actif
type Filter = "all" | "income" | "expense";

export default function TransactionsPage() {
  // On récupère le business sélectionné depuis le contexte global
  // (la page ne décide pas quel business — c'est le contexte qui le sait)
  const { selectedBusinessId } = useBusinessContext();

  // Le hook fait le fetch et calcule le résumé (totalIncome, totalExpense, net)
  // On lui passe selectedBusinessId → GET /transactions?business_id=...
  const { transactions, summary, loading, error } = useTransactions(selectedBusinessId);

  // État local du filtre — "all" par défaut
  // useState<Filter> = le state peut seulement contenir "all", "income" ou "expense"
  const [filter, setFilter] = useState<Filter>("all");

  // Formate un nombre en devise canadienne → "$1,234.56 CAD"
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);

  // Formate une date ISO en date lisible → "2025-01-15"
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-CA");

  // Tableau dérivé : on ne modifie pas transactions, on filtre juste pour l'affichage
  // Si filter === "all" → on garde tout (true = garder)
  // Sinon → on garde seulement les transactions dont le type correspond au filtre
  const filtered = transactions.filter((t) =>
    filter === "all" ? true : t.transaction_type === filter
  );

  return (
    // Conteneur principal — tout est à l'intérieur de ce div
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-8">Transactions</h1>

      {/* Cards résumé — grid 3 colonnes sur écran moyen+ */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="p-6">
          <div className="text-xs text-white/60">Total Income</div>
          {/* Ternaire : si loading → "...", sinon → montant formaté */}
          <div className="mt-2 text-2xl font-semibold text-emerald-400">
            {loading ? "..." : formatCurrency(summary.totalIncome)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-xs text-white/60">Total Expenses</div>
          <div className="mt-2 text-2xl font-semibold text-red-400">
            {loading ? "..." : formatCurrency(summary.totalExpense)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-xs text-white/60">Net</div>
          {/* Couleur dynamique : vert si positif, rouge si négatif */}
          <div className={`mt-2 text-2xl font-semibold ${summary.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {loading ? "..." : formatCurrency(summary.net)}
          </div>
        </Card>
      </div>

      {/* Filtres — on boucle sur les 3 valeurs possibles du type Filter */}
      <div className="flex gap-2 mb-6">
        {(["all", "income", "expense"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)} // met à jour le filtre actif au clic
            // Template literal avec ternaire :
            // si ce bouton est le filtre actif → fond blanc + ring
            // sinon → texte semi-transparent
            className={`px-4 py-1.5 rounded-full text-sm capitalize transition
              ${filter === f
                ? "bg-white/15 text-white ring-1 ring-white/20"
                : "text-white/50 hover:text-white"
              }`}
          >
            {f === "all" ? "All" : f === "income" ? "Income" : "Expenses"}
          </button>
        ))}
      </div>

      {/* Message d'erreur — s'affiche seulement si error est non-null */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
          {error}
        </div>
      )}

      {/* Table des transactions */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-white/40">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody>
              {/* 3 cas possibles : chargement / vide / données */}
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">No transactions found</td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id_transaction} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white/70">{formatDate(t.transaction_date)}</td>
                    <td className="px-6 py-4">
                      {/* Badge coloré selon le type — vert pour income, rouge pour expense */}
                      <Badge className={t.transaction_type === "income"
                        ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                        : "bg-red-500/10 text-red-300 ring-red-500/20"}>
                        {t.transaction_type}
                      </Badge>
                    </td>
                    <td className={`px-6 py-4 font-medium ${t.transaction_type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(Number(t.amount))}
                    </td>
                    {/* ?? "—" : si category est null ou undefined, affiche "—" */}
                    <td className="px-6 py-4 text-white/60">{t.category ?? "—"}</td>
                    <td className="px-6 py-4 text-white/60">{t.description ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
