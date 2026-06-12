"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/admin/dashboard");
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/dashboard");
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Email atau password salah.");
      } else if (err.code === "auth/user-not-found") {
        setError("Akun tidak ditemukan.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Terlalu banyak percobaan. Coba lagi nanti.");
      } else {
        setError("Gagal masuk. Periksa koneksi Anda.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden  border border-border bg-card/50 backdrop-blur-xl shadow-2xl">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-emerald-500/5" />
          
          <div className="relative p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16  bg-accent/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-accent">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Login Admin</h1>
              <p className="text-sm text-muted-foreground mt-2">Masuk ke sistem CMS Portofolio.</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-4 mb-6 text-sm bg-destructive/10 border border-destructive/20 ">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <span className="text-destructive">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3.5  bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-300 placeholder:text-muted-foreground/50"
                  placeholder="admin@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5  bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-300 placeholder:text-muted-foreground/50"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-accent text-accent-foreground font-semibold  hover:bg-accent/90 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-accent/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin  h-4 w-4 border-t-2 border-b-2 border-accent-foreground"></div>
                    Memproses...
                  </span>
                ) : "Masuk"}
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">atau</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Belum punya akun?{" "}
                  <Link href="/admin/register" className="text-accent font-medium hover:underline transition-colors">
                    Daftar di sini
                  </Link>
                </p>
                <p className="text-sm">
                  <Link href="/admin/forgot-password" className="text-muted-foreground hover:text-accent font-medium transition-colors">
                    Lupa Password?
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
