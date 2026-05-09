import {AuthProvider} from "../auth/AuthContext";
import { BusinessProvider } from "../business/BusinessContext";
import { I18nProvider } from "../i18n/I18nProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <BusinessProvider>
          {children}
        </BusinessProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
