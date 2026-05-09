import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBusinessContext } from "../../business/BusinessContext";

export default function ShopifySuccessPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshBusinesses } = useBusinessContext();

    const [fromOnboarding] = useState(() => sessionStorage.getItem("shopify_from_onboarding") === "1");
    const businessId = searchParams.get("businessId");

    useEffect(() => {
        const timer = setTimeout(async () => {
            sessionStorage.removeItem("shopify_from_onboarding");
            sessionStorage.removeItem("onboarding_business_id");

            if (businessId) {
                localStorage.setItem("selected_business_id", businessId);
            }

            await refreshBusinesses();

            if (fromOnboarding) {
                navigate("/dashboard");
            } else {
                navigate("/dashboard/settings?shopify=connected");
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate, refreshBusinesses, businessId, fromOnboarding]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="bg-white rounded-xl shadow p-10 flex flex-col items-center gap-4">
            <div className="text-4xl">🛍️</div>
            <h1 className="text-2xl font-bold text-gray-800">Boutique connectée !</h1>
            <p className="text-gray-500">
              {fromOnboarding ? "Synchronisation en cours..." : "Redirection vers les paramètres..."}
            </p>
          </div>
        </div>
    );
}
