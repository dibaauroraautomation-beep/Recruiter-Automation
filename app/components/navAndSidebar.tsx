"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "../contexts/LanguageContext";

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
}

function separatePageData(sourceList: PageItem[]) {
  const n1: string[] = [];
  const n2: string[] = [];

  sourceList.forEach((item) => {
    n1.push(item.name);
    n2.push(item.path);
  });

  return { n1, n2 };
}

const pathVar: PageItem[] = [
  { name: "Dashboard", path: "Dashboard" },
  { name: "Resume Generator", path: "Resume_Generator" },
  { name: "Cover Letter Generator", path: "coverLetterGenerator" },
  { name: "Interview Prep AI", path: "Interview_Prep_AI" },
  { name: "Applications Status", path: "ApplicationsStatus" },
  { name: "Settings", path: "setting" },
];

function SidebarContent({ highlightLink, onLinkClick }: { highlightLink: string; onLinkClick?: () => void }) {
  const { t } = useLanguage();
  const { n1: listOfPageNames, n2: listOfPages } = separatePageData(pathVar);

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-white/5 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
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
        {listOfPages.map((pagePath, index) => {
          if (highlightLink === pagePath) {
            return (
              <Link
                key={index}
                href={pagePath}
                onClick={onLinkClick}
                className="self-start inline-flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-sm"
              >
                <span>{t(listOfPageNames[index])}</span>
              </Link>
            );
          }
          return (
            <Link
              key={index}
              href={pagePath}
              onClick={onLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <span>{t(listOfPageNames[index])}</span>
            </Link>
          );
        })}
      </nav>
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
      <span className={"px-2.5 py-1 border-r border-blue-200 " + (isEn ? "bg-blue-500 text-white" : "text-blue-500")}>EN</span>
      <span className={"px-2.5 py-1 " + (!isEn ? "bg-blue-500 text-white" : "text-blue-500")}>DE</span>
    </button>
  );
}

export default function navAndSidebar({ pageInfo, user, sidebarHeight = "h-screen", children }: pageInfoProps) {
  const [title, titleDescription, highlightLink] = pageInfo;
  const [name, profilePicLink, notificationNumber, purchasePlan] = user;
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
        <aside className={`hidden lg:flex flex-col bg-[#0a0e2e] text-slate-300 sticky top-0 w-60 shrink-0 ${sidebarHeight}`}>
          <SidebarContent highlightLink={highlightLink} />
        </aside>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <aside className="relative w-72 max-w-[80vw] h-full bg-[#0a0e2e] text-slate-300 flex flex-col shadow-xl animate-slide-in">
              <div className="flex justify-end p-3">
                <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
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
                className="lg:hidden text-slate-500 hover:text-slate-700 -ml-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{t(title)}</h1>
              </div>

              <LanguageSelect />

              <span className="w-px h-6 bg-slate-200 shrink-0"></span>

              <div className="relative shrink-0">
                <button onClick={() => setProfileOpen((p) => !p)} className="flex items-center gap-2.5">
                  <img src={profilePicLink} alt={displayName} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover" />
                  <div className="leading-tight hidden sm:block text-left">
                    <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                    <p className="text-[11px] text-blue-500 font-medium">{t(purchasePlan)}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                        </svg>
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
