import { useOutletContext } from "react-router-dom";
import AskKairosInput from "../../components/kairos/AskKairosInput";
import { Card } from "../../components/ui/Card";
// import { Badge } from "../../components/ui/Badge"; // ignore pour l’instant

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

  const name =
    me ? `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() || me.email : "—";

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
            onAsk={(q) => console.log("Ask:", q)}
            className="mx-auto max-w-3xl"
          />

          {/* Badges (plus tard)
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {["Last month revenue", "Top 5 clients by growth", "Engagement efficiency", "Projected churn"].map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
          */}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="text-xs text-white/60">Total Revenue</div>
            <div className="mt-2 text-2xl font-semibold">$428,500</div>
            <div className="mt-2 text-xs text-emerald-300">+12.5%</div>
          </Card>

          <Card className="p-6">
            <div className="text-xs text-white/60">Active Engagements</div>
            <div className="mt-2 text-2xl font-semibold">24</div>
            <div className="mt-2 text-xs text-emerald-300">+3</div>
          </Card>

          <Card className="p-6">
            <div className="text-xs text-white/60">Client Retention</div>
            <div className="mt-2 text-2xl font-semibold">98.2%</div>
            <div className="mt-2 text-xs text-emerald-300">+0.4%</div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold">Revenue Growth</div>
              <div className="text-xs text-white/60">Last 6 months</div>
            </div>
            <div className="h-64 rounded-2xl bg-white/5 ring-1 ring-white/10" />
          </Card>

          <Card className="p-6">
            <div className="mb-4 text-sm font-semibold">Top Clients</div>

            <div className="space-y-3">
              {[
                ["Acme Corp", "$45,000", "ACTIVE"],
                ["Global Industries", "$12,000", "PENDING"],
                ["Stark Enterprises", "$89,000", "ACTIVE"],
                ["Wayne Enterprises", "$0", "INACTIVE"],
              ].map(([clientName, amount, status]) => (
                <div
                  key={clientName}
                  className="flex items-center justify-between rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                >
                  <div>
                    <div className="text-sm font-medium">{clientName}</div>
                    <div className="text-xs text-white/50">—</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{amount}</div>
                    <div className="text-[11px] text-white/60">{status}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full rounded-2xl bg-white/5 py-3 text-sm text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white">
              View all clients
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
