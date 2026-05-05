"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, collection } from "firebase/firestore";
import {
  staticAboutText,
  staticExperiences,
  staticOrganizationExperience,
  staticCommitteeExperience,
  staticEducation,
  staticAwards,
  staticCertifications,
  staticSkills
} from "@/lib/data";

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const seedData = async () => {
    setLoading(true);
    setStatus("Memulai seed data...");

    try {
      // 1. Seed Profile
      setStatus("Seeding Profile...");
      await setDoc(doc(db, "portfolio", "profile"), {
        name: "Muhammad Farhan",
        tagline: "🎓 Teknik Informatika Student | 💻 Freelance Fullstack Developer 🌟",
        avatarUrl: "/img/foto.jpg",
        socialLinks: [
          { platform: "whatsapp", label: "WhatsApp", url: "6283173633639", order: 0 },
          { platform: "instagram", label: "Instagram", url: "mhdfarhan04", order: 1 },
          { platform: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/muhammad-farhan-79ba79294/", order: 2 }
        ]
      });

      // 2. Seed About
      setStatus("Seeding About...");
      await setDoc(doc(db, "portfolio", "about"), {
        text: staticAboutText
      });

      // 3. Seed Experiences
      setStatus("Seeding Experiences...");
      for (let i = 0; i < staticExperiences.length; i++) {
        await setDoc(doc(collection(db, "experiences")), {
          ...staticExperiences[i],
          order: i
        });
      }

      // 4. Seed Organization
      setStatus("Seeding Organization Experiences...");
      for (let i = 0; i < staticOrganizationExperience.length; i++) {
        await setDoc(doc(collection(db, "organizationExperience")), {
          ...staticOrganizationExperience[i],
          order: i
        });
      }

      // 5. Seed Committee
      setStatus("Seeding Committee Experiences...");
      for (let i = 0; i < staticCommitteeExperience.length; i++) {
        await setDoc(doc(collection(db, "committeeExperience")), {
          ...staticCommitteeExperience[i],
          order: i
        });
      }

      // 6. Seed Education
      setStatus("Seeding Education...");
      for (let i = 0; i < staticEducation.length; i++) {
        await setDoc(doc(collection(db, "education")), {
          ...staticEducation[i],
          order: i
        });
      }

      // 7. Seed Awards
      setStatus("Seeding Awards...");
      for (let i = 0; i < staticAwards.length; i++) {
        await setDoc(doc(collection(db, "awards")), {
          ...staticAwards[i],
          order: i
        });
      }

      // 8. Seed Certifications
      setStatus("Seeding Certifications...");
      for (let i = 0; i < staticCertifications.length; i++) {
        await setDoc(doc(collection(db, "certifications")), {
          ...staticCertifications[i],
          order: i
        });
      }

      // 9. Seed Skills
      setStatus("Seeding Skills...");
      for (let i = 0; i < staticSkills.length; i++) {
        await setDoc(doc(collection(db, "skills")), {
          ...staticSkills[i],
          order: i
        });
      }

      // NOTE: Projects (Portfolio) is intentionally skipped as requested

      setStatus("✅ SEEDING BERHASIL! Silakan cek website utama.");
    } catch (error: any) {
      console.error(error);
      setStatus("❌ ERROR: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Seed Data ke Firebase</h1>
      <p className="text-muted-foreground text-sm">
        Script ini akan mengambil semua data statis (kecuali Projek/Portfolio yang dibiarkan kosong) dan memasukkannya ke database Firestore Anda. 
        Tolong klik SATU KALI saja agar datanya tidak ganda.
      </p>

      <button
        onClick={seedData}
        disabled={loading}
        className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading ? "Sedang Memproses..." : "Mulai Seed Data"}
      </button>

      {status && (
        <div className="p-4 bg-muted/50 rounded-xl font-mono text-sm">
          {status}
        </div>
      )}
    </div>
  );
}
