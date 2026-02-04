import { createContext,useContext,useEffect,useState } from "react";
import { api } from "../lib/api";

type User = {
  user_id: number;
  email: string;
  role: "owner" | "admin" | "employee";
  first_name?: string;
  last_name?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const login = (token: string) => {
        localStorage.setItem("auth_token", token);
        fetchMe();
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        setUser(null);
    };

    const fetchMe = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data.user);
        } catch {
            setUser(null);
            localStorage.removeItem("auth_token");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            fetchMe();
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};