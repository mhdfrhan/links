"use client";

/**
 * GridBackground — Ultra-Clean Uniform Dot Grid (Fixed)
 * Menggunakan Mask Pattern untuk konsistensi warna Dark/Light mode.
 */
export function GridBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* 
         Titik-titik (Dots) menggunakan mask-image agar warnanya 
         sinkron dengan --grid-line di Dark/Light mode secara otomatis.
      */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "var(--grid-line)",
          WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='black'/%3E%3C/svg%3E")`,
          maskImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='black'/%3E%3C/svg%3E")`,
          WebkitMaskRepeat: "repeat",
          maskRepeat: "repeat",
          /* Fade-out halus di atas dan bawah agar tidak kaku */
          opacity: 0.8,
        }}
      />

      {/* Background Fade Gradient (untuk transisi grid ke konten) */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, var(--bg-primary), transparent 15%, transparent 85%, var(--bg-primary))",
        }}
      />

      {/* Ambient Glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80vw",
          height: "60vh",
          background: "radial-gradient(circle at center, var(--accent) 0%, transparent 70%)",
          opacity: "var(--grid-glow-opacity)" as any,
          filter: "blur(120px)",
        }}
      />
    </div>
  );
}
