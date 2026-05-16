"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { showToast } from "../components/AdminToast";
import { AITranslateButton } from "../components/AITranslateButton";

export default function AboutPage() {
  const [text, setText] = useState("");
  const [text_en, setTextEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const aboutDoc = await getDoc(doc(db, "portfolio", "about"));
        if (aboutDoc.exists()) {
          setText(aboutDoc.data().text || "");
          setTextEn(aboutDoc.data().text_en || "");
        }
      } catch (err) {
        console.error("Error fetching about:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "portfolio", "about"), { text, text_en });
      showToast("success", "Tentang Saya berhasil disimpan!");
    } catch (err) {
      console.error("Error saving about:", err);
      showToast("error", "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Tentang Saya</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Teks yang muncul di section "About" di homepage.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-accent text-accent-foreground text-sm font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-70 transition-all shadow-md hover:shadow-accent/20 active:scale-95"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title="Editor" description="Tulis deskripsi tentang diri kamu.">
          <div className="space-y-4">
            <AdminFormField
              label="Teks Tentang Saya (ID)"
              type="textarea"
              value={text}
              onChange={setText}
              rows={8}
              placeholder="Tulis bio / deskripsi diri kamu di sini (Bahasa Indonesia)..."
              maxLength={2000}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">Teks Tentang Saya (EN)</label>
                <AITranslateButton text={text} onTranslated={setTextEn} />
              </div>
              <textarea
                value={text_en}
                onChange={(e) => setTextEn(e.target.value)}
                rows={8}
                placeholder="Write your bio / description here (English)..."
                maxLength={2000}
                className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Preview" description="Tampilan teks di website kamu.">
          <div className="p-5 rounded-2xl bg-muted/10 border border-border/50">
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {text || <span className="opacity-40 font-medium">Belum ada teks...</span>}
            </p>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
