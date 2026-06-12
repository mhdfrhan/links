"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  confirmVariant?: "danger" | "primary";
  loading?: boolean;
  children?: React.ReactNode;
}

export function AdminModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Konfirmasi",
  confirmVariant = "primary",
  loading = false,
  children,
}: AdminModalProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useGSAP(() => {
    if (!isOpen || !mounted) return;

    // Entrance animation
    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" }
    );

    gsap.fromTo(modalRef.current,
      { scale: 0.9, opacity: 0, y: 10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" }
    );
  }, { dependencies: [isOpen, mounted] });

  const handleClose = () => {
    if (loading) return;
    
    // Exit animation
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: "power2.in" });
    gsap.to(modalRef.current, {
      scale: 0.95,
      opacity: 0,
      y: 5,
      duration: 0.2,
      ease: "power2.in",
      onComplete: onClose
    });
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-card/90 backdrop-blur-xl  border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-white/5 relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5  text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          
          <h3 className="text-lg md:text-xl font-semibold text-foreground pr-10 tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed font-medium">
              {description}
            </p>
          )}
        </div>

        {/* Content */}
        {children && (
          <div className="p-5 md:p-6 max-h-[60vh] overflow-y-auto">
            {children}
          </div>
        )}

        {/* Footer */}
        <div className="p-5 md:p-6 border-t border-white/5 flex flex-col-reverse sm:flex-row justify-end gap-2 bg-white/5">
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2  text-xs font-semibold text-muted-foreground hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
          >
            Batal
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`w-full sm:w-auto px-6 py-2  text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
                confirmVariant === "danger"
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
                  : "bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent/20"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white  animate-spin" />
                  Memproses...
                </span>
              ) : (
                confirmText
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
