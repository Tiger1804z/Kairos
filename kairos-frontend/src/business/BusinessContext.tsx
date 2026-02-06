import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ReactNode } from "react";

type Business = {
  id_business: number;
  name: string;
  business_type?: string;
  city?: string;
  country?: string;
};

type BusinessContextValue = {
  businesses: Business[];
  selectedBusinessId: number | null;
  selectedBusiness: Business | null;
  loading: boolean;
  error: string | null;
  selectBusiness: (businessId: number) => void;
  refreshBusinesses: () => Promise<void>;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);


export function BusinessProvider({ children }: { children: ReactNode }){
    const [businesses,setBusinesses] = useState<Business[]>([]);
    const [selectedBusinessId,setSelectedBusinessId] = useState<number | null>(null);
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState<string | null>(null);

    // on fetch la liste des businesses du user

    const fetchBusinesses = async () => {
        setLoading (true);
        setError(null);
        try {
            const res = await api.get("/businesses");
            const businessList = res.data.businesses || res.data.items || res.data || [];
            setBusinesses(businessList);

            // si pas de business selectionne, on en selectionne un par defaut
            const savedBusinessId = localStorage.getItem("selected_business_id");
            if (savedBusinessId && businessList.some((b: Business) => b.id_business === Number(savedBusinessId))) {
                setSelectedBusinessId (Number (savedBusinessId));
            } else if (businessList.length > 0) {
                setSelectedBusinessId(businessList[0].id_business);
                localStorage.setItem("selected_business_id", String(businessList[0].id_business));
            }
        } catch (err: any) {
            console.error("Failed to fetch businesses:", err);
            setError(err?.response?.data?.error || err?.message || "Failed to load businesses");
        } finally {
            setLoading(false);
        }
    };

    // charger les businesses au montage
    useEffect(() => {
        fetchBusinesses();
    }, []);

    // fonction pour selectionner un business
    const selectBusiness = (businessId: number) => {
        setSelectedBusinessId(businessId);
        localStorage.setItem("selected_business_id",String(businessId));
    };

    // business selectionne
    const selectedBusiness = businesses.find(b => b.id_business === selectedBusinessId) || null;

    const value: BusinessContextValue = {
        businesses,
        selectedBusinessId,
        selectedBusiness,
        loading,
        error,
        selectBusiness,
        refreshBusinesses: fetchBusinesses,
    };
    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );

}

export function useBusinessContext(){
    const context = useContext(BusinessContext);
    if (!context) {
        throw new Error("useBusinessContext must be used within a BusinessProvider");
    }
    return context;
}; 