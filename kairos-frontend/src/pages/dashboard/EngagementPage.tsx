import { useNavigate } from "react-router-dom";
import { useBusinessContext } from "../../business/BusinessContext";
import { useEngagements } from "../../hooks/useEngagements";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function EngagementPage() {
  const navigate = useNavigate();
  const { selectedBusinessId } = useBusinessContext();
  const { engagements, loading, error } = useEngagements(selectedBusinessId);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-CA");

  // Affiche le nom du client lié à l'engagement
  const clientName = (client: { first_name: string | null; last_name: string | null; company_name: string | null } | null) => {
    if (!client) return "—";
    if (client.first_name || client.last_name) return `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim();
    return client.company_name ?? "—";
  };

  const statusStyle = (status: string) => {
    if (status === "active") return "bg-blue-500/10 text-blue-300 ring-blue-500/20";
    if (status === "completed") return "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20";
    if (status === "cancelled") return "bg-red-500/10 text-red-300 ring-red-500/20";
    return "bg-white/5 text-white/50 ring-white/10"; // draft
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-8">Engagements</h1>

      <div className="mb-8">
        <Card className="p-6 inline-block">
          <div className="text-xs text-white/60">Total Engagements</div>
          <div className="mt-2 text-2xl font-semibold">{loading ? "..." : engagements.length}</div>
        </Card>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">{error}</div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-white/40">
                <th className="px-6 py-4">Titre</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Début</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-white/40">Loading...</td></tr>
              ) : engagements.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-white/40">Aucun engagement trouvé</td></tr>
              ) : (
                engagements.map((e) => (
                  <tr
                    key={e.id_engagement}
                    onClick={() => navigate(`/dashboard/engagements/${e.id_engagement}`)}
                    className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium">{e.title}</td>
                    <td className="px-6 py-4 text-white/60">{clientName(e.client)}</td>
                    <td className="px-6 py-4">
                      <Badge className={statusStyle(e.status)}>{e.status}</Badge>
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
        </div>
      </Card>
    </div>
  );
}
