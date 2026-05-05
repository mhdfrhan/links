import { Project } from "../app/components/PortfolioSection";

export const dummyProjects: Project[] = [
  {
    id: "p1",
    title: "E-Commerce Dashboard",
    description: "Sistem manajemen admin untuk toko online dengan fitur analitik real-time dan manajemen inventaris.",
    fullDescription: "Proyek ini adalah sebuah dashboard admin komprehensif yang dibangun untuk memudahkan pemilik toko online dalam mengelola penjualan, inventaris, dan pelanggan.\n\nFitur Utama:\n- Analitik penjualan real-time menggunakan chart dinamis.\n- Manajemen stok produk dengan peringatan otomatis jika stok menipis.\n- Integrasi dengan payment gateway untuk pelacakan transaksi otomatis.\n- Sistem autentikasi multi-role (Admin, Manager, Staff).",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Firebase", "Recharts"],
    link: "https://github.com/mhdfarhan"
  },
  {
    id: "p2",
    title: "Aplikasi POS Kedai Kopi",
    description: "Aplikasi kasir berbasis web yang responsif untuk kedai kopi, mendukung pencetakan struk thermal.",
    fullDescription: "Aplikasi Point of Sale (POS) yang dirancang khusus untuk bisnis F&B, khususnya kedai kopi. Dibuat dengan antarmuka yang sangat responsif agar bisa diakses dari tablet maupun smartphone kasir.\n\nFitur Utama:\n- Manajemen menu dan kategori yang mudah disesuaikan.\n- Dukungan untuk cetak struk menggunakan printer thermal bluetooth.\n- Laporan shift dan rekap harian otomatis.\n- Fitur manajemen meja dan pesanan dine-in/takeaway.",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000",
    techStack: ["React", "Laravel", "MySQL", "Bootstrap", "PWA"],
    link: "https://github.com/mhdfarhan"
  },
  {
    id: "p3",
    title: "Sistem Informasi Akademik",
    description: "Sistem akademik terpadu untuk sekolah menengah, meliputi manajemen nilai, absensi, dan jadwal.",
    fullDescription: "SIAKAD (Sistem Informasi Akademik) adalah solusi digital untuk digitalisasi proses administrasi sekolah. Membantu guru, siswa, dan orang tua untuk terhubung dalam satu platform.\n\nFitur Utama:\n- Portal Siswa untuk melihat jadwal, nilai, dan absensi.\n- Portal Guru untuk input nilai e-Rapor dan manajemen kelas.\n- Fitur notifikasi WhatsApp otomatis untuk orang tua jika siswa absen.\n- Export laporan ke PDF dan Excel.",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000",
    techStack: ["PHP", "CodeIgniter", "jQuery", "MySQL", "REST API"],
  },
  {
    id: "p4",
    title: "Company Profile Web",
    description: "Website company profile modern dengan animasi interaktif dan CMS terintegrasi.",
    fullDescription: "Website profil perusahaan yang dirancang dengan estetika modern, fokus pada performa, dan animasi scroll yang halus untuk memberikan kesan profesional.\n\nFitur Utama:\n- Animasi GSAP ScrollTrigger yang memukau.\n- Halaman blog dinamis yang dikelola via CMS headless.\n- SEO optimized dengan skor Lighthouse 100/100.\n- Form kontak terintegrasi dengan email notifikasi.",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000",
    techStack: ["Next.js", "Framer Motion", "Tailwind CSS", "Sanity CMS"],
    link: "https://github.com/mhdfarhan"
  }
];

export const staticAboutText = "Saya adalah mahasiswa Teknik Informatika di Universitas Muhammadiyah Riau dengan minat dan keahlian di bidang pengembangan website. Sejak lulus dari SMKN 2 Pekanbaru jurusan Rekayasa Perangkat Lunak, saya telah berpengalaman mengerjakan berbagai proyek pengembangan website, baik sebagai magang maupun freelancer, di tingkat lokal maupun nasional.";

export const staticExperiences = [
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

export const staticOrganizationExperience = [
  {
    title: "Divisi Kominfo (Komunikasi dan Informasi)",
    company: "HM-TIFUMRI",
    period: "2023 – 2024",
    points: [
      "Membuat desain flyer sebagai media informasi untuk kegiatan himpunan",
      "Mendesain konten Instagram himpunan untuk meningkatkan engagement",
      "Mengembangkan website himpunan untuk mendukung kegiatan organisasi"
    ]
  },
  {
    title: "Divisi PSDM Ristek",
    company: "HM-TIFUMRI",
    period: "2024 – Sekarang",
    points: [
      "Menyelenggarakan workshop dan seminar untuk meningkatkan softskill dan hardskill mahasiswa",
      "Mengorganisir kegiatan olahraga antar mahasiswa untuk membangun team building",
      "Mengadakan kompetisi internal di bidang teknologi informasi dan olahraga"
    ]
  }
];

export const staticCommitteeExperience = [
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

export const staticEducation = [
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

export const staticAwards = [
  { title: "Mahasiswa Berprestasi Universitas Muhammadiyah Riau", year: "2025", highlight: true },
  { title: "Lolos Pendanaan dan KMI EXPO P2MW 2025 di Universitas Tidar Magelang", year: "2025", highlight: true },
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

export const staticCertifications = [
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

export const staticSkills = [
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
