"use client";
import { useEffect } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import { useT } from "@/app/contexts/LanguageContext";
import { useUser } from "@/app/contexts/UserContext";

export default function Dashboard() {
  const WebHook_Url="sdfgh"
  const t = useT();
  const { user } = useUser();
  console.log("user.WebHook_Ur:", user.WebHook_Url["Dashboard"]);

  useEffect(() => {
    fetch(WebHook_Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: localStorage.getItem("userEmail") ?? "",
        page: "Dashboard",
        action: "page_view",
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  return (
    <div>
      <NavAndSidebar
        pageInfo={[
          "Dashboard Overview",
          "Narrowing down the entire applicant pool into a curated, high-potential segment ready for direct human interaction.",
          "Dashboard",
        ]}
        user={[
          user.name,
          user.profilePic,
          user.notificationNumber,
          user.purchasePlan,
          user.WebHook_Url["Dashboard"],
        ]}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          <div className="block p-6 max-sm:p-4 bg-white rounded-xl border border-slate-200">
            <div className="w-12 h-12 max-sm:w-10 max-sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 max-sm:w-5 max-sm:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800">{t("Analytics")}</h3>
            <p className="text-sm text-slate-500 mt-2">
              {t("View your application statistics and resume performance metrics.")}
            </p>
            <span className="inline-block mt-4 text-sm font-medium text-slate-400">
              {t("Coming soon")}
            </span>
          </div>

          <div className="block p-6 max-sm:p-4 bg-white rounded-xl border border-slate-200">
            <div className="w-12 h-12 max-sm:w-10 max-sm:h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 max-sm:w-5 max-sm:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800">{t("AI Suggestions")}</h3>
            <p className="text-sm text-slate-500 mt-2">
              {t("Get AI-powered recommendations to improve your resume and cover letters.")}
            </p>
            <span className="inline-block mt-4 text-sm font-medium text-slate-400">
              {t("Coming soon")}
            </span>
          </div>
        </div>
      </NavAndSidebar>
    </div>
  );
}
