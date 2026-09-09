"use client";

import { LanguageProvider } from "./contexts/LanguageContext";
import { UserProvider } from "./contexts/UserContext";
import { JobDescriptionProvider } from "./contexts/JobDescriptionContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <JobDescriptionProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </JobDescriptionProvider>
    </UserProvider>
  );
}
