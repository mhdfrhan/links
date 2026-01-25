"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "./components/ThemeToggle";
import { ProfileHeader } from "./components/ProfileHeader";
import { SocialLinks } from "./components/SocialLinks";
import { AboutSection } from "./components/AboutSection";
import { ExperienceSection } from "./components/ExperienceSection";
import { EducationSection } from "./components/EducationSection";
import { AwardsSection } from "./components/AwardsSection";
import { SkillsSection } from "./components/SkillsSection";
import { CertificationsSection } from "./components/CertificationsSection";
import { Footer } from "./components/Footer";

// CV Data
const aboutText = "Saya adalah mahasiswa Teknik Informatika di Universitas Muhammadiyah Riau dengan minat dan keahlian di bidang pengembangan website. Sejak lulus dari SMKN 2 Pekanbaru jurusan Rekayasa Perangkat Lunak, saya telah berpengalaman mengerjakan berbagai proyek pengembangan website, baik sebagai magang maupun freelancer, di tingkat lokal maupun nasional.";

const workExperience = [
  {
    title: "Web Developer Intern",
    company: "PT Netviro",
    period: "2022 – 2023",
    points: [
      "Mendesain dan mengembangkan website yang responsif, interaktif, dan user-friendly untuk berbagai klien",
      "Berkolaborasi dengan tim untuk memastikan website sesuai dengan kebutuhan bisnis dan standar kualitas",
      "Menerima umpan balik dari klien dan menerapkannya untuk meningkatkan kualitas website"
    ]
  },
  {
    title: "Freelance Web Developer",
    company: "Self-employed",
    period: "2023 – Sekarang",
    points: [
      "Membuat berbagai website untuk klien dari berbagai industri",
      "Menggunakan berbagai keterampilan dan teknologi untuk memenuhi kebutuhan klien",
      "Menerima umpan balik dari klien dan menerapkannya untuk meningkatkan kualitas website"
    ]
  }
];

const organizationExperience = [
  {
    title: "Divisi Kominfo (Komunikasi dan Informasi)",
    company: "HIMATIF UMRI",
    period: "2023 – 2024",
    points: [
      "Membuat desain flyer sebagai media informasi untuk kegiatan himpunan",
      "Mendesain konten Instagram himpunan untuk meningkatkan engagement",
      "Mengembangkan website himpunan untuk mendukung kegiatan organisasi"
    ]
  },
  {
    title: "Divisi PSDM Ristek",
    company: "HIMATIF UMRI",
    period: "2024 – Sekarang",
    points: [
      "Menyelenggarakan workshop dan seminar untuk meningkatkan softskill dan hardskill mahasiswa",
      "Mengorganisir kegiatan olahraga antar mahasiswa untuk membangun team building",
      "Mengadakan kompetisi internal di bidang teknologi informasi dan olahraga"
    ]
  }
];

const committeeExperience = [
  {
    title: "Penanggung Jawab Lomba UI/UX Design",
    company: "NIFC 3.0 (Tingkat Nasional)",
    period: "Feb 2024 – Mei 2024",
    points: [
      "Mengelola dan menjadi penanggung jawab lomba UI/UX Design Tingkat Nasional",
      "Berkoordinasi dengan tim juri profesional untuk evaluasi desain"
    ]
  },
  {
    title: "Penanggung Jawab Lomba Web Development",
    company: "NIFC 4.0 (Tingkat Nasional)",
    period: "Apr 2025 – Jun 2025",
    points: [
      "Mengelola dan mengkoordinasikan lomba Web Development tingkat nasional",
      "Menyusun format kompetisi, timeline, dan kriteria penilaian"
    ]
  },
  {
    title: "Pemateri Workshop",
    company: "Workshop Web Development SMK",
    period: "23 Juni 2025",
    points: [
      '"Development by Implementing Bootstrap and Laravel"'
    ]
  }
];

const education = [
  {
    institution: "Universitas Muhammadiyah Riau",
    period: "2023 – Sekarang",
    degree: "S1 Teknik Informatika",
    note: "Penerima Beasiswa Pemerintah Provinsi Riau (Semester 3 – 8, 2024–2027)"
  },
  {
    institution: "SMKN 2 Pekanbaru",
    period: "2020 – 2023",
    degree: "Rekayasa Perangkat Lunak",
    note: "Siswa Berprestasi dan Menjadi Siswa Teknologi 2023"
  }
];

