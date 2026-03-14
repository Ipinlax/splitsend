"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema } from "@/lib/validation";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = signUpSchema.safeParse({ email, password, phone: phone || undefined });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid input.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { phone: parsed.data.phone ?? null },
      },
    });

    if (authError) {
      // Safe generic message
      if (authError.message.toLowerCase().includes("already")) {
        setError("An account with this email already exists. Please sign in.");
      } else {
        setError("Could not create account. Please try again.");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Auto-redirect after 3s
    setTimeout(() => router.push("/dashboard"), 3000);
  };

  if (success) {
    return (
      <div className="card p-8 shadow-card text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Account Created!</h2>
        <p className="text-sm text-gray-500 mb-1">
          Welcome to SplitSend. Check your email to verify your account.
        </p>
        <p className="text-xs text-gray-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  const passwordStrength = password.length === 0 ? null : password.length < 8 ? "weak" : password.length < 12 ? "fair" : "strong";

  return (
    <div className="card p-8 shadow-card">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500">Join SplitSend. Free to sign up.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label className="label" htmlFor="email">Email address <span className="text-red-500">*</span></label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Password <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="input pr-10"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Password strength indicator */}
          {passwordStrength && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-1">
                {["weak", "fair", "strong"].map((level, i) => (
                  <div
                    key={level}
                    className={`h-1 w-10 rounded-full transition-colors duration-300 ${
                      passwordStrength === "weak" && i === 0
                        ? "bg-red-400"
                        : passwordStrength === "fair" && i <= 1
                        ? "bg-yellow-400"
                        : passwordStrength === "strong"
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-medium ${
                passwordStrength === "weak" ? "text-red-500" :
                passwordStrength === "fair" ? "text-yellow-600" : "text-green-600"
              }`}>
                {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="phone">
            WhatsApp / Phone number{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="input"
            placeholder="+234 800 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={15}
          />
          <p className="text-xs text-gray-400 mt-1">Used to reach you about matches. Not publicly visible.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account...
            </span>
          ) : (
            <>
              <UserPlus className="w-4 h-4" /> Create Account
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
