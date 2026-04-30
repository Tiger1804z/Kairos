import { TrendingDown, AlertTriangle, Search, MessageSquare } from "lucide-react";
import { useI18n } from "../../i18n/useI18n";

export default function BuiltForClarity() {
  const { t } = useI18n();
  const features = [
    {
      icon: TrendingDown,
      title: t("landing.clarity.feature1.title"),
      description: t("landing.clarity.feature1.description"),
    },
    {
      icon: AlertTriangle,
      title: t("landing.clarity.feature2.title"),
      description: t("landing.clarity.feature2.description"),
    },
    {
      icon: Search,
      title: t("landing.clarity.feature3.title"),
      description: t("landing.clarity.feature3.description"),
    },
    {
      icon: MessageSquare,
      title: t("landing.clarity.feature4.title"),
      description: t("landing.clarity.feature4.description"),
    },
  ];

  return (
    <section className="relative mx-auto mt-32 max-w-6xl px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("landing.clarity.title")}
        </h2>
        <p className="mt-4 text-sm text-white/50 md:text-base">
          {t("landing.clarity.subtitle")}
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {features.map((f) => (
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
