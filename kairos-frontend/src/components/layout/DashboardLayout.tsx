import { Outlet } from "react-router-dom";
import { useMemo } from "react";
import Sidebar from "./Sidebar";
import BusinessSelector from "../dashboard/BusinessSelector";
import ChatDrawer from "../kairos/ChatDrawer";
import { useAuth } from "../../auth/AuthContext";

export default function DashboardLayout() {
  const { user, loading: loadingMe } = useAuth();

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
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div className="text-sm text-white/70">Dashboard</div>

              <div className="flex items-center gap-3">
                <BusinessSelector />
                {loadingMe ? (
                  <div className="text-xs text-white/50">Loading...</div>
                ) : (
                  <>
                    <div className="hidden text-right leading-tight sm:block">
                      <div className="text-xs font-medium">{displayName}</div>
                      <div className="text-[11px] text-white/50">{user?.role ?? "—"}</div>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                      <span className="text-sm text-white/70">{initials}</span>
                    </div>
                  </>
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
