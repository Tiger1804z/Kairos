import { createContext,useContext,useEffect,useMemo,useState } from "react";
import { api } from "../lib/api";

type Role = "owner" | "admin" | "employee";

type AuthUser = {
  id_user: number;
  first_name: string;
  last_name: string;
  email:string;
  role: Role;
};


type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: ((email: string,password: string) => Promise<void>);
  signup: (data: { first_name: string; last_name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Boot: si token existe -> /auth/me
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setUser(null);
          return;
        }
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch {
        localStorage.removeItem("auth_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("auth_token", res.data.token);
    setUser(res.data.user);
  }

  async function signup(data: { first_name: string; last_name: string; email: string; password: string }) {
    const res = await api.post("/auth/signup", data);
    localStorage.setItem("auth_token", res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem("auth_token");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, signup, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}