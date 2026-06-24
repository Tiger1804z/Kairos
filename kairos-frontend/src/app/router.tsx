import { createBrowserRouter } from "react-router-dom";
import { RouteErrorPage } from "../components/ui/ErrorBoundary";
import LandingPage from "../pages/landing/LandingPage";
import AuthPage from "../pages/auth/AuthPage";

import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";

import RequireAuth from "../auth/RequireAuth";
// S0-T08 / D-SEC5: legacy non-Shopify page imports kept for reference but not routed
// during the Shopify BI beta (see unmounted routes below). Page files are NOT deleted.
// import ClientPage from "../pages/dashboard/ClientPage";
// import EngagementPage from "../pages/dashboard/EngagementPage";
// import ReportsPage from "../pages/dashboard/ReportsPage";
import SettingsPage from "../pages/dashboard/SettingsPage";

import OnboardingPage from "../pages/onboarding/OnboardingPage";
// import TransactionsPage from "../pages/dashboard/TransactionsPage";
// import ClientDetailPage from "../pages/dashboard/ClientDetailPage";
// import EngagementDetailPage from "../pages/dashboard/EngagementDetailPage";
import ShopifySuccessPage from "../pages/shopify/ShopifySuccessPage";
import ProductsPage from "../pages/dashboard/ProductsPage";
import InsightsPage from "../pages/dashboard/InsightsPage";
import PrivacyPage from "../pages/privacy/PrivacyPage";


// arbre de routes de react-router :
// / -> LandingPage
// /auth -> AuthPage
// /onboarding -> OnboardingPage (protégé par auth)
// /dashboard -> DashboardLayout (protégé par auth)
// /dashboard/ -> DashboardPage
// /dashboard/settings -> SettingsPage
// /dashboard/products -> ProductsPage
// /dashboard/insights -> InsightsPage
// --- S0-T08 / D-SEC5: legacy routes below archived (not mounted) for Shopify BI beta ---
// /dashboard/transactions -> TransactionsPage (archived)
// /dashboard/clients -> ClientPage (archived)
// /dashboard/clients/:id -> ClientDetailPage (archived)
// /dashboard/engagements -> EngagementPage (archived)
// /dashboard/engagements/:id -> EngagementDetailPage (archived)
// /dashboard/reports -> ReportsPage (archived)
export const router = createBrowserRouter([
  {path: "/", element: <LandingPage />, errorElement: <RouteErrorPage />},
  {path: "/auth", element: <AuthPage />, errorElement: <RouteErrorPage />},
  {path: "/privacy", element: <PrivacyPage />, errorElement: <RouteErrorPage />},
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {path: "/onboarding", element: <OnboardingPage />},
      { path: "/shopify/success", element: <ShopifySuccessPage /> },
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        errorElement: <RouteErrorPage />,
        children: [{index: true, element: <DashboardPage />},
          // on ne mets pas de / devant les paths enfants car react-router les prefixe automatiquement avec /dashboard/
          // S0-T08 / D-SEC5: legacy non-Shopify routes intentionally NOT mounted during the
          // Shopify BI beta. Direct URLs now fall through to the "*" RouteErrorPage (404-like).
          // Backend already archived in S0-T07. Page files kept for reference.
          // {path:"transactions",element: <TransactionsPage />},
          // {path:"clients",element: <ClientPage />},
          // {path:"clients/:id",element: <ClientDetailPage />},
          // {path:"engagements",element: <EngagementPage/>},
          // {path:"engagements/:id",element: <EngagementDetailPage />},
          // {path:"reports",element: <ReportsPage />},
          {path:"settings",element: <SettingsPage />},
          {path:"products",element: <ProductsPage />},
          {path:"insights",element: <InsightsPage />}
        ],
      },
    ],
  },
  {path: "*", element: <RouteErrorPage />},
]); 
