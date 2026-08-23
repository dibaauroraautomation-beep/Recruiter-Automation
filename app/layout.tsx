import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Recruiter_Automation - Post a Job, Hire the Best",
  description:
    "Create a job posting in minutes and get matched with qualified candidates — powered by AI. AI candidate matching, smart ATS screening, automated interviews, and real-time analytics.",
  keywords: [
    "job posting",
    "recruitment",
    "AI hiring",
    "candidate matching",
    "ATS screening",
    "career",
  ],
  openGraph: {
    title: "CareerAI - Post a Job, Hire the Best",
    description:
      "Create a job posting in minutes and get matched with qualified candidates — powered by AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
