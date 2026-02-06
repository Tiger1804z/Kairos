import {AuthProvider} from "../auth/AuthContext";
import { BusinessProvider } from "../business/BusinessContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>
          <BusinessProvider>
            {children}
          </BusinessProvider>
        </AuthProvider>;
}