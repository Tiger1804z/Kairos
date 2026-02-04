import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import axios from "axios";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../lib/cn";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

type Mode = "login" | "signup";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

const signupSchema = z.object({
  first_name: z.string().min(2, "Min 2 characters"),
  last_name: z.string().min(2, "Min 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

export default function AuthPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const mode = (params.get("mode") as Mode) ?? "login";
  const isSignup = mode === "signup";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(() => (isSignup ? signupSchema : loginSchema), [isSignup]);

  const [values, setValues] = useState<Record<string, string>>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const fields = isSignup
    ? ([
        { name: "first_name", label: "First name", type: "text", autoComplete: "given-name" },
        { name: "last_name", label: "Last name", type: "text", autoComplete: "family-name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
      ] as const)
    : ([
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ] as const);

  function setMode(next: Mode) {
    setParams({ mode: next });
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = schema.safeParse(values);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        // Ajuste ces endpoints selon ton backend:
        // ex: POST /auth/signup  (first_name, last_name, email, password)
        await axios.post(`${API_BASE}/auth/signup`, result.data, {
          withCredentials: true,
        });
      } else {
        // ex: POST /auth/login (email, password)
        await axios.post(`${API_BASE}/auth/login`, result.data, {
          withCredentials: true,
        });
      }

      // Après login/signup: redirect (à adapter plus tard)
      navigate("/");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Request failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-260px] h-[560px] w-[880px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="inline-flex rounded-full bg-white/5 px-4 py-2 text-xs text-white/70 ring-1 ring-white/10">
              {isSignup ? "Create your Kairos account" : "Welcome back"}
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight">
              {isSignup ? "Sign up" : "Log in"}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {isSignup
                ? "Start building with clarity in minutes."
                : "Access your dashboard and your business intelligence."}
            </p>
          </div>

          <Card className="p-6">
            <div className="mb-4 grid grid-cols-2 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  !isSignup ? "bg-white text-black" : "text-white/70 hover:text-white"
                )}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isSignup ? "bg-white text-black" : "text-white/70 hover:text-white"
                )}
              >
                Sign up
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="mb-2 block text-xs font-medium text-white/70">
                    {f.label}
                  </label>
                  <Input
                    type={f.type}
                    autoComplete={f.autoComplete}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    placeholder={f.label}
                  />
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
              </Button>

              <div className="text-center text-xs text-white/50">
                By continuing you agree to our Terms & Privacy.
              </div>
            </form>
          </Card>

          <div className="mt-6 text-center">
            <button
              className="text-sm text-white/60 hover:text-white"
              onClick={() => navigate("/")}
            >
              ← Back to landing
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
