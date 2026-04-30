import { LayoutDashboard, Lightbulb, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import BuiltForClarity from "../../components/landing/BuiltForClarity";
import DashboardPreview from "../../components/landing/DashboardPreview";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";

const PRODUCT_SECTIONS = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    tagline: "See the full picture.",
    items: [
      "Revenue, profit, margin, and order count at a glance",
      "Top performing products by real profit",
      "Highest-risk products flagged automatically",
      "Active insight alerts surfaced in the main view",
    ],
  },
  {
    icon: Lightbulb,
    title: "Insights",
    tagline: "Catch what matters before it costs you.",
    items: [
      "6 insight types detected and scored automatically",
      "Critical / Warning / Info severity classification",
      "One-click navigation from insight to the product",
      "Recalculate on demand when costs change",
    ],
  },
  {
    icon: MessageSquare,
    title: "AI Chat",
    tagline: "Ask anything about your store.",
    items: [
      "Business-aware context: products, margins, active signals",
      "Plain-language answers to complex profit questions",
      "Persistent conversation history across sessions",
      "Action-oriented — not just data, but what to do next",
    ],
  },
];

const VALUE_STRIP = [
  "Real profit visibility",
  "Margin risk detection",
  "Missing cost alerts",
  "AI answers in plain language",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar />

      <main className="relative">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        </div>

        {/* Hero */}
        <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-0 pt-24 text-center">
          <span className="rounded-full bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent/80 ring-1 ring-accent/20">
            Private beta — Shopify profit intelligence
          </span>

          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
            Your Shopify
            <span className="block text-white/40">profit copilot.</span>
          </h1>

          <p className="mt-6 max-w-xl text-sm text-white/60 md:text-base">
            See your real profit by product, catch negative margins and missing
            costs, and ask Kairos what to fix first.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth?mode=signup"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              Join the private beta →
            </Link>
            <Link
              to="/auth?mode=login"
              className="rounded-full bg-white/5 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
            >
              Explore the dashboard
            </Link>
          </div>
        </section>

        {/* Hero screenshot */}
        <DashboardPreview />

        {/* Quick value strip */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {VALUE_STRIP.map((item) => (
              <div
                key={item}
                className="rounded-xl bg-white/[0.03] px-4 py-3 text-center text-xs font-medium text-white/50 ring-1 ring-white/10"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Benefit cards */}
        <BuiltForClarity />

        {/* Product sections */}
        <section className="mx-auto mt-32 max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Three views. One clear picture.
            </h2>
            <p className="mt-4 text-sm text-white/50 md:text-base">
              Everything you need to understand where your profit is — and what
              to do about it.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PRODUCT_SECTIONS.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25">
                    <s.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {s.title}
                    </div>
                    <div className="text-xs text-white/40">{s.tagline}</div>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {s.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-white/60"
                    >
                      <span className="mt-0.5 shrink-0 text-accent/60">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto mt-32 max-w-2xl px-6 pb-24 text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Ready to see your real profit?
          </h2>
          <p className="mt-4 text-sm text-white/50">
            Join the private beta and get early access to Kairos.
          </p>
          <div className="mt-8">
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              Join the private beta →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
