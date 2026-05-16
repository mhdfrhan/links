"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </NextThemesProvider>
  );
}
