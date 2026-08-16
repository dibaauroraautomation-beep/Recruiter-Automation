"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/contexts/UserContext";

type Lang = "en" | "de";

const t: Record<Lang, Record<string, string>> = {
  en: {
    badge: "AI-Powered Career Tools",
    hero_title_1: "Optimize Your Resume,",
    hero_title_2: "Ace Your Interview",
    hero_desc: "Smart tools to analyze your resume, generate cover letters, and practice interviews \u2014 all powered by AI.",
    login: "Login",
    dashboard: "Dashboard",
    about: "About",
    section_title: "Everything you need",
    section_desc: "Powerful tools to help you land your dream job",
    feature_1_title: "ATS Resume Analysis",
    feature_1_desc: "Upload your resume and get instant ATS compatibility scores with actionable improvement suggestions.",
    feature_2_title: "Cover Letter Generator",
    feature_2_desc: "Generate tailored, professional cover letters matched to any job description in seconds.",
    feature_3_title: "Interview Prep AI",
    feature_3_desc: "Practice with AI-powered mock interviews tailored to your resume and target job description.",
    feature_4_title: "Job Tracker",
    feature_4_desc: "Track your job applications, monitor resume performance, and manage your career progress.",
    footer_copy: "\u00A9 2026 CareerAI. All rights reserved.",
  },
  de: {
    badge: "KI-gest\u00fctzte Karriere-Tools",
    hero_title_1: "Optimieren Sie Ihren Lebenslauf,",
    hero_title_2: "Bestehen Sie Ihr Vorstellungsgespr\u00e4ch",
    hero_desc: "Intelligente Tools zur Analyse Ihres Lebenslaufs, zur Erstellung von Anschreiben und zur Vorbereitung auf Vorstellungsgespr\u00e4che \u2014 alle von KI unterst\u00fctzt.",
    login: "Anmelden",
    dashboard: "Dashboard",
    about: "\u00DCber uns",
    section_title: "Alles was Sie brauchen",
    section_desc: "Leistungsstarke Tools, die Ihnen helfen, Ihren Traumjob zu bekommen",
    feature_1_title: "ATS-Lebenslaufanalyse",
    feature_1_desc: "Laden Sie Ihren Lebenslauf hoch und erhalten Sie sofortige ATS-Kompatibilit\u00e4tswerte mit umsetzbaren Verbesserungsvorschl\u00e4gen.",
    feature_2_title: "Anschreiben-Generator",
    feature_2_desc: "Erstellen Sie ma\u00dfgeschneiderte, professionelle Anschreiben, die auf jede Stellenbeschreibung abgestimmt sind.",
    feature_3_title: "Interview-Vorbereitung KI",
    feature_3_desc: "\u00DCben Sie mit KI-gest\u00fctzten Vorstellungsgespr\u00e4chen, die auf Ihren Lebenslauf zugeschnitten sind.",
    feature_4_title: "Job-Tracker",
    feature_4_desc: "Verfolgen Sie Ihre Bewerbungen, \u00fcberwachen Sie die Leistung Ihres Lebenslaufs und verwalten Sie Ihren Karrierefortschritt.",
    footer_copy: "\u00A9 2026 CareerAI. Alle Rechte vorbehalten.",
  },
};

const features = [
  { titleKey: "feature_1_title", descKey: "feature_1_desc", icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg> },
  { titleKey: "feature_2_title", descKey: "feature_2_desc", icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg> },
  { titleKey: "feature_3_title", descKey: "feature_3_desc", icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg> },
  { titleKey: "feature_4_title", descKey: "feature_4_desc", icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
];





export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const cardsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, setUser } = useUser();
  console.log("user.WebHook_Ur:", user.WebHook_Url);

  const selectUser = (userName: { name: string; WebHook_Url: Record<string, string> }) => {
    localStorage.removeItem("userEmail");
    setUser({ ...user, name: userName.name, WebHook_Url: userName.WebHook_Url });
    router.push("/pages/Dashboard");
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-6");
          }
        });
      },
      { threshold: 0.15 }
    );

    const cards = cardsRef.current?.querySelectorAll(".feature-card");
    cards?.forEach((card, i) => {
      (card as HTMLElement).style.transitionDelay = `${i * 120}ms`;
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2 3 7v6c0 4.5 3.8 8.3 9 9 5.2-.7 9-4.5 9-9V7l-9-5Zm0 4.2 5 2.8v4c0 3-2.2 5.6-5 6.1-2.8-.5-5-3.1-5-6.1V9l5-2.8Z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">CareerAI</span>
          </div>
          <button
            onClick={() => setLang(lang === "en" ? "de" : "en")}
            className="flex items-center text-xs font-semibold rounded-lg border border-blue-500 bg-white hover:bg-blue-50 transition shrink-0 overflow-hidden"
          >
            <span className={"px-2.5 py-1 border-r border-blue-200 " + (lang === "en" ? "bg-blue-500 text-white" : "text-blue-500")}>EN</span>
            <span className={"px-2.5 py-1 " + (lang === "de" ? "bg-blue-500 text-white" : "text-blue-500")}>DE</span>
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-block px-3 py-1 mb-6 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full border border-indigo-100">
          {t[lang].badge}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight max-w-3xl mx-auto">
          {t[lang].hero_title_1}<br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t[lang].hero_title_2}</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          {t[lang].hero_desc}
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href="pages/login"
            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition shadow-sm"
          >
            {t[lang].login}
          </Link>
          <Link
            href="pages/about"
            className="px-6 py-3 text-sm font-semibold text-slate-600 hover:text-slate-800 transition"
          >
            {t[lang].about}
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">{t[lang].section_title}</h2>
          <p className="text-sm text-slate-400 mt-2">{t[lang].section_desc}</p>
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card opacity-0 translate-y-6 transition-all duration-500 ease-out p-6 max-sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1.5">{t[lang][f.titleKey]}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{t[lang][f.descKey]}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-xs text-slate-400">{t[lang].footer_copy}</span>
          <div className="flex items-center gap-4">
            <Link href="pages/about" className="text-xs text-slate-400 hover:text-slate-600 transition">{t[lang].about}</Link>
            <Link href="pages/login" className="text-xs text-slate-400 hover:text-slate-600 transition">{t[lang].login}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
