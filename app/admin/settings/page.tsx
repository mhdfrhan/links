"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/AuthContext";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { showToast } from "../components/AdminToast";
import { ShieldCheckIcon, PhotoIcon, KeyIcon } from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Security
  const [pin, setPin] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Image compression defaults
  const [defaultQuality, setDefaultQuality] = useState(80);
  const [profileQuality, setProfileQuality] = useState(90);
  const [projectQuality, setProjectQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [defaultFormat, setDefaultFormat] = useState<string>("webp");
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [securityDoc, adminDoc, imageDoc] = await Promise.all([
          getDoc(doc(db, "config", "security")),
          getDoc(doc(db, "config", "admin")),
          getDoc(doc(db, "config", "imageSettings")),
        ]);

        if (securityDoc.exists()) {
          setPin(securityDoc.data().pin || "04032005");
        } else {
          setPin("04032005");
        }

        if (adminDoc.exists()) {
          setRegistrationOpen(adminDoc.data().registrationOpen || false);
        }

        if (imageDoc.exists()) {
          const img = imageDoc.data();
          setDefaultQuality(img.defaultQuality || 80);
          setProfileQuality(img.profileQuality || 90);
          setProjectQuality(img.projectQuality || 80);
          setMaxWidth(img.maxWidth || 1920);
          setDefaultFormat(img.format || "webp");
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSecurity = async () => {
    setSavingSecurity(true);
    try {
      await setDoc(doc(db, "config", "security"), { pin });

      const adminRef = doc(db, "config", "admin");
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        await setDoc(adminRef, { ...adminSnap.data(), registrationOpen }, { merge: true });
      }

      showToast("success", "Pengaturan keamanan berhasil disimpan!");
    } catch (err) {
      console.error(err);
      showToast("error", "Gagal menyimpan pengaturan keamanan.");
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleSaveImage = async () => {
    setSavingImage(true);
    try {
      await setDoc(doc(db, "config", "imageSettings"), {
        defaultQuality,
        profileQuality,
        projectQuality,
        maxWidth,
        format: defaultFormat,
      });
      showToast("success", "Pengaturan gambar berhasil disimpan!");
    } catch (err) {
      console.error(err);
      showToast("error", "Gagal menyimpan.");
    } finally {
      setSavingImage(false);
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
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Pengaturan</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Konfigurasi keamanan dan gambar.</p>
      </div>

      {/* Account Info */}
      <AdminCard title="Informasi Akun" description="Data akun admin kamu.">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
          <div className="w-10 h-10 rounded-lg bg-accent/5 flex items-center justify-center border border-accent/10">
            <KeyIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{user?.email}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Administrator</p>
          </div>
        </div>
      </AdminCard>

      {/* Security Settings */}
      <AdminCard title="Keamanan" description="PIN recovery dan kontrol registrasi.">
        <div className="space-y-5">
          <AdminFormField
            label="PIN Recovery"
            type="password"
            value={pin}
            onChange={setPin}
            placeholder="Masukkan PIN"
            hint="PIN digunakan untuk reset password. Default: 04032005"
          />

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">Halaman Registrasi</label>
            <button
              type="button"
              onClick={() => setRegistrationOpen(!registrationOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                registrationOpen
                  ? "bg-accent/5 text-accent border-accent/10"
                  : "bg-red-500/5 text-red-500 border-red-500/10"
              }`}
            >
              <ShieldCheckIcon className="w-4 h-4" />
              {registrationOpen ? "Registrasi TERBUKA" : "Registrasi TERTUTUP"}
            </button>
            <p className="text-[10px] text-muted-foreground font-medium">Jika tertutup, halaman /admin/register tidak bisa diakses.</p>
          </div>

          <button
            onClick={handleSaveSecurity}
            disabled={savingSecurity}
            className="px-5 py-2 bg-accent text-accent-foreground text-xs font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-70 transition-all shadow-md hover:shadow-accent/20 active:scale-95"
          >
            {savingSecurity ? "Menyimpan..." : "Simpan Keamanan"}
          </button>
        </div>
      </AdminCard>

      {/* Image Compression Settings */}
      <AdminCard title="Kompresi Gambar" description="Pengaturan default untuk kompresi gambar saat upload.">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold text-foreground">
                Kualitas Default <span className="text-accent">{defaultQuality}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(Number(e.target.value))}
                className="w-full accent-accent h-1.5 rounded-lg appearance-none bg-muted cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold text-foreground">
                Kualitas Profil <span className="text-accent">{profileQuality}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={profileQuality}
                onChange={(e) => setProfileQuality(Number(e.target.value))}
                className="w-full accent-accent h-1.5 rounded-lg appearance-none bg-muted cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold text-foreground">
                Kualitas Project <span className="text-accent">{projectQuality}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={projectQuality}
                onChange={(e) => setProjectQuality(Number(e.target.value))}
                className="w-full accent-accent h-1.5 rounded-lg appearance-none bg-muted cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminFormField
              label="Max Lebar (px)"
              type="number"
              value={maxWidth}
              onChange={(v) => setMaxWidth(Number(v))}
              placeholder="1920"
            />
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Format Default</label>
              <select
                value={defaultFormat}
                onChange={(e) => setDefaultFormat(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-background/50 border border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none text-xs font-medium transition-all"
              >
                <option value="webp">WebP (Terkecil)</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG (Terbesar)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveImage}
            disabled={savingImage}
            className="px-5 py-2 bg-accent text-accent-foreground text-xs font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-70 transition-all shadow-md hover:shadow-accent/20 active:scale-95"
          >
            {savingImage ? "Menyimpan..." : "Simpan Pengaturan Gambar"}
          </button>
        </div>
      </AdminCard>
    </div>
  );
}
