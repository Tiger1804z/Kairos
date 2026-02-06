import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import { api } from "../../lib/api";
import BusinessSelector from "../dashboard/BusinessSelector";

type MeUser = {
  id_user: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "owner" | "admin" | "employee";
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // On suppose que ton backend renvoie: { user: {...} }
        const res = await api.get("/auth/me");
        if (!alive) return;

        const user = res.data?.user ?? null;
        setMe(user);
      } catch (e: any) {
        if (!alive) return;
        setMe(null);

        // Si pas auth => on renvoie au login
        // (tu peux commenter si tu veux juste laisser la page)
        navigate("/auth?mode=login");
      } finally {
        if (alive) setLoadingMe(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate]);

  const initials = useMemo(() => {
    if (!me?.email) return "?";
    return me.email.trim().charAt(0).toUpperCase() || "?";
  }, [me]);

  const displayName = useMemo(() => {
    if (!me) return "—";
    const fn = me.first_name?.trim() ?? "";
    const ln = me.last_name?.trim() ?? "";
    const full = `${fn} ${ln}`.trim();
    return full || me.email;
  }, [me]);

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
                <BusinessSelector/>
                {loadingMe ? (
                  <div className="text-xs text-white/50">Loading...</div>
              
                
                ) : (
                  <>
                    <div className="hidden text-right leading-tight sm:block">
                      <div className="text-xs font-medium">{displayName}</div>
                      <div className="text-[11px] text-white/50">{me?.role ?? "—"}</div>
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
            <Outlet context={{ me, loadingMe }} />
          </div>
        </main>
      </div>
    </div>
  );
}
