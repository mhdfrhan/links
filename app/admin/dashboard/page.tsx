"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import Link from "next/link";
import {
  DocumentTextIcon,
  BriefcaseIcon,
  TrophyIcon,
  CheckBadgeIcon,
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  PlusIcon,
  UserIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

interface Stats {
  projects: number;
  experiences: number;
  orgExperiences: number;
  comExperiences: number;
  education: number;
  awards: number;
  certifications: number;
  skills: number;
  skillCategories: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    projects: 0, experiences: 0, orgExperiences: 0, comExperiences: 0,
    education: 0, awards: 0, certifications: 0, skills: 0, skillCategories: 0,
  });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [
          projSnap, expSnap, orgSnap, comSnap,
          eduSnap, awardSnap, certSnap, skillSnap, profileDoc
        ] = await Promise.all([
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "experiences")),
          getDocs(collection(db, "organizationExperience")),
          getDocs(collection(db, "committeeExperience")),
          getDocs(collection(db, "education")),
          getDocs(collection(db, "awards")),
          getDocs(collection(db, "certifications")),
          getDocs(collection(db, "skills")),
          getDoc(doc(db, "portfolio", "profile")),
        ]);

        if (!isMounted) return;

        let totalSkills = 0;
        skillSnap.docs.forEach((d) => {
          const data = d.data();
          totalSkills += (data.skills?.length || 0);
        });

        setStats({
          projects: projSnap.size,
          experiences: expSnap.size,
          orgExperiences: orgSnap.size,
          comExperiences: comSnap.size,
          education: eduSnap.size,
          awards: awardSnap.size,
          certifications: certSnap.size,
          skills: totalSkills,
          skillCategories: skillSnap.size,
        });

        if (profileDoc.exists()) {
          setProfile(profileDoc.data());
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, []);

  const statCards = [
    { label: "Projek", value: stats.projects, icon: DocumentTextIcon, href: "/admin/projects", color: "text-blue-500 bg-blue-500/10" },
    { label: "Pengalaman", value: stats.experiences + stats.orgExperiences + stats.comExperiences, icon: BriefcaseIcon, href: "/admin/experiences", color: "text-purple-500 bg-purple-500/10" },
    { label: "Pendidikan", value: stats.education, icon: AcademicCapIcon, href: "/admin/education", color: "text-cyan-500 bg-cyan-500/10" },
    { label: "Penghargaan", value: stats.awards, icon: TrophyIcon, href: "/admin/awards", color: "text-amber-500 bg-amber-500/10" },
    { label: "Sertifikasi", value: stats.certifications, icon: CheckBadgeIcon, href: "/admin/certifications", color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Keahlian", value: stats.skills, icon: WrenchScrewdriverIcon, href: "/admin/skills", color: "text-rose-500 bg-rose-500/10" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin  h-8 w-8 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg lg:text-xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Overview konten portfolio kamu.</p>
      </div>

      {/* Profile Quick Preview */}
      <AdminCard>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12  overflow-hidden border border-border/50 bg-muted flex-shrink-0">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">{profile?.name || "Muhammad Farhan"}</h2>
            <p className="text-xs text-muted-foreground truncate">{profile?.tagline || "Belum diatur"}</p>
          </div>
          <Link
            href="/admin/profile"
            className="px-3 py-1.5 text-xs font-medium text-accent bg-accent/10  border border-accent/20 hover:bg-accent/20 transition-all flex-shrink-0"
          >
            Edit Profil
          </Link>
        </div>
      </AdminCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <AdminCard className="hover:border-accent/30 transition-all hover:shadow-sm group cursor-pointer border-border/50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-1.5  ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
            </AdminCard>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <AdminCard title="Aksi Cepat">
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "Tambah Projek", href: "/admin/projects", icon: PlusIcon },
              { label: "Edit Profil", href: "/admin/profile", icon: UserIcon },
              { label: "Lihat Website", href: "/", icon: ArrowTopRightOnSquareIcon, external: true },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
                className="flex items-center justify-between p-3  border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5  bg-accent/10">
                    <action.icon className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors">{action.label}</span>
                </div>
                <PlusIcon className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </AdminCard>

        {/* Experience Breakdown */}
        <AdminCard title="Breakdown Pengalaman">
          <div className="space-y-4 py-1">
            {[
              { label: "Kerja", count: stats.experiences, color: "bg-accent" },
              { label: "Organisasi", count: stats.orgExperiences, color: "bg-blue-500" },
              { label: "Panitia", count: stats.comExperiences, color: "bg-cyan-500" },
            ].map((item) => {
              const total = stats.experiences + stats.orgExperiences + stats.comExperiences;
              const percent = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                    <span className="font-semibold text-foreground">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted  overflow-hidden">
                    <div className={`h-full ${item.color}  transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
