"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "../contexts/LanguageContext";
import { PiSuitcaseSimpleFill, PiRankingLight, PiCheckCircleFill } from "react-icons/pi";
import { FaUserCheck, FaClipboardCheck, FaSlidersH } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { FaBars, FaCaretDown, FaSignOutAlt } from "react-icons/fa";

interface pageInfoProps {
  pageInfo: [title: string, titleDescription: string, heighLightLink: string];
  user: [
    name: string,
    profilePic: string,
    notificationNumber: number,
    purchasePlan: string,
    WebHook_Url: string
  ];
  sidebarHeight?: string;
  children?: ReactNode;
}

interface PageItem {
  name: string;
  path: string;
  icon: ReactNode;
}

const pathVar: PageItem[] = [
  { name: "Job Requisitions", path: "job-requisitions", icon: <PiSuitcaseSimpleFill className="w-4 h-4" /> },
  { name: "Post Approval", path: "post-approval", icon: <PiCheckCircleFill className="w-4 h-4" /> },
  { name: "Candidate Ranking", path: "candidate-ranking", icon: <PiRankingLight className="w-4 h-4" /> },
  { name: "Shortlisted Candidates", path: "shortlisted-candidates", icon: <FaUserCheck className="w-3.5 h-3.5" /> },
  { name: "Interview Evaluation", path: "interview-evaluation", icon: <FaClipboardCheck className="w-3.5 h-3.5" /> },
  { name: "Settings", path: "setting", icon: <FaSlidersH className="w-3.5 h-3.5" /> },
];

function SidebarContent({ highlightLink, onLinkClick }: { highlightLink: string; onLinkClick?: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-950/40">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2 3 7v6c0 4.5 3.8 8.3 9 9 5.2-.7 9-4.5 9-9V7l-9-5Zm0 4.2 5 2.8v4c0 3-2.2 5.6-5 6.1-2.8-.5-5-3.1-5-6.1V9l5-2.8Z" />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-white font-bold text-sm">{t("CareerAI")}</p>
          <p className="text-[10px] text-slate-400">{t("Your AI Career Assistant")}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Menu</p>
        {pathVar.map((item, index) => {
          const active = highlightLink === item.path;
          return (
            <Link
              key={index}
              href={item.path}
              onClick={onLinkClick}
              className={
                active
                  ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-950/40"
                  : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-0.5 transition"
              }
            >
              <span className={active ? "text-indigo-200" : ""}>{item.icon}</span>
              <span className="truncate">{t(item.name)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{t("Your AI Career Assistant")}</p>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">Post jobs, score candidates, and hire faster with AI.</p>
        </div>
      </div>
    </div>
  );
}

function LanguageSelect() {
  const { language, setLanguage } = useLanguage();
  const isEn = language === "en";
  return (
    <button
      onClick={() => setLanguage(isEn ? "de" : "en")}
      className="flex items-center text-xs font-semibold rounded-lg border border-blue-500 bg-white hover:bg-blue-50 transition shrink-0 overflow-hidden"
    >
      <span className={"px-2.5 py-1.5 border-r border-blue-200 " + (isEn ? "bg-blue-500 text-white" : "text-blue-500")}>EN</span>
      <span className={"px-2.5 py-1.5 " + (!isEn ? "bg-blue-500 text-white" : "text-blue-500")}>DE</span>
    </button>
  );
}

export default function navAndSidebar({ pageInfo, user, sidebarHeight = "h-screen", children }: pageInfoProps) {
  const [title, titleDescription, highlightLink] = pageInfo;
  const [name, profilePicLink, notificationNumber] = user;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail"));
  }, []);

  const displayName = userEmail || name;

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden lg:flex flex-col bg-[#0a0e2e] text-slate-300 sticky top-0 w-64 shrink-0 ${sidebarHeight}`}
        >
          <SidebarContent highlightLink={highlightLink} />
        </aside>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <aside className="relative w-72 max-w-[80vw] h-full bg-[#0a0e2e] text-slate-300 flex flex-col shadow-2xl animate-slide-in">
              <div className="flex justify-end p-3">
                <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white p-2">
                  <FaX className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent highlightLink={highlightLink} onLinkClick={() => setMobileSidebarOpen(false)} />
            </aside>
          </div>
        )}

        {/* CONTENT WRAPPER */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* TOP BAR */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="px-4 sm:px-6 h-16 flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden text-slate-500 hover:text-slate-700 -ml-1 p-1"
              >
                <FaBars className="w-5 h-5" />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{t(title)}</h1>
              </div>

              <LanguageSelect />

              <span className="w-px h-6 bg-slate-200 shrink-0" />

              <div className="relative shrink-0">
                <button onClick={() => setProfileOpen((p) => !p)} className="flex items-center gap-2.5">
                  <img src={profilePicLink} alt={displayName} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-blue-500/30" />
                  <div className="leading-tight hidden sm:block text-left">
                    <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                    <p className="text-[11px] text-blue-500 font-medium">{t(user[3])}</p>
                  </div>
                  <FaCaretDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                        <p className="text-[11px] text-blue-500 font-medium">{t(user[3])}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition text-left"
                      >
                        <FaSignOutAlt className="w-4 h-4" />
                        {t("Logout")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {titleDescription && (
            <p className="px-4 sm:px-6 pt-4 text-sm text-slate-400">{t(titleDescription)}</p>
          )}

          {children && (
            <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
              {children}
            </main>
          )}
        </div>
      </div>
    </div>
  );
}