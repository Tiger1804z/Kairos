import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ShopifySuccessPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/dashboard/settings");
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow p-10 flex flex-col items-center gap-4">
        <div className="text-4xl">🛍️</div>
        <h1 className="text-2xl font-bold text-gray-800">Boutique connectée !</h1>
        <p className="text-gray-500">Redirection vers les paramètres...</p>
      </div>
    </div>
  );
}