const awards = [
  { title: "Mahasiswa Berprestasi Universitas Muhammadiyah Riau", year: "2025", highlight: true },
  { title: "Lolos Pendanaan P2MW 2025 di Universitas Tidar Magelang", year: "2025", highlight: true },
  { title: "Juara 3 Lomba Nasional Web Design - Universitas Muhammadiyah Semarang", year: "2025" },
  { title: "Finalis Web Development Informatics Festival - Universitas Atma Jaya Yogyakarta", year: "2025" },
  { title: "Mahasiswa Berprestasi Universitas Muhammadiyah Riau", year: "2024", highlight: true },
  { title: "Juara 1 Web Development PERMIKOMNAS", year: "2024", highlight: true },
  { title: "Finalis Web Development INSYFEST - UBP Karawang", year: "2024" },
  { title: "Juara 2 Lomba Nasional Web Design UMRI", year: "2024" },
  { title: "Juara 1 Lomba Nasional Web Design AI - Universitas Aisyiyah Surakarta", year: "2023", highlight: true },
  { title: "Juara 3 Lomba Nasional Web Development IEC 2023 - Universitas Negeri Jakarta", year: "2023" },
  { title: "Sertifikasi Kompetensi BSNP KKNI II RPL", year: "2023" },
  { title: "Siswa Teknologi SMKN 2 Pekanbaru", year: "2023" },
  { title: "Juara 2 Web Design Tingkat Nasional (IT Olimpiade)", year: "2022" },
  { title: "Juara 1 Web Design Tingkat Provinsi (Computer Science Festival)", year: "2022" }
];

const certifications = [
  {
    title: "Belajar Dasar Manajemen Proyek",
    issuer: "Dicoding",
    date: "21 Agustus 2024",
    verifyUrl: "https://www.dicoding.com/certificates/2VX3R3V0QZYQ",
    validUntil: "21 Agustus 2027"
  },
  {
    title: "Software Engineering",
    issuer: "RevoU",
    date: "7 Juni 2024"
  },
  {
    title: "Belajar Dasar Visualisasi Data",
    issuer: "Dicoding",
    date: "21 Mei 2024",
    verifyUrl: "https://www.dicoding.com/certificates/4EXGQK7M9ZRL",
    validUntil: "21 Mei 2027"
  },
  {
    title: "Junior Web Developer - VSGA",
    issuer: "Digital Talent Scholarship Kominfo",
    date: "Juni – Juli 2023"
  },
  {
    title: "Coding Camp Front End Developer",
    issuer: "Harisenin Coding Camp",
    date: "08 Desember 2023"
  }
];

const skills = [
  {
    title: "Tech Stack",
    skills: [
      { name: "PHP" },
      { name: "JavaScript" },
      { name: "Laravel" },
      { name: "Livewire" },
      { name: "React.js" },
      { name: "Next.js" },
      { name: "TailwindCSS" },
      { name: "Bootstrap" },
      { name: "MySQL" },
      { name: "jQuery" }
    ]
  },
  {
    title: "Soft Skills",
    skills: [
      { name: "Komunikasi" },
      { name: "Kerjasama Tim" },
      { name: "Problem Solving" },
      { name: "Berpikir Kritis" }
    ]
  },
  {
    title: "Tools",
    skills: [
      { name: "Microsoft Office" },
      { name: "Canva" },
      { name: "Figma" },
      { name: "Git" }
    ]
  }
];

// Icons
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-400/10 dark:bg-emerald-400/15 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div 
          className="absolute inset-0 opacity-[0.3] dark:opacity-[0.2]"
          style={{
            backgroundImage: `radial-gradient(circle, var(--accent) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main content */}
      <main className="relative flex flex-col items-center min-h-screen px-4 py-8 md:py-12">
        {/* Theme toggle */}
        <motion.div
          className="fixed top-4 right-4 md:top-6 md:right-6 z-50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ThemeToggle />
        </motion.div>

        {/* Content container */}
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-10 pt-8 pb-12">
          {/* Profile header */}
          <ProfileHeader
            name="Muhammad Farhan"
            tagline="🎓 Teknik Informatika Student | 💻 Freelance Fullstack Developer 🌟"
            avatarUrl="/img/foto.jpg"
          />

          {/* Social links */}
          <SocialLinks
            whatsappNumber="6283173633639"
            instagramUsername="mhdfarhan04"
            linkedinUrl="https://www.linkedin.com/in/muhammad-farhan-79ba79294/"
          />

          {/* About section */}
          <AboutSection text={aboutText} />

          {/* Work Experience */}
          <ExperienceSection
            title="Pengalaman Kerja"
            icon={<BriefcaseIcon />}
            items={workExperience}
          />

          {/* Organization Experience */}
          <ExperienceSection
            title="Pengalaman Organisasi"
            icon={<UsersIcon />}
            items={organizationExperience}
          />

          {/* Committee Experience */}
          <ExperienceSection
            title="Pengalaman Kepanitiaan"
            icon={<CalendarIcon />}
            items={committeeExperience}
          />

          {/* Education */}
          <EducationSection items={education} />

          {/* Awards */}
          <AwardsSection awards={awards} />

          {/* Certifications */}
          <CertificationsSection certifications={certifications} />

          {/* Skills */}
          <SkillsSection categories={skills} />
        </div>

        {/* Footer */}
        <Footer name="Muhammad Farhan" />
      </main>
    </div>
  );
}
