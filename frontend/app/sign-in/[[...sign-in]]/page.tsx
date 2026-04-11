"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { notifyAuthChanged } from "@/lib/jwt-auth";

function safeRedirect(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (raw.startsWith("/")) return raw;

  try {
    const url = new URL(raw);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = useMemo(
    () => safeRedirect(searchParams.get("redirect_url")),
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Sign in failed");
        setIsLoading(false);
        return;
      }

      notifyAuthChanged();
      router.push(redirectTarget);
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-panel shadow-floating p-8 border border-white/50">
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Sign In</h1>
        <p className="text-sm text-muted-fg mt-2">
          Use your email and password to continue to your dashboard.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-fg">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full h-12 px-4 rounded-xl bg-background shadow-recessed border-none outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-fg">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full h-12 px-4 rounded-xl bg-background shadow-recessed border-none outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Minimum 8 characters"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-accent text-white font-bold uppercase tracking-wider disabled:opacity-60"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="w-1/5 border-b border-muted-fg/20 lg:w-1/4"></span>
          <span className="text-xs text-center text-muted-fg uppercase tracking-widest font-bold">or</span>
          <span className="w-1/5 border-b border-muted-fg/20 lg:w-1/4"></span>
        </div>

        <a
          href="http://localhost:3001/auth/google"
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-background h-12 px-4 border border-muted-fg/20 shadow-floating hover:bg-muted/50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="font-bold uppercase tracking-wider text-sm text-foreground">Sign In with Google</span>
        </a>

        <p className="text-sm text-muted-fg mt-6">
          New here?{" "}
          <Link href="/sign-up" className="text-accent font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
