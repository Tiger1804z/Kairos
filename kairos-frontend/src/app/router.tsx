import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/landing/LandingPage";
import AuthPage from "../pages/auth/AuthPage";

import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";

import RequireAuth from "../auth/RequireAuth";

export const router = createBrowserRouter([
  {path: "/", element: <LandingPage />},
  {path: "/auth", element: <AuthPage />},
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [{index: true, element: <DashboardPage />}],
      },
    ],
  },
]); 
