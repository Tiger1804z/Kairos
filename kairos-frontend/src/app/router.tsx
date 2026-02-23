import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/landing/LandingPage";
import AuthPage from "../pages/auth/AuthPage";

import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";

import RequireAuth from "../auth/RequireAuth";
import ClientPage from "../pages/dashboard/ClientPage";
import EngagementPage from "../pages/dashboard/EngagementPage";
import ReportsPage from "../pages/dashboard/ReportsPage";
import SettingsPage from "../pages/dashboard/SettingsPage";

import OnboardingPage from "../pages/onboarding/OnboardingPage";
import TransactionsPage from "../pages/dashboard/TransactionsPage";
import ClientDetailPage from "../pages/dashboard/ClientDetailPage";
import EngagementDetailPage from "../pages/dashboard/EngagementDetailPage";


// arbre de routes de react-router :
// / -> LandingPage
// /auth -> AuthPage
// /onboarding -> OnboardingPage (protégé par auth)
// /dashboard -> DashboardLayout (protégé par auth)
// /dashboard/ -> DashboardPage
// /dashboard/transactions -> TransactionsPage
// /dashboard/clients -> ClientPage
// /dashboard/clients/:id -> ClientDetailPage
// /dashboard/engagements -> EngagementPage
// /dashboard/engagements/:id -> EngagementDetailPage
// /dashboard/reports -> ReportsPage
// /dashboard/settings -> SettingsPage
export const router = createBrowserRouter([
  {path: "/", element: <LandingPage />},
  {path: "/auth", element: <AuthPage />},
  {
    element: <RequireAuth />,
    children: [
      {path: "/onboarding", element: <OnboardingPage />},
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [{index: true, element: <DashboardPage />},
          // on ne mets pas de / devant les paths enfants car react-router les prefixe automatiquement avec /dashboard/ 
          {path:"transactions",element: <TransactionsPage />},
          {path:"clients",element: <ClientPage />},
          {path:"clients/:id",element: <ClientDetailPage />},
          {path:"engagements",element: <EngagementPage/>},  
          {path:"engagements/:id",element: <EngagementDetailPage />},
          {path:"reports",element: <ReportsPage />},
          {path:"settings",element: <SettingsPage />}
        ],
      },
    ],
  },
]); 
