import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";
import Sidebar from "./Sidebar";
import BusinessSelector from "../dashboard/BusinessSelector";
import ChatDrawer from "../kairos/ChatDrawer";
import { useAuth } from "../../auth/AuthContext";
import { LanguageSwitcher } from "../../i18n/LanguageSwitcher";
import { useI18n } from "../../i18n/useI18n";
import type { TranslationKey } from "../../i18n/I18nProvider";

const PAGE_TITLE_KEYS: Record<string, TranslationKey> = {
  "/dashboard": "nav.dashboard",
  "/dashboard/products": "nav.products",
  "/dashboard/insights": "nav.insights",
  "/dashboard/settings": "nav.settings",
};

export default function DashboardLayout() {
  const { user, loading: loadingMe } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  const pageTitle = t(PAGE_TITLE_KEYS[location.pathname] ?? "nav.dashboard");

  const initials = useMemo(() => {
    if (!user?.email) return "?";
    return user.email.trim().charAt(0).toUpperCase();
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return "—";
    const fn = user.first_name?.trim() ?? "";
    const ln = user.last_name?.trim() ?? "";
    const full = `${fn} ${ln}`.trim();
    return full || user.email;
  }, [user]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-bg text-white">
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
        <Sidebar />

        <main className="min-w-0 flex-1 overflow-x-hidden">
          {/* Top bar */}
          <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/70 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-2 px-4 py-3 md:px-6 md:py-3.5">
              {/* Breadcrumb */}
              <div className="flex min-w-0 items-center gap-1.5 text-sm">
                <span className="hidden font-semibold tracking-wide text-white/25 sm:inline">KAIROS</span>
                <span className="hidden text-white/15 sm:inline">/</span>
                <span className="truncate font-medium text-white/80">{pageTitle}</span>
              </div>

              {/* Right : business selector + user chip */}
              <div className="flex min-w-0 shrink items-center justify-end gap-2 md:shrink-0 md:gap-4">
                <BusinessSelector />
                <div className="hidden sm:block">
                  <LanguageSwitcher compact />
                </div>

                {loadingMe ? (
                  <div className="text-xs text-white/40">{t("common.loading")}</div>
                ) : (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="hidden text-right leading-tight sm:block">
                      <div className="text-sm font-medium text-white">{displayName}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">
                        {user?.role ?? "—"}
                      </div>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 ring-1 ring-accent/30 md:h-9 md:w-9">
                      <span className="text-sm font-semibold text-accent">{initials}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content — pb-24 sur mobile pour laisser place à la bottom nav + FAB */}
          <div className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-4 py-6 pb-24 md:px-6 md:py-10 md:pb-10">
            <Outlet context={{ me: user, loadingMe }} />
          </div>
        </main>
      </div>
      <ChatDrawer />
    </div>
  );
}
