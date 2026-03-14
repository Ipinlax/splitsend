"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signInSchema } from "@/lib/validation";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("redirect") ?? searchParams.get("next") ?? "/dashboard";
  const suspended = searchParams.get("reason") === "suspended";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid input.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (authError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <div className="card p-8 shadow-card">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500">Sign in to your SplitSend account</p>
      </div>

      {suspended && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Your account has been suspended. Contact admin on WhatsApp for assistance.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email" type="email" autoComplete="email" className="input"
            placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} required maxLength={254}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password" type={showPassword ? "text" : "password"}
              autoComplete="current-password" className="input pr-10"
              placeholder="Your password" value={password}
              onChange={(e) => setPassword(e.target.value)} required maxLength={128}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </span>
          ) : (
            <><LogIn className="w-4 h-4" /> Sign In</>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-blue-600 font-semibold hover:text-blue-700">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
