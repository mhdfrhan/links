"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/admin/dashboard");
      return;
    }

    const checkRegistrationStatus = async () => {
      try {
        const configRef = doc(db, "config", "admin");
        const configSnap = await getDoc(configRef);
        
        if (configSnap.exists()) {
          const data = configSnap.data();
          // Block if already registered OR if registration is explicitly closed
          if (data.registered || data.registrationOpen === false) {
            setIsAllowed(false);
          } else {
            setIsAllowed(true);
          }
        } else {
          setIsAllowed(true);
        }
      } catch (err) {
        console.error("Error checking registration status", err);
        // If we can't check, allow registration attempt — the create user will fail 
        // server-side if not allowed. This prevents false "closed" messages.
        setIsAllowed(true);
      }
    };

    checkRegistrationStatus();
  }, [user, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) return;

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const configRef = doc(db, "config", "admin");
      await setDoc(configRef, { 
        registered: true,
        adminUid: userCredential.user.uid,
        email: email
      });

      router.push("/admin/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email ini sudah digunakan. Silakan login.");
      } else if (err.code === "auth/weak-password") {
        setError("Password terlalu lemah. Minimal 6 karakter.");
      } else {
        setError(err.message || "Gagal melakukan registrasi.");
      }
      setLoading(false);
    }
  };

  if (isAllowed === null) {
    return (
      <div className="flex-1 flex items-center justify-center" suppressHydrationWarning>
        <div className="animate-spin  h-8 w-8 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (isAllowed === false) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden  border border-border bg-card/50 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5" />
            <div className="relative p-8 md:p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16  bg-destructive/10 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-destructive">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Registrasi Ditutup</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Sistem ini hanya mengizinkan satu akun admin, dan akun tersebut sudah terdaftar.
              </p>
              <Link 
                href="/admin/login" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-semibold  hover:bg-accent/90 transition-all duration-300 hover:shadow-lg hover:shadow-accent/25"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Ke Halaman Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Daftar Admin</h1>
              <p className="text-sm text-muted-foreground mt-2">Buat satu-satunya akun untuk mengelola portofolio.</p>
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
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
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
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Konfirmasi Password</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3.5  bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-300 placeholder:text-muted-foreground/50"
                  placeholder="Ulangi password"
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
                ) : "Daftar Sekarang"}
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">atau</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link href="/admin/login" className="text-accent font-medium hover:underline transition-colors">
                  Login di sini
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
