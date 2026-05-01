import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { Providers } from "./providers";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <Providers><RouterProvider router={router} /></Providers>
    </ErrorBoundary>
  );
}
