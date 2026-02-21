import { useNavigate } from "react-router-dom";
import { useBusinessContext } from "../../business/BusinessContext";
import { useClients } from "../../hooks/useClients";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function ClientPage() {
    const navigate = useNavigate();
    const { selectedBusinessId } = useBusinessContext();
    const { clients, loading, error } = useClients(selectedBusinessId);

    // affiche le nom complet ou le nom de compagnie si pas de prenom ou nom
    const displayName = (c:{first_name: string | null, last_name: string | null, company_name: string | null}) => {
        if (c.first_name && c.last_name) return `${c.first_name ?? ""} ${c.last_name ?? ""}`;
        return c.company_name ?? "-";
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-CA"); // format "2025-01-15"

    return (
         <div className="mx-auto max-w-6xl px-6 py-12">
            <h1 className="text-2xl font-semibold mb-8">Clients</h1>

            {/* Card résumé — nombre total de clients */}
            <div className="mb-8">
                <Card className="p-6 inline-block">
                <div className="text-xs text-white/60">Total Clients</div>
                <div className="mt-2 text-2xl font-semibold">{loading ? "..." : clients.length}</div>
                </Card>
            </div>

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
                        <th className="px-6 py-4">Nom</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Ville</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Ajouté le</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-white/40">Loading...</td>
                        </tr>
                    ) : clients.length === 0 ? (
                        <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-white/40">Aucun client trouvé</td>
                        </tr>
                    ) : (
                        clients.map((c) => (
                        // cursor-pointer + onClick → la ligne entière est cliquable
                        <tr
                            key={c.id_client}
                            onClick={() => navigate(`/dashboard/clients/${c.id_client}`)}
                            className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                        >
                            <td className="px-6 py-4 font-medium">{displayName(c)}</td>
                            <td className="px-6 py-4 text-white/60">{c.email ?? "—"}</td>
                            <td className="px-6 py-4 text-white/60">{c.city ?? "—"}</td>
                            <td className="px-6 py-4">
                            <Badge className={c.is_active
                                ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                                : "bg-white/5 text-white/40 ring-white/10"}>
                                {c.is_active ? "Actif" : "Inactif"}
                            </Badge>
                            </td>
                            <td className="px-6 py-4 text-white/60">{formatDate(c.created_at)}</td>
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