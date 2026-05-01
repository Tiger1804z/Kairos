import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Package,
  Lightbulb,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { useAuth } from "../../auth/AuthContext";
import { useI18n } from "../../i18n/useI18n";
import type { TranslationKey } from "../../i18n/I18nProvider";

const nav = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/dashboard/products", labelKey: "nav.products", icon: Package },
  { to: "/dashboard/insights", labelKey: "nav.insights", icon: Lightbulb },
  { to: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-bg/60 p-4 backdrop-blur md:block">
        {/* Brand mark */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25">
            <span className="text-sm font-bold text-accent">K</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-wide text-white">KAIROS</div>
            <div className="text-[11px] text-white/40">{t("nav.profitIntelligence")}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-0.5">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition duration-150",
                  isActive
                    ? "bg-accent/10 font-medium text-white ring-1 ring-accent/20"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-150",
                      isActive ? "text-accent" : "text-white/30"
                    )}
                  />
                  <span>{t(n.labelKey as TranslationKey)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="mt-6 border-t border-white/5 pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/40 transition duration-150 hover:bg-white/5 hover:text-white/70"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.signOut")}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid w-full max-w-full grid-cols-5 border-t border-white/5 bg-bg/95 pb-safe pt-1 backdrop-blur md:hidden">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex min-w-0 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition",
                isActive ? "text-accent" : "text-white/40"
              )
            }
          >
            {({ isActive }) => (
              <>
                <n.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-accent" : "text-white/30"
                  )}
                />
                <span className="block max-w-full truncate">{t(n.labelKey as TranslationKey)}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex min-w-0 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium text-white/40 transition"
        >
          <LogOut className="h-5 w-5 text-white/30" />
          <span className="block max-w-full truncate">{t("nav.signOut")}</span>
        </button>
      </nav>
    </>
  );
}
