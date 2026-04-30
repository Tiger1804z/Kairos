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

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/products", label: "Products", icon: Package },
  { to: "/dashboard/insights", label: "Insights", icon: Lightbulb },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-bg/60 p-4 backdrop-blur md:block">
      {/* Brand mark */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25">
          <span className="text-sm font-bold text-accent">K</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-wide text-white">KAIROS</div>
          <div className="text-[11px] text-white/40">Profit Intelligence</div>
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
                <span>{n.label}</span>
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
          Sign out
        </button>
      </div>
    </aside>
  );
}
