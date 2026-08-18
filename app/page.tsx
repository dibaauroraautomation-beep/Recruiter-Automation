"use client";
import { useState } from "react";
import Link from "next/link";

type Lang = "en" | "de";

const t: Record<Lang, Record<string, string>> = {
  en: {
    badge: "Hire Top Talent",
    hero_title_1: "Post a Job,",
    hero_title_2: "Hire the Best",
    hero_desc: "Create a job posting in minutes and get matched with qualified candidates \u2014 powered by AI.",
    login: "Login",
    about: "About",
    get_started: "Post a Job",
    learn_more: "Learn More",
    feat_1_title: "AI Candidate Matching",
    feat_1_desc: "Our AI analyzes every applicant and matches the most qualified candidates to your role instantly.",
    feat_2_title: "Smart ATS Screening",
    feat_2_desc: "Automatically score resumes against your job description and surface the top talent first.",
    feat_3_title: "Automated Interviews",
    feat_3_desc: "Let AI conduct and evaluate structured interviews, saving you hours of manual screening.",
    feat_4_title: "Real-time Analytics",
    feat_4_desc: "Track applicants, shortlist status, and hiring funnels with live dashboards.",
    cta_title: "Ready to hire your next star?",
    cta_desc: "Post your first job today and let AI do the heavy lifting.",
    cta_btn: "Create a Job Posting",
    footer_copy: "\u00A9 2026 CareerAI. All rights reserved.",
  },
  de: {
    badge: "Top-Talente einstellen",
    hero_title_1: "Stelle eine Stelle ein,",
    hero_title_2: "Stelle die Besten ein",
    hero_desc: "Erstellen Sie in Minuten eine Stellenausschreibung und finden Sie qualifizierte Kandidaten \u2014 von KI unterst\u00fctzt.",
    login: "Anmelden",
    about: "\u00DCber uns",
    get_started: "Stelle einstellen",
    learn_more: "Mehr erfahren",
    feat_1_title: "KI-Kandidatenabgleich",
    feat_1_desc: "Unsere KI analysiert jeden Bewerber und bringt die qualifiziertesten Kandidaten sofort mit Ihrer Stelle zusammen.",
    feat_2_title: "Intelligente ATS-Pr\u00fcfung",
    feat_2_desc: "Bewerten Sie Lebensl\u00e4ufe automatisch anhand Ihrer Stellenbeschreibung und entdecken Sie zuerst die besten Talente.",
    feat_3_title: "Automatisierte Gespr\u00e4che",
    feat_3_desc: "Lassen Sie KI strukturierte Gespr\u00e4che f\u00fchren und bewerten \u2014 sparen Sie Stunden manueller Pr\u00fcfung.",
    feat_4_title: "Analysen in Echtzeit",
    feat_4_desc: "Verfolgen Sie Bewerber, Vorauswahlstatus und Einstellungstrichter mit Live-Dashboards.",
    cta_title: "Bereit, Ihren n\u00e4chsten Star einzustellen?",
    cta_desc: "Ver\u00f6ffentlichen Sie noch heute Ihre erste Stelle und lassen Sie KI die schwere Arbeit \u00fcbernehmen.",
    cta_btn: "Stellenausschreibung erstellen",
    footer_copy: "\u00A9 2026 CareerAI. Alle Rechte vorbehalten.",
  },
};

const features = [
  {
    titleKey: "feat_1_title",
    descKey: "feat_1_desc",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
  },
  {
    titleKey: "feat_2_title",
    descKey: "feat_2_desc",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  },
  {
    titleKey: "feat_3_title",
    descKey: "feat_3_desc",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75V12m0 0v5.25m0-5.25H6.75m5.25 0h5.25M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /></svg>,
  },
  {
    titleKey: "feat_4_title",
    descKey: "feat_4_desc",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
  },
];

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <div className="min-h-screen bg-[#fdf9f3] text-slate-900 antialiased">
      <header className="sticky top-0 z-20 bg-[#fdf9f3]/80 backdrop-blur-md border-b border-amber-900/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2 3 7v6c0 4.5 3.8 8.3 9 9 5.2-.7 9-4.5 9-9V7l-9-5Zm0 4.2 5 2.8v4c0 3-2.2 5.6-5 6.1-2.8-.5-5-3.1-5-6.1V9l5-2.8Z" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-bold text-slate-900">CareerAI</span>
              <span className="block text-[10px] font-medium text-amber-800">{t[lang].badge}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "en" ? "de" : "en")}
              className="flex items-center text-xs font-semibold rounded-lg border border-amber-700 bg-white hover:bg-amber-50 transition shrink-0 overflow-hidden"
            >
              <span className={"px-2.5 py-1.5 border-r border-amber-200 " + (lang === "en" ? "bg-amber-700 text-white" : "text-amber-700")}>EN</span>
              <span className={"px-2.5 py-1.5 " + (lang === "de" ? "bg-amber-700 text-white" : "text-amber-700")}>DE</span>
            </button>
            <span className="hidden sm:block w-px h-6 bg-slate-200" />
            <Link
              href="pages/login"
              className="hidden sm:inline-flex px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-700 to-orange-800 rounded-xl hover:from-amber-800 hover:to-orange-900 transition shadow-sm"
            >
              {t[lang].login}
            </Link>
            <Link
              href="pages/about"
              className="hidden sm:inline-flex px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              {t[lang].about}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(217,119,6,0.12),transparent_70%)]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-7 text-xs font-semibold text-amber-900 bg-amber-100/70 rounded-full border border-amber-300/60 shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7Z" />
              </svg>
              {t[lang].badge}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight max-w-3xl mx-auto tracking-tight">
              {t[lang].hero_title_1}<br />
              <span className="bg-gradient-to-r from-amber-600 via-orange-700 to-orange-800 bg-clip-text text-transparent">{t[lang].hero_title_2}</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
              {t[lang].hero_desc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-9">
              <Link
                href="pages/job-postings"
                className="px-7 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-700 to-orange-800 rounded-xl hover:from-amber-800 hover:to-orange-900 transition shadow-lg shadow-amber-900/20"
              >
                {t[lang].get_started}
              </Link>
              <Link
                href="pages/about"
                className="px-7 py-3 text-sm font-semibold text-slate-700 border border-slate-300 bg-white rounded-xl hover:border-amber-700 hover:text-amber-800 transition"
              >
                {t[lang].learn_more}
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-amber-900/10 bg-white shadow-sm hover:shadow-lg hover:border-amber-700/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 flex items-center justify-center mb-4 group-hover:from-amber-700 group-hover:to-orange-800 group-hover:text-white transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">{t[lang][f.titleKey]}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t[lang][f.descKey]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1607] via-[#3d1f0c] to-[#5a2f14] px-6 sm:px-12 py-14 text-center shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(251,146,60,0.25),transparent_70%)]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                {t[lang].cta_title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-amber-100/80 max-w-md mx-auto leading-relaxed">
                {t[lang].cta_desc}
              </p>
              <Link
                href="pages/job-postings"
                className="inline-flex mt-8 px-8 py-3.5 text-sm font-semibold text-amber-950 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl hover:from-amber-500 to-orange-500 transition shadow-lg shadow-amber-950/30"
              >
                {t[lang].cta_btn}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-amber-900/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-xs text-slate-500">{t[lang].footer_copy}</span>
          <div className="flex items-center gap-4">
            <Link href="pages/about" className="text-xs text-slate-500 hover:text-amber-800 transition">{t[lang].about}</Link>
            <Link href="pages/login" className="text-xs text-slate-500 hover:text-amber-800 transition">{t[lang].login}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


