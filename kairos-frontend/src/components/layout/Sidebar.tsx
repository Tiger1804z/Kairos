import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "../../lib/cn";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/businesses", label: "Businesses", icon: BriefcaseBusiness },
  { to: "/dashboard/clients", label: "Clients", icon: Users },
  { to: "/dashboard/engagements", label: "Engagements", icon: ClipboardList },
  { to: "/dashboard/reports", label: "Reports", icon: FileText },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-bg/60 p-4 backdrop-blur md:block">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="h-9 w-9 rounded-xl bg-white/5 ring-1 ring-white/10" />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide">KAIROS</div>
          <div className="text-xs text-white/50">Owner Desktop</div>
        </div>
      </div>

      <nav className="space-y-1">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 transition",
                "hover:bg-white/5 hover:text-white",
                isActive && "bg-white/10 text-white ring-1 ring-white/10"
              )
            }
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 border-t border-white/5 pt-4">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
