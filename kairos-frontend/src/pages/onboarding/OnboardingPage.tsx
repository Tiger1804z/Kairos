import { useNavigate } from "react-router-dom";
import BusinessInfoStep from "./BusinessInfoStep";
import { useBusinessContext } from "../../business/BusinessContext";

export default function OnboardingPage() {
  const { refreshBusinesses } = useBusinessContext();
  const navigate = useNavigate();

  const handleNext = async () => {
    await refreshBusinesses(); // recharge la liste avant de naviguer
    navigate("/dashboard");    // RequireAuth verra businesses.length > 0
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-white">
      <div className="w-full max-w-2xl">
        <BusinessInfoStep onNext={handleNext} />
      </div>
    </div>
  );
}
