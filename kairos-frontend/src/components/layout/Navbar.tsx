import logo from "../../assets/kairos_logo(3).png";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "../../i18n/LanguageSwitcher";
import { useI18n } from "../../i18n/useI18n";

export default function Navbar() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Kairos logo"
            className="h-9 w-auto opacity-90 transition hover:opacity-100"
          />
          <span className="text-sm font-semibold tracking-wide">KAIROS</span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />

          <Link
            to="/auth?mode=login"
            className="hidden text-sm text-white/60 hover:text-white/90 md:block"
          >
            {t("landing.nav.login")}
          </Link>

          <Link
            to="/auth?mode=signup"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
          >
            {t("landing.nav.joinBeta")}
          </Link>
        </div>
      </div>
    </header>
  );
}
