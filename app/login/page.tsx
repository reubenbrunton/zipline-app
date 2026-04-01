"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { ZiplineLogo } from "@/components/logo/ZiplineLogo";
import { GradientButton } from "@/components/ui/gradient-button";
import { ShaderBackground } from "@/components/ui/shader-background";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      setError("Your Google account is not authorised to access this platform. Contact your administrator.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A14]">
      {/* Animated shader background */}
      <ShaderBackground className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[380px] mx-4">
        <div
          className="rounded-[28px] px-8 pt-8 pb-0 shadow-2xl"
          style={{
            background: "rgba(255, 255, 255, 0.07)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <ZiplineLogo variant="white" className="h-9 w-auto" />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-white tracking-wider">Welcome back</h1>
            <p className="text-sm text-white/50 mt-1.5">
              Sign into your Command Post
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-7 pr-4 bg-transparent border-b border-white/20 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#FF4533]/70 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-7 pr-10 bg-transparent border-b border-white/20 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#FF4533]/70 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>


            {error && (
              <p className="text-xs text-[#FF4533] text-center -mt-1">{error}</p>
            )}

            {/* Submit */}
            <GradientButton
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-1"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign in"
              )}
            </GradientButton>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.10]" />
            <span className="text-xs text-white/30">or</span>
            <div className="flex-1 h-px bg-white/[0.10]" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-12 rounded-2xl text-white text-sm font-medium transition-all flex items-center justify-center gap-3"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Forgot password */}
          <div className="py-4 flex items-center justify-center">
            <button
              type="button"
              className="text-xs text-white/20 hover:text-white/35 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Brand credit */}
        <p className="text-center text-xs text-white/20 mt-5">
          Zipline Internal Platform · v1.0
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
