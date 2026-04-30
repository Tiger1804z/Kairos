import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";
import Sidebar from "./Sidebar";
import BusinessSelector from "../dashboard/BusinessSelector";
import ChatDrawer from "../kairos/ChatDrawer";
import { useAuth } from "../../auth/AuthContext";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/products": "Products",
  "/dashboard/insights": "Insights",
  "/dashboard/settings": "Settings",
};

export default function DashboardLayout() {
  const { user, loading: loadingMe } = useAuth();
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ?? "Dashboard";

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
    <div className="min-h-screen bg-bg text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/70 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold tracking-wide text-white/25">KAIROS</span>
                <span className="text-white/15">/</span>
                <span className="font-medium text-white/80">{pageTitle}</span>
              </div>

              {/* Right : business selector + user chip */}
              <div className="flex items-center gap-4">
                <BusinessSelector />

                {loadingMe ? (
                  <div className="text-xs text-white/40">Loading...</div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="hidden text-right leading-tight sm:block">
                      <div className="text-sm font-medium text-white">{displayName}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">
                        {user?.role ?? "—"}
                      </div>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 ring-1 ring-accent/30">
                      <span className="text-sm font-semibold text-accent">{initials}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto max-w-7xl px-6 py-10">
            <Outlet context={{ me: user, loadingMe }} />
          </div>
        </main>
      </div>
      <ChatDrawer />
    </div>
  );
}
