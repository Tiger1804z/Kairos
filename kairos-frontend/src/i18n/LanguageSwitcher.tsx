import { cn } from "../lib/cn";
import { useI18n } from "./useI18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex rounded-full bg-white/5 p-0.5 ring-1 ring-white/10",
        compact && "scale-95"
      )}
      aria-label={t("common.language")}
    >
      {(["fr", "en"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase transition",
            language === lang
              ? "bg-white text-black"
              : "text-white/50 hover:text-white"
          )}
          aria-pressed={language === lang}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
