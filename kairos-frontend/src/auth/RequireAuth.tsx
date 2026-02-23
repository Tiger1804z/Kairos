import {Navigate,Outlet, useLocation} from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useBusinessContext } from "../business/BusinessContext";

export default function RequireAuth(){
    const {user,loading} = useAuth();
    const { businesses, loading: loadingBusinesses } = useBusinessContext();
    const location = useLocation();

    // on attend que les deux chargements soient termines avant de decider
    if (loading || loadingBusinesses) return null;

    // si pas connecte -> page de login
    if (!user) {
        return(
            <Navigate
                to="/auth?mode=login"
                replace
                state={{from: location.pathname}}
            />
        );
    }

    // si connecte mais aucun business et pas deja sur /onboarding -> redirect onboarding
    if (businesses.length === 0 && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
}
        