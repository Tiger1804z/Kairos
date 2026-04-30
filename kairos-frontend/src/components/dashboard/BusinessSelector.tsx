import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2 } from "lucide-react";
import { useBusinessContext } from "../../business/BusinessContext";
import { useI18n } from "../../i18n/useI18n";

export default function BusinessSelector() {
  const { businesses, selectedBusinessId, selectedBusiness, selectBusiness, loading, error } =
    useBusinessContext();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <div className="text-xs text-white/40">{t("business.loading")}</div>;
  }
  if (error) {
    return <div className="text-xs text-danger">{t("business.error")}</div>;
  }
  if (businesses.length === 0) {
    return <div className="text-xs text-warning">{t("business.empty")}</div>;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 transition duration-150 hover:bg-white/[0.08] hover:ring-white/20 focus:outline-none"
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-white/40" />
        <span className="max-w-[140px] truncate font-medium">
          {selectedBusiness?.name ?? t("business.select")}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] rounded-xl bg-surface py-1 shadow-xl ring-1 ring-white/10">
          {businesses.map((b) => (
            <button
              key={b.id_business}
              onClick={() => {
                selectBusiness(b.id_business);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition duration-100 hover:bg-white/5 ${
                b.id_business === selectedBusinessId
                  ? "font-medium text-accent"
                  : "text-white/70"
              }`}
            >
              <div
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  b.id_business === selectedBusinessId ? "bg-accent" : "bg-transparent"
                }`}
              />
              {b.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
