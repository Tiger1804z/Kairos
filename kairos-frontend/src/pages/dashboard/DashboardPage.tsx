import { useOutletContext } from "react-router-dom";
import AskKairosInput from "../../components/kairos/AskKairosInput";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge"; 
import { useDashboard } from "../../hooks/useDashboard";
import { useBusinessContext } from "../../business/BusinessContext";
import { useAskKairos } from "../../hooks/useAskKairos";


type MeUser = {
  id_user: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "owner" | "admin" | "employee";
};

export default function DashboardPage() {
  const { me, loadingMe } = useOutletContext<{
    me: MeUser | null;
    loadingMe: boolean;
  }>();
  // utiliser le business context pour recuperer le businessId selectionne
  const { selectedBusinessId, selectedBusiness, loading: loadingBusiness } = useBusinessContext();
  
  const { data,loading: dashboardLoading, error } = useDashboard(selectedBusinessId);
  const {ask, response, loading: askLoading, error: askError,reset} = useAskKairos();
  const name =
    me ? `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() || me.email : "—";
  
  const loading = loadingBusiness ||dashboardLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  }
  return (
    <div className="relative">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-260px] h-[560px] w-[880px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">
            {loadingMe ? "Welcome back..." : `Welcome back, ${name}.`}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Everything looks great today. What would you like to explore?
          </p>
        </div>

        <div className="mt-8">
          <AskKairosInput
            onAsk={(q) => ask(q)}
            className="mx-auto max-w-3xl"
          />

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {["Last month revenue", "Top 5 clients by growth", "Engagement efficiency", "Projected churn"].map((t) => (
              <button
                key={t}
                onClick={() => ask(t)}
                className="inline-block"
              >
                <Badge className="cursor-pointer hover:bg-white/10 transition">
                  {t}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* 🤖 Réponse de l'IA */}
        {(response || askLoading || askError) && (
          <Card className="mx-auto mt-6 max-w-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold">Kairos AI Assistant</div>
              {response && (
                <button
                  onClick={reset}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {askLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-white/60">
                  Analyzing your data...
                </div>
              </div>
            )}

            {askError && (
              <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
                {askError}
              </div>
            )}

            {response && !askLoading && (
              <div className="space-y-4">
                {/* Réponse de l'IA */}
                <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-xs text-white/60 mb-2">Answer</div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {response.aiText}
                  </div>
                </div>

                {/* Métadonnées */}
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span>Business: {response.meta.business_name}</span>
                  <span>•</span>
                  <span>Period: {response.meta.period}</span>
                  <span>•</span>
                  <span>Query time: {response.meta.execution_time_ms}ms</span>
                </div>

                {/* SQL généré (optionnel, pour debug) */}
                {response.sql && (
                  <details className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                    <summary className="cursor-pointer text-xs text-white/60">
                      Show generated SQL
                    </summary>
                    <pre className="mt-2 overflow-x-auto text-xs text-white/80">
                      {response.sql}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </Card>
        )}
        

        {/* Erreurs */}
        {error && (
          <div className="mt-6 rounded-2xl bg-red-500/10 p-4 text-center text-sm text-red-300 ring-1 ring-red-500/20">
            Error: {error}
          </div>
        )}

        {/* Pas de business sélectionné */}
        {!selectedBusinessId && !loadingBusiness && (
          <div className="mt-6 rounded-2xl bg-yellow-500/10 p-4 text-center text-sm text-yellow-300 ring-1 ring-yellow-500/20">
            Please select a business to view your dashboard
          </div>
        )}
         {/* 📊 Métriques */}
        {selectedBusinessId && (
          <>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <div className="text-xs text-white/60">Total Clients</div>
                <div className="mt-2 text-2xl font-semibold">
                  {loading ? "..." : data.metrics?.totalClients ?? 0}
                </div>
                <div className="mt-2 text-xs text-blue-300">Active clients</div>
              </Card>

              <Card className="p-6">
                <div className="text-xs text-white/60">Active Engagements</div>
                <div className="mt-2 text-2xl font-semibold">
                  {loading ? "..." : data.metrics?.activeEngagements ?? 0}
                </div>
                <div className="mt-2 text-xs text-emerald-300">In progress</div>
              </Card>

              <Card className="p-6">
                <div className="text-xs text-white/60">Monthly Revenue</div>
                <div className="mt-2 text-2xl font-semibold">
                  {loading
                    ? "..."
                    : formatCurrency(data.metrics?.monthlyRevenue ?? 0)}
                </div>
                <div className="mt-2 text-xs text-white/60">
                  {loading
                    ? "..."
                    : data.revenueGrowth
                    ? `${data.revenueGrowth.growth > 0 ? "+" : ""}${data.revenueGrowth.growth}%`
                    : "—"}
                </div>
              </Card>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* 📈 Revenue Growth */}
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold">Revenue Growth</div>
                  <div className="text-xs text-white/60">Last vs This Month</div>
                </div>

                {loading ? (
                  <div className="flex h-32 items-center justify-center text-sm text-white/50">
                    Loading...
                  </div>
                ) : data.revenueGrowth ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs text-white/60">Last Month</div>
                      <div className="mt-1 text-xl font-semibold">
                        {formatCurrency(data.revenueGrowth.lastMonth)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs text-white/60">This Month</div>
                      <div className="mt-1 text-xl font-semibold">
                        {formatCurrency(data.revenueGrowth.thisMonth)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4 text-center ring-1 ring-white/10">
                      <div className="text-xs text-white/60">Growth</div>
                      <div
                        className={`mt-1 text-2xl font-bold ${
                          data.revenueGrowth.growth > 0
                            ? "text-emerald-300"
                            : data.revenueGrowth.growth < 0
                            ? "text-red-300"
                            : "text-white/60"
                        }`}
                      >
                        {data.revenueGrowth.growth > 0 ? "+" : ""}
                        {data.revenueGrowth.growth}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-sm text-white/50">
                    No data available
                  </div>
                )}
              </Card>

              {/* 👥 Top Clients */}
              <Card className="p-6">
                <div className="mb-4 text-sm font-semibold">Top Clients</div>

                {loading ? (
                  <div className="flex h-64 items-center justify-center text-sm text-white/50">
                    Loading...
                  </div>
                ) : data.topClients && data.topClients.length > 0 ? (
                  <div className="space-y-3">
                    {data.topClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                      >
                        <div>
                          <div className="text-sm font-medium">{client.name}</div>
                          <div className="text-xs text-white/50">ID: {client.id}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {formatCurrency(client.revenue)}
                          </div>
                          <div className="text-[11px] text-emerald-300">
                            {client.revenue > 0 ? "ACTIVE" : "INACTIVE"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-white/50">
                    No clients yet
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>


          
        
  );
}
