"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminCard } from "../components/AdminCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const router = useRouter();

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memverifikasi PIN.");
      }

      setStep(2);
      setSuccess("PIN terverifikasi. Silakan masukkan password baru.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mereset password.");
      }

      setSuccess("Password berhasil diperbarui! Mengalihkan ke login...");
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AdminCard title="Reset Password" description={step === 1 ? "Gunakan PIN keamanan untuk memverifikasi akun Anda." : "Masukkan password baru untuk akun Anda."}>
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive flex gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl text-sm text-accent flex gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={step === 1 ? handleVerifyPin : handleReset} className="space-y-5">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email Admin</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder:text-muted-foreground/50"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">PIN Keamanan</label>
                  <input 
                    type="password" 
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder:text-muted-foreground/50"
                    placeholder="Masukkan PIN"
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-5 pt-2 animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Password Baru</label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    placeholder="Min 6 karakter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Konfirmasi Password Baru</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    placeholder="Ulangi password"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-accent/25"
            >
              {loading ? "Memproses..." : step === 1 ? "Verifikasi PIN" : "Update Password"}
            </button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Ingat password?{" "}
              <Link href="/admin/login" className="text-accent font-medium hover:underline">
                Kembali ke Login
              </Link>
            </p>
          </form>
        </AdminCard>
      </div>
    </div>
  );
}
