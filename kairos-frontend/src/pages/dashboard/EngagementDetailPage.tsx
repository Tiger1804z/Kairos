import { useParams, useNavigate } from "react-router-dom";
import { useEngagementDetail } from "../../hooks/useEngagementsDetails";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function EngagementDetailPage() {
    // useParams récupère le :id dans l'URL → "/dashboard/engagements/5" → id = "5"
    const { id } = useParams();
    const navigate = useNavigate();

    // 1 seul appel — le backend retourne déjà client + items + transactions dans { engagement }
    const { engagement, loading, error } = useEngagementDetail(id ? Number(id) : null);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-CA");

    const statusStyle = (status: string) => {
        if (status === "active") return "bg-blue-500/10 text-blue-300 ring-blue-500/20";
        if (status === "completed") return "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20";
        if (status === "cancelled") return "bg-red-500/10 text-red-300 ring-red-500/20";
        return "bg-white/5 text-white/50 ring-white/10"; // draft
    };

    const clientName = engagement?.client
        ? `${engagement.client.first_name ?? ""} ${engagement.client.last_name ?? ""}`.trim() || engagement.client.company_name || "—"
        : "—";

    if (loading) return <div className="px-6 py-12 text-white/40">Loading...</div>;
    if (error) return <div className="px-6 py-12 text-red-400">{error}</div>;
    if (!engagement) return null;

    return (
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
            {/* Bouton retour */}
            <button onClick={() => navigate(-1)} className="text-sm text-white/50 hover:text-white transition">
                ← Retour aux engagements
            </button>

            {/* Infos engagement */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-semibold">{engagement.title}</h1>
                    <Badge className={statusStyle(engagement.status)}>{engagement.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
                    <div><span className="text-white/40">Client</span><p>{clientName}</p></div>
                    <div><span className="text-white/40">Montant total</span><p>{engagement.total_amount ? formatCurrency(Number(engagement.total_amount)) : "—"}</p></div>
                    <div><span className="text-white/40">Début</span><p>{engagement.start_date ? formatDate(engagement.start_date) : "—"}</p></div>
                    <div><span className="text-white/40">Fin</span><p>{engagement.end_date ? formatDate(engagement.end_date) : "—"}</p></div>
                    {engagement.description && (
                        <div className="col-span-2"><span className="text-white/40">Description</span><p>{engagement.description}</p></div>
                    )}
                </div>
            </Card>

            {/* Items du contrat (produits/services) */}
            <div>
                <h2 className="text-lg font-medium mb-4">Items ({engagement.items.length})</h2>
                <Card>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left text-xs text-white/40">
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Qté</th>
                                <th className="px-6 py-4">Prix unitaire</th>
                                <th className="px-6 py-4">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {engagement.items.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">Aucun item</td></tr>
                            ) : (
                                engagement.items.map((item) => (
                                    <tr key={item.id_item} className="border-b border-white/5">
                                        <td className="px-6 py-4 font-medium">{item.description}</td>
                                        <td className="px-6 py-4 text-white/60">{item.quantity}</td>
                                        <td className="px-6 py-4 text-white/60">{formatCurrency(Number(item.unit_price))}</td>
                                        <td className="px-6 py-4 font-medium">{formatCurrency(Number(item.total_price))}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>

            {/* Transactions liées */}
            <div>
                <h2 className="text-lg font-medium mb-4">Transactions ({engagement.transactions.length})</h2>
                <Card>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left text-xs text-white/40">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Montant</th>
                                <th className="px-6 py-4">Catégorie</th>
                            </tr>
                        </thead>
                        <tbody>
                            {engagement.transactions.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">Aucune transaction</td></tr>
                            ) : (
                                engagement.transactions.map((t) => (
                                    <tr key={t.id_transaction} className="border-b border-white/5">
                                        <td className="px-6 py-4 text-white/70">{formatDate(t.transaction_date)}</td>
                                        <td className="px-6 py-4">
                                            <Badge className={t.transaction_type === "income"
                                                ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                                                : "bg-red-500/10 text-red-300 ring-red-500/20"}>
                                                {t.transaction_type}
                                            </Badge>
                                        </td>
                                        <td className={`px-6 py-4 font-medium ${t.transaction_type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                                            {formatCurrency(Number(t.amount))}
                                        </td>
                                        <td className="px-6 py-4 text-white/60">{t.category ?? "—"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
}
