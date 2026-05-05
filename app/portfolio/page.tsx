import Link from "next/link";
import { PortfolioSection } from "../components/PortfolioSection";
import { dummyProjects } from "../../lib/data";

export default function PortfolioPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground py-12 px-4 md:px-8 max-w-5xl mx-auto">
      <Link 
        href="/"
        className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-accent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Kembali ke Beranda
      </Link>

      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Semua Projek</h1>
        <p className="text-lg text-muted-foreground">
          Kumpulan hasil karya dan proyek yang pernah saya kerjakan.
        </p>
      </div>

      <PortfolioSection projects={dummyProjects} showAllButton={false} />
    </div>
  );
}
