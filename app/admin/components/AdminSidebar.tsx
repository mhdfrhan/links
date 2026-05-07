"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  TagIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";

type SubItem = {
  name: string;
  href: string;
};

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Squares2X2Icon },
  { 
    name: "Profil", 
    icon: UserIcon,
    subItems: [
      { name: "Profil & Sosial", href: "/admin/profile" },
      { name: "Tentang Saya", href: "/admin/about" }
    ]
  },
  { 
    name: "Portofolio", 
    icon: DocumentTextIcon,
    subItems: [
      { name: "Semua Projek", href: "/admin/projects" },
      { name: "Kategori Projek", href: "/admin/categories" }
    ]
  },
  { name: "Pengalaman", href: "/admin/experiences", icon: BriefcaseIcon },
  { name: "Pendidikan", href: "/admin/education", icon: AcademicCapIcon },
  { name: "Penghargaan", href: "/admin/awards", icon: TrophyIcon },
  { name: "Sertifikasi", href: "/admin/certifications", icon: CheckBadgeIcon },
  { name: "Keahlian", href: "/admin/skills", icon: WrenchScrewdriverIcon },
  { name: "Pengaturan", href: "/admin/settings", icon: Cog6ToothIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Auto-open dropdown if active
  useEffect(() => {
    const activeGroup = navItems.find(item => 
      item.subItems?.some(sub => sub.href === pathname)
    );
    if (activeGroup) {
      setOpenDropdowns(prev => ({ ...prev, [activeGroup.name]: true }));
    }
  }, [pathname]);

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className="w-60 flex-shrink-0 hidden lg:flex flex-col border-r border-border/50 bg-background/50 backdrop-blur-md sticky top-16 h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const isGroupActive = item.subItems?.some(sub => sub.href === pathname);
          const isActive = pathname === item.href || isGroupActive;
          const isOpen = openDropdowns[item.name];

          if (item.subItems) {
            return (
              <div key={item.name} className="flex flex-col">
                <button
                  onClick={() => toggleDropdown(item.name)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200 group w-full ${
                    isActive && !isOpen
                      ? "bg-accent/10 text-accent font-semibold" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4.5 h-4.5 transition-colors ${isActive && !isOpen ? "text-accent" : "group-hover:text-accent"}`} />
                    {item.name}
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1 mt-1 ml-5 border-l-2 border-border pl-3 py-1 relative">
                        {item.subItems.map(sub => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.name}
                              href={sub.href}
                              className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200 relative ${
                                isSubActive
                                  ? "bg-accent/10 text-accent font-semibold"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                              }`}
                            >
                              {/* Optional: Add a small horizontal line connecting to the sub-item for better visuals */}
                              {isSubActive && (
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-accent" />
                              )}
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href!}
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
