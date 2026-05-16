"use client";

import { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { showToast } from "./AdminToast";

interface AITranslateButtonProps {
  text: string;
  onTranslated: (translatedText: string) => void;
  className?: string;
  label?: string;
}

export function AITranslateButton({ text, onTranslated, className = "", label = "AI Translate" }: AITranslateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text || text.trim() === "") {
      showToast("error", "Teks sumber kosong!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal melakukan translasi");
      }

      if (data.translatedText) {
        onTranslated(data.translatedText);
        showToast("success", "Teks berhasil ditranslasi!");
      }
    } catch (error: any) {
      console.error("AI Translate Error:", error);
      showToast("error", error.message || "Terjadi kesalahan pada AI Translate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={loading || !text}
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition-all border border-accent/20 ${className}`}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      ) : (
        <SparklesIcon className="w-3.5 h-3.5" />
      )}
      {loading ? "Translating..." : label}
    </button>
  );
}
