"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { ImageCropper } from "../components/ImageCropper";
import { showToast } from "../components/AdminToast";
import { AITranslateButton } from "../components/AITranslateButton";

const PLATFORM_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp", icon: "💬", prefix: "https://wa.me/" },
  { value: "instagram", label: "Instagram", icon: "📸", prefix: "https://instagram.com/" },
  { value: "linkedin", label: "LinkedIn", icon: "💼", prefix: "" },
  { value: "github", label: "GitHub", icon: "🐙", prefix: "https://github.com/" },
  { value: "twitter", label: "Twitter / X", icon: "🐦", prefix: "https://x.com/" },
  { value: "youtube", label: "YouTube", icon: "🎬", prefix: "https://youtube.com/" },
  { value: "tiktok", label: "TikTok", icon: "🎵", prefix: "https://tiktok.com/@" },
  { value: "email", label: "Email", icon: "📧", prefix: "mailto:" },
  { value: "website", label: "Website", icon: "🌐", prefix: "" },
  { value: "custom", label: "Custom", icon: "🔗", prefix: "" },
];

interface SocialLink {
  platform: string;
  label: string;
  url: string;
  order: number;
}

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [tagline_en, setTaglineEn] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPublicId, setAvatarPublicId] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // New social link form
  const [newPlatform, setNewPlatform] = useState("whatsapp");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, "portfolio", "profile"));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setName(data.name || "");
          setTagline(data.tagline || "");
          setTaglineEn(data.tagline_en || "");
          setAvatarUrl(data.avatarUrl || "");
          setAvatarPublicId(data.avatarPublicId || "");
          setSocialLinks(data.socialLinks || []);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "portfolio", "profile"), {
        name,
        tagline,
        tagline_en,
        avatarUrl,
        avatarPublicId,
        socialLinks,
      });
      showToast("success", "Profil berhasil disimpan!");
    } catch (err) {
      console.error("Error saving profile:", err);
      showToast("error", "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = () => {
    if (!newUrl.trim()) return;
    const platform = PLATFORM_OPTIONS.find((p) => p.value === newPlatform);
    const link: SocialLink = {
      platform: newPlatform,
      label: newLabel.trim() || platform?.label || "Link",
      url: newUrl.trim(),
      order: socialLinks.length,
    };
    setSocialLinks([...socialLinks, link]);
    setNewPlatform("whatsapp");
    setNewLabel("");
    setNewUrl("");
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const moveSocialLink = (index: number, direction: "up" | "down") => {
    const newLinks = [...socialLinks];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLinks.length) return;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    newLinks.forEach((link, i) => (link.order = i));
    setSocialLinks(newLinks);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin  h-8 w-8 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg lg:text-xl font-semibold text-foreground tracking-tight">Profil & Sosial Media</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola informasi profil dan link sosial media.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-accent text-accent-foreground text-sm font-semibold  hover:bg-accent/90 disabled:opacity-70 transition-all shadow-md hover:shadow-accent/20 active:scale-95"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {/* Basic Info */}
      <AdminCard title="Informasi Dasar" description="Nama, tagline, dan foto profil yang tampil di homepage.">
        <div className="space-y-6">
          <AdminFormField
            label="Nama Lengkap"
            value={name}
            onChange={setName}
            placeholder="Muhammad Farhan"
            required
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AdminFormField
              label="Tagline (ID)"
              type="textarea"
              value={tagline}
              onChange={setTagline}
              rows={3}
              placeholder="Fullstack Developer & UI/UX Designer..."
              maxLength={200}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">Tagline (EN)</label>
                <AITranslateButton text={tagline} onTranslated={setTaglineEn} />
              </div>
              <textarea
                value={tagline_en}
                onChange={(e) => setTaglineEn(e.target.value)}
                rows={3}
                placeholder="Fullstack Developer & UI/UX Designer (English)..."
                maxLength={200}
                className="w-full p-3.5  bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
              />
            </div>
          </div>
          <ImageCropper
            currentImageUrl={avatarUrl}
            onCropComplete={(url, publicId) => {
              setAvatarUrl(url);
              setAvatarPublicId(publicId);
              showToast("success", "Foto profil berhasil diupload!");
            }}
            aspectRatio={21/9}
            outputSize={1200}
            folder="portfolio/profile"
          />
        </div>
      </AdminCard>

      {/* Social Links */}
      <AdminCard title="Social Links" description="Link sosial media yang tampil di homepage. Bisa ditambah, dihapus, dan diurutkan.">
        <div className="space-y-6">
          {/* Existing links */}
          {socialLinks.length > 0 && (
            <div className="space-y-2">
              {socialLinks.map((link, index) => {
                const platform = PLATFORM_OPTIONS.find((p) => p.value === link.platform);
                return (
                   <div
                    key={index}
                    className="flex items-center gap-3 p-2.5  border border-border/50 bg-muted/10 group"
                  >
                    <span className="text-base flex-shrink-0 w-8 h-8 flex items-center justify-center bg-background  shadow-sm">{platform?.icon || "🔗"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{link.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveSocialLink(index, "up")}
                        disabled={index === 0}
                        className="p-1.5  hover:bg-background disabled:opacity-20"
                        title="Pindah ke atas"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSocialLink(index, "down")}
                        disabled={index === socialLinks.length - 1}
                        className="p-1.5  hover:bg-background disabled:opacity-20"
                        title="Pindah ke bawah"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        className="p-1.5  hover:bg-red-500/10 text-red-500"
                        title="Hapus"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new link */}
          <div className="p-4  border border-dashed border-border space-y-3">
            <p className="text-sm font-medium text-foreground">Tambah Social Link</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={newPlatform}
                onChange={(e) => {
                  setNewPlatform(e.target.value);
                  const p = PLATFORM_OPTIONS.find((p) => p.value === e.target.value);
                  if (p && p.value !== "custom") setNewLabel(p.label);
                }}
                className="p-3  bg-background/50 border border-border focus:border-accent outline-none text-sm"
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (opsional)"
                className="p-3  bg-background/50 border border-border focus:border-accent outline-none text-sm placeholder:text-muted-foreground/50"
              />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL atau username"
                className="p-3  bg-background/50 border border-border focus:border-accent outline-none text-sm placeholder:text-muted-foreground/50"
              />
            </div>
            <button
              type="button"
              onClick={addSocialLink}
              disabled={!newUrl.trim()}
              className="px-5 py-2.5 text-sm font-medium bg-accent/10 text-accent  border border-accent/20 hover:bg-accent/20 disabled:opacity-50 transition-all"
            >
              + Tambah Link
            </button>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
