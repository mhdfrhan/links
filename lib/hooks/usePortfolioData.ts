"use client";

import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import type { SocialLink } from "../../app/components/SocialLinks";
import { 
  dummyProjects, 
  staticAboutText, 
  staticExperiences, 
  staticOrganizationExperience,
  staticCommitteeExperience,
  staticEducation, 
  staticAwards, 
  staticCertifications, 
  staticSkills 
} from "../data";

export interface CvEntry {
  url: string;
  cloudinaryPublicId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface PortfolioCategory {
  id: string;
  name: string;
  name_en?: string;
  order?: number;
  subCategories?: Array<{ id: string; name: string; name_en?: string }>;
}

export interface PortfolioProfile {
  name?: string;
  tagline?: string;
  tagline_en?: string;
  avatarUrl?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  socialLinks?: SocialLink[];
  [key: string]: unknown;
}

function mapDocsOrFallback<T>(
  snap: Awaited<ReturnType<typeof getDocs>> | null,
  fallback: T,
  includeId = true
): T {
  if (!snap || snap.empty) return fallback;
  return snap.docs.map((d) =>
    includeId
      ? { id: d.id, ...(d.data() as Record<string, unknown>) }
      : (d.data() as Record<string, unknown>)
  ) as unknown as T;
}

export function usePortfolioData() {
  const [data, setData] = useState({
    about: staticAboutText,
    aboutObj: { text: staticAboutText, text_en: "" },
    projects: dummyProjects,
    experiences: staticExperiences,
    organizationExperience: staticOrganizationExperience,
    committeeExperience: staticCommitteeExperience,
    education: staticEducation,
    awards: staticAwards,
    certifications: staticCertifications,
    skills: staticSkills,
    profile: null as PortfolioProfile | null,
    categories: [] as PortfolioCategory[],
    cvData: null as { id?: CvEntry; en?: CvEntry } | null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Parallel fetching using Promise.allSettled so one failing collection doesn't wipe all data
        const results = await Promise.allSettled([
          getDoc(doc(db, "portfolio", "about")),
          getDocs(query(collection(db, "projects"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "experiences"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "organizationExperience"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "committeeExperience"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "education"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "awards"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "certifications"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "skills"), orderBy("order", "asc"))),
          getDoc(doc(db, "portfolio", "profile")),
          getDocs(query(collection(db, "categories"), orderBy("order", "asc"))),
          getDoc(doc(db, "portfolio", "cv")),
        ]);

        if (!isMounted) return;

        const failedCount = results.filter((r) => r.status === "rejected").length;
        if (failedCount > 0) {
          setError(`${failedCount} collection(s) failed to load from Firebase; showing fallback data where needed.`);
        }

        const getVal = <T,>(idx: number): T | null =>
          results[idx].status === "fulfilled"
            ? (results[idx] as PromiseFulfilledResult<T>).value
            : null;

        const aboutDoc = getVal<Awaited<ReturnType<typeof getDoc>>>(0);
        const projectsSnap = getVal<Awaited<ReturnType<typeof getDocs>>>(1);
        const expSnap = getVal<Awaited<ReturnType<typeof getDocs>>>(2);
        const orgSnap = getVal<Awaited<ReturnType<typeof getDocs>>>(3);
        const comSnap = getVal<Awaited<ReturnType<typeof getDocs>>>(4);
        const eduSnap = getVal<Awaited<ReturnType<typeof getDocs>>>(5);
        const awardsSnap = getVal<Awaited<ReturnType<typeof getDocs>>>(6);
        const certSnap = getVal<Awaited<ReturnType<typeof getDocs>>>(7);
        const skillsSnap = getVal<Awaited<ReturnType<typeof getDocs>>>(8);
        const profileDoc = getVal<Awaited<ReturnType<typeof getDoc>>>(9);
        const categoriesSnap = getVal<Awaited<ReturnType<typeof getDocs>>>(10);
        const cvDoc = getVal<Awaited<ReturnType<typeof getDoc>>>(11);

        const aboutData = aboutDoc?.exists() ? (aboutDoc.data() as Record<string, unknown>) : null;
        const about = typeof aboutData?.text === "string" && aboutData.text ? aboutData.text : staticAboutText;
        const aboutObj = aboutData
          ? {
              text: typeof aboutData.text === "string" ? aboutData.text : "",
              text_en: typeof aboutData.text_en === "string" ? aboutData.text_en : "",
            }
          : { text: staticAboutText, text_en: "" };
        const projects = mapDocsOrFallback(projectsSnap, dummyProjects);
        const experiences = mapDocsOrFallback(expSnap, staticExperiences);
        const organizationExperience = mapDocsOrFallback(orgSnap, staticOrganizationExperience);
        const committeeExperience = mapDocsOrFallback(comSnap, staticCommitteeExperience);
        const education = mapDocsOrFallback(eduSnap, staticEducation);
        const awards = mapDocsOrFallback(awardsSnap, staticAwards);
        const certifications = mapDocsOrFallback(certSnap, staticCertifications);
        const skills = mapDocsOrFallback(skillsSnap, staticSkills, false);
        const profile = profileDoc?.exists() ? (profileDoc.data() as PortfolioProfile) : null;
        const categories = mapDocsOrFallback<PortfolioCategory[]>(categoriesSnap, []);
        const cvData = cvDoc?.exists() ? (cvDoc.data() as { id?: CvEntry; en?: CvEntry }) : null;

        setData({
          about,
          aboutObj,
          projects,
          experiences,
          organizationExperience,
          committeeExperience,
          education,
          awards,
          certifications,
          skills,
          profile,
          categories,
          cvData,
        });
      } catch (err) {
        console.error("Error fetching portfolio data from Firebase:", err);
        if (isMounted) setError("Failed to load portfolio data from Firebase.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  return { data, loading, error };
}
