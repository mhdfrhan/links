"use client";

import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
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

export function usePortfolioData() {
  const [data, setData] = useState({
    about: staticAboutText,
    projects: dummyProjects,
    experiences: staticExperiences,
    organizationExperience: staticOrganizationExperience,
    committeeExperience: staticCommitteeExperience,
    education: staticEducation,
    awards: staticAwards,
    certifications: staticCertifications,
    skills: staticSkills,
    profile: null as any,
    categories: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Parallel fetching using Promise.all
        const [
          aboutDoc,
          projectsSnap,
          expSnap,
          orgSnap,
          comSnap,
          eduSnap,
          awardsSnap,
          certSnap,
          skillsSnap,
          profileDoc,
          categoriesSnap
        ] = await Promise.all([
          getDoc(doc(db, "portfolio", "about")),
          getDocs(collection(db, "projects")),
          getDocs(query(collection(db, "experiences"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "organizationExperience"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "committeeExperience"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "education"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "awards"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "certifications"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "skills"), orderBy("order", "asc"))),
          getDoc(doc(db, "portfolio", "profile")),
          getDocs(query(collection(db, "categories"), orderBy("order", "asc")))
        ]);

        if (!isMounted) return;

        const about = aboutDoc.exists() && aboutDoc.data().text ? aboutDoc.data().text : staticAboutText;
        const projects = (projectsSnap.empty ? dummyProjects : projectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)))
          .sort((a, b) => (b.order || 0) - (a.order || 0));
        const experiences = expSnap.empty ? staticExperiences : expSnap.docs.map(d => d.data() as any);
        const organizationExperience = orgSnap.empty ? staticOrganizationExperience : orgSnap.docs.map(d => d.data() as any);
        const committeeExperience = comSnap.empty ? staticCommitteeExperience : comSnap.docs.map(d => d.data() as any);
        const education = eduSnap.empty ? staticEducation : eduSnap.docs.map(d => d.data() as any);
        const awards = awardsSnap.empty ? staticAwards : awardsSnap.docs.map(d => d.data() as any);
        const certifications = certSnap.empty ? staticCertifications : certSnap.docs.map(d => d.data() as any);
        const skills = skillsSnap.empty ? staticSkills : skillsSnap.docs.map(d => d.data() as any);
        const profile = profileDoc.exists() ? profileDoc.data() : null;
        const categories = categoriesSnap.empty ? [] : categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        setData({
          about,
          projects,
          experiences,
          organizationExperience,
          committeeExperience,
          education,
          awards,
          certifications,
          skills,
          profile,
          categories
        });
      } catch (error) {
        console.error("Error fetching portfolio data from Firebase:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  return { data, loading };
}
