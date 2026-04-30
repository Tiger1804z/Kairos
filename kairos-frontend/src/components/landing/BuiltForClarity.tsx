import { TrendingDown, AlertTriangle, Search, MessageSquare } from "lucide-react";

const FEATURES = [
  {
    icon: TrendingDown,
    title: "See real profit by product",
    description:
      "Revenue alone is misleading. Kairos calculates what each product actually makes you after costs — so you know where to focus.",
  },
  {
    icon: AlertTriangle,
    title: "Catch margin issues before they spread",
    description:
      "Spot negative margins, low-margin products, and risky items in seconds — automatically detected, no manual digging.",
  },
  {
    icon: Search,
    title: "Detect missing cost data",
    description:
      "Know when your numbers are incomplete before they lead to bad decisions. Kairos flags the gaps so you can fix them.",
  },
  {
    icon: MessageSquare,
    title: "Ask Kairos what to fix first",
    description:
      "Use plain language to get clear, action-oriented answers from your store data. No dashboards to configure — just ask.",
  },
];

export default function BuiltForClarity() {
  return (
    <section className="relative mx-auto mt-32 max-w-6xl px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Built for real decisions.
        </h2>
        <p className="mt-4 text-sm text-white/50 md:text-base">
          Not just revenue. Real profit, real risks, real answers.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.08]"
          >
            <f.icon className="h-5 w-5 text-accent" />
            <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-white/60">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
