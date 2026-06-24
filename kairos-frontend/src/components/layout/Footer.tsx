import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/useI18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div>
            <div className="text-sm font-semibold tracking-wide">KAIROS</div>
            <p className="mt-2 max-w-xs text-sm text-white/50">
              {t("landing.footer.description")}
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <div className="mb-3 font-medium text-white/70">{t("landing.footer.product")}</div>
              <ul className="space-y-2 text-white/40">
                <li>{t("nav.dashboard")}</li>
                <li>{t("nav.insights")}</li>
                <li>{t("landing.sections.chat.title")}</li>
              </ul>
            </div>

            <div>
              <div className="mb-3 font-medium text-white/70">{t("landing.footer.account")}</div>
              <ul className="space-y-2 text-white/40">
                <li>
                  <Link to="/auth?mode=login" className="hover:text-white/70">
                    {t("landing.nav.login")}
                  </Link>
                </li>
                <li>
                  <Link to="/auth?mode=signup" className="hover:text-white/70">
                    {t("landing.nav.joinBeta")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/30">
          <span>© {new Date().getFullYear()} Kairos. {t("landing.footer.rights")}</span>
          <Link to="/privacy" className="hover:text-white/50 transition-colors">
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </footer>
  );
}
