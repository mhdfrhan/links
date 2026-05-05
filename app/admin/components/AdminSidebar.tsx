"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Squares2X2Icon, 
  UserIcon, 
  ChatBubbleBottomCenterTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  TrophyIcon,
  CheckBadgeIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Squares2X2Icon },
  { name: "Profil & Sosial", href: "/admin/profile", icon: UserIcon },
  { name: "Tentang Saya", href: "/admin/about", icon: ChatBubbleBottomCenterTextIcon },
  { name: "Portofolio", href: "/admin/projects", icon: DocumentTextIcon },
  { name: "Pengalaman", href: "/admin/experiences", icon: BriefcaseIcon },
  { name: "Pendidikan", href: "/admin/education", icon: AcademicCapIcon },
  { name: "Penghargaan", href: "/admin/awards", icon: TrophyIcon },
  { name: "Sertifikasi", href: "/admin/certifications", icon: CheckBadgeIcon },
  { name: "Keahlian", href: "/admin/skills", icon: WrenchScrewdriverIcon },
  { name: "Pengaturan", href: "/admin/settings", icon: Cog6ToothIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 hidden lg:flex flex-col border-r border-border/50 bg-background/50 backdrop-blur-md sticky top-16 h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group ${
                isActive 
                  ? "bg-accent/10 text-accent font-semibold" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-accent" : "group-hover:text-accent"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-border/50">
        <button
          onClick={() => signOut(auth)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-500/5 hover:text-red-500 transition-all duration-200 group"
        >
          <ArrowRightOnRectangleIcon className="w-4.5 h-4.5 group-hover:text-red-500" />
          Logout
        </button>
      </div>
    </aside>
  );
}
