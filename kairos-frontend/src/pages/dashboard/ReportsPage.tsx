import { useBusinessContext } from "../../business/BusinessContext";
import { useReports } from "../../hooks/useReports";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function ReportsPage() {
  const { selectedBusinessId } = useBusinessContext();
  const { logs, reports, loading, error } = useReports(selectedBusinessId);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-CA");

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
      <h1 className="text-2xl font-semibold">Reports</h1>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">{error}</div>
      )}

      {/* Section 1 — Historique questions IA */}
      <div>
        <h2 className="text-lg font-medium mb-4">Questions IA ({logs.length})</h2>
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-white/40">
                <th className="px-6 py-4">Question</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-white/40">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-white/40">Aucune question posée</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id_query} className="border-b border-white/5">
                    <td className="px-6 py-4 max-w-md truncate">{log.natural_query}</td>
                    <td className="px-6 py-4">
                      <Badge className={log.status === "success"
                        ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                        : "bg-red-500/10 text-red-300 ring-red-500/20"}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-white/60">{formatDate(log.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Section 2 — Rapports générés par l'IA (analyse de docs + réponses riches) */}
      <div>
        <h2 className="text-lg font-medium mb-4">Rapports générés ({reports.length})</h2>
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-white/40">
                <th className="px-6 py-4">Titre</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-white/40">Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-white/40">Aucun rapport généré</td></tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id_report} className="border-b border-white/5">
                    <td className="px-6 py-4 font-medium">{report.title}</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-white/5 text-white/50 ring-white/10">{report.report_type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-white/60">{formatDate(report.created_at)}</td>
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
