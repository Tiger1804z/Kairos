import { Sparkles, Database, LineChart, Shield } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Ask in plain language",
    description:
      "No dashboards to configure. Ask questions like you would to a human — Kairos translates them into insights instantly.",
  },
  {
    icon: Database,
    title: "Your data, unified",
    description:
      "Clients, engagements, revenue, growth — all your business data lives in one intelligent system.",
  },
  {
    icon: LineChart,
    title: "Clarity over complexity",
    description:
      "Understand what matters without digging through charts. Kairos highlights what needs your attention.",
  },
  {
    icon: Shield,
    title: "Built for trust",
    description:
      "Enterprise-grade security, role-based access, and full control over your data.",
  },
];

export default function BuiltForClarity() {
  return (
    <section className="relative mx-auto mt-40 max-w-6xl px-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">
          Built for clarity.
        </h2>
        <p className="mt-4 text-sm text-white/60 md:text-base">
          Kairos removes friction between you and your business data.
        </p>
      </div>

      {/* Grid */}
      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="
            rounded-2xl bg-white/5 p-6
            ring-1 ring-white/10
            transition-all duration-300
            hover:bg-white/10 hover:-translate-y-1
            "
          >
            <f.icon
            className="h-5 w-5 text-accent"
            style={{ filter: "drop-shadow(0 0 6px rgba(96,165,250,0.25))" }}
            />
            <h3 className="mt-4 text-base font-medium">{f.title}</h3>
            <p className="mt-2 text-sm text-white/60">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
