import { useParams, useNavigate } from "react-router-dom";
import { useBusinessContext } from "../../business/BusinessContext";
import { useClientDetail } from "../../hooks/useClientDetail";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function ClientDetailPage() {
    // useParams pour récupérer l'id du client depuis l'url
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedBusinessId } = useBusinessContext();

    // convertir id en number car useParams retourne une string
    const { client, loading, error , transactions, engagements } = useClientDetail(
        id? Number(id) : null,
        selectedBusinessId
    );

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);

    if (loading) return <div className="px-6 py-12 text-white/40">Loading...</div>;
    if (error) return <div className="px-6 py-12 text-red-400">{error}</div>;
    if (!client) return null; 
    
    const displayName = client.first_name || client.last_name
     ? `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim()
     : client.company_name ?? "—";

     
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-CA");


    return (
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
        {/* Bouton retour */}
        <button onClick={() => navigate(-1)} className="text-sm text-white/50 hover:text-white transition">
            ← Retour aux clients
        </button>

        {/* Infos client */}
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <Badge className={client.is_active
                ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                : "bg-white/5 text-white/40 ring-white/10"}>
                {client.is_active ? "Actif" : "Inactif"}
            </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
            <div><span className="text-white/40">Email</span><p>{client.email ?? "—"}</p></div>
            <div><span className="text-white/40">Téléphone</span><p>{client.phone ?? "—"}</p></div>
            <div><span className="text-white/40">Ville</span><p>{client.city ?? "—"}</p></div>
            <div><span className="text-white/40">Pays</span><p>{client.country ?? "—"}</p></div>
            </div>
        </Card>

        {/* Transactions du client */}
        <div>
            <h2 className="text-lg font-medium mb-4">Transactions ({transactions.length})</h2>
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
                {transactions.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">Aucune transaction</td></tr>
                ) : (
                    transactions.map((t) => (
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

        {/* Engagements du client */}
        <div>
            <h2 className="text-lg font-medium mb-4">Engagements ({engagements.length})</h2>
            <Card>
            <table className="w-full text-sm">
                <thead>
                <tr className="border-b border-white/5 text-left text-xs text-white/40">
                    <th className="px-6 py-4">Titre</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Montant</th>
                    <th className="px-6 py-4">Début</th>
                </tr>
                </thead>
                <tbody>
                {engagements.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">Aucun engagement</td></tr>
                ) : (
                    engagements.map((e) => (
                    <tr key={e.id_engagement} className="border-b border-white/5">
                        <td className="px-6 py-4 font-medium">{e.title}</td>
                        <td className="px-6 py-4">
                        <Badge className={
                            e.status === "active" ? "bg-blue-500/10 text-blue-300 ring-blue-500/20" :
                            e.status === "completed" ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" :
                            e.status === "cancelled" ? "bg-red-500/10 text-red-300 ring-red-500/20" :
                            "bg-white/5 text-white/50 ring-white/10"
                        }>{e.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-white/60">
                        {e.total_amount ? formatCurrency(Number(e.total_amount)) : "—"}
                        </td>
                        <td className="px-6 py-4 text-white/60">
                        {e.start_date ? formatDate(e.start_date) : "—"}
                        </td>
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