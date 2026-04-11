"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notifyAuthChanged } from "@/lib/jwt-auth";

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to create account");
        setIsLoading(false);
        return;
      }

      notifyAuthChanged();
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Unable to sign up right now. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-panel shadow-floating p-8 border border-white/50">
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Create Account</h1>
        <p className="text-sm text-muted-fg mt-2">
          Start with email + password. We will take you to onboarding next.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-fg">Display Name</span>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-2 w-full h-12 px-4 rounded-xl bg-background shadow-recessed border-none outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Your name"
            />
          </label>

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

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-fg">Confirm Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full h-12 px-4 rounded-xl bg-background shadow-recessed border-none outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Re-enter password"
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
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-muted-fg mt-6">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-accent font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
