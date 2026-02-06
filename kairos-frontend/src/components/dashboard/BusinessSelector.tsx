import { useBusinessContext } from "../../business/BusinessContext";

 export default function BusinessSelector() {
    const { businesses, selectedBusinessId, selectBusiness,loading,error } = useBusinessContext();

    if (loading) {
         return (
            <div className="text-xs text-white/50">
                Loading businesses...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-xs text-red-500">
                 Failed to load businesses: {error}
            </div>
        );
    }

    if (businesses.length === 0) {
        return (
            <div className="text-xs text-yellow-500">
                No businesses found.
            </div>
        );
    }

    return (
    <div className="relative">
      <select
        value={selectedBusinessId ?? ""}
        onChange={(e) => selectBusiness(Number(e.target.value))}
        className="appearance-none rounded-lg bg-white/5 px-4 py-2 pr-10 text-sm text-white ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="" disabled>
          Select a business
        </option>
        {businesses.map((business) => (
          <option key={business.id_business} value={business.id_business} className="bg-bg text-white">
            {business.name}
          </option>
        ))}
      </select>

      {/* Icône dropdown */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <svg
          className="h-4 w-4 text-white/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );


}

