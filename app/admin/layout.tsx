"use client";

import { AuthProvider } from "@/lib/firebase/AuthContext";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "../components/ThemeToggle";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";

import { AdminSidebar } from "./components/AdminSidebar";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== "/admin/login" && pathname !== "/admin/register" && pathname !== "/admin/forgot-password") {
      router.push("/admin/login");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" suppressHydrationWarning></div>
      </div>
    );
  }

  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register" || pathname === "/admin/forgot-password";

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col" suppressHydrationWarning>
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg text-foreground hover:text-accent transition-colors tracking-tight">
              Portfolio Admin
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" suppressHydrationWarning>
      {/* Header */}
      <header className="sticky top-0 z-[60] w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
            <Link href="/admin/dashboard" className="font-semibold text-lg text-foreground hover:text-accent transition-colors tracking-tight">
              Portfolio <span className="text-accent">Admin</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-[11px] font-semibold text-foreground leading-none">{user?.email?.split('@')[0]}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar Desktop */}
        <AdminSidebar />

        {/* Sidebar Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/20 lg:hidden backdrop-blur-[2px]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Mobile Content */}
        <div className={`fixed inset-y-0 left-0 z-50 w-60 bg-background border-r border-border/50 transform transition-transform duration-300 lg:hidden pt-14 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <AdminSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full p-4 lg:p-6 bg-muted/5">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-1 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

import { AdminToast } from "./components/AdminToast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
      <AdminToast />
    </AuthProvider>
  );
}
