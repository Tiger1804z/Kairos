import { LayoutDashboard, Lightbulb, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import BuiltForClarity from "../../components/landing/BuiltForClarity";
import DashboardPreview from "../../components/landing/DashboardPreview";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { useI18n } from "../../i18n/useI18n";

export default function LandingPage() {
  const { t } = useI18n();
  const productSections = [
    {
      icon: LayoutDashboard,
      title: t("nav.dashboard"),
      tagline: t("landing.sections.dashboard.tagline"),
      items: [
        t("landing.sections.dashboard.item1"),
        t("landing.sections.dashboard.item2"),
        t("landing.sections.dashboard.item3"),
        t("landing.sections.dashboard.item4"),
      ],
    },
    {
      icon: Lightbulb,
      title: t("nav.insights"),
      tagline: t("landing.sections.insights.tagline"),
      items: [
        t("landing.sections.insights.item1"),
        t("landing.sections.insights.item2"),
        t("landing.sections.insights.item3"),
        t("landing.sections.insights.item4"),
      ],
    },
    {
      icon: MessageSquare,
      title: t("landing.sections.chat.title"),
      tagline: t("landing.sections.chat.tagline"),
      items: [
        t("landing.sections.chat.item1"),
        t("landing.sections.chat.item2"),
        t("landing.sections.chat.item3"),
        t("landing.sections.chat.item4"),
      ],
    },
  ];

  const valueStrip = [
    t("landing.value.realProfit"),
    t("landing.value.marginRisk"),
    t("landing.value.missingCosts"),
    t("landing.value.aiAnswers"),
  ];

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
            {t("landing.hero.badge")}
          </span>

          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
            {t("landing.hero.title1")}
            <span className="block text-white/40">{t("landing.hero.title2")}</span>
          </h1>

          <p className="mt-6 max-w-xl text-sm text-white/60 md:text-base">
            {t("landing.hero.description")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth?mode=signup"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              {t("landing.hero.cta.primary")}
            </Link>
            <Link
              to="/auth?mode=login"
              className="rounded-full bg-white/5 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
            >
              {t("landing.hero.cta.secondary")}
            </Link>
          </div>
        </section>

        {/* Hero screenshot */}
        <DashboardPreview />

        {/* Quick value strip */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {valueStrip.map((item) => (
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
              {t("landing.sections.title")}
            </h2>
            <p className="mt-4 text-sm text-white/50 md:text-base">
              {t("landing.sections.subtitle")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {productSections.map((s) => (
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
            {t("landing.final.title")}
          </h2>
          <p className="mt-4 text-sm text-white/50">
            {t("landing.final.subtitle")}
          </p>
          <div className="mt-8">
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              {t("landing.hero.cta.primary")}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
