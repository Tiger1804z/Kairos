import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/landing/LandingPage";
import AuthPage from "../pages/auth/AuthPage";

import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
//import BusinessesPage from "../pages/dashboard/BusinessesPage";
//import ClientPage from "../pages/dashboard/ClientPage";
//import ReportsPage from "../pages/dashboard/ReportsPage";
//import SettingsPage from "../pages/dashboard/SettingsPage";


export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/auth", element: <AuthPage /> },

  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      //{ path: "businesses", element: <BusinessesPage /> },
      //{ path: "clients", element: <ClientPage /> },
      //{ path: "reports", element: <ReportsPage /> },
      //{ path: "settings", element: <SettingsPage /> },
    ],
  },
]);