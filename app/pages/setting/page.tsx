"use client";
import Card from "@/app/components/Card";
import NavAndSidebar from "@/app/components/navAndSidebar";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { FaExternalLinkAlt, FaCheckCircle } from "react-icons/fa";

// Company details live in one place so they are easy to update later.
const COMPANY = {
  name: "Aurora Automation",
  industry: "Automation Services",
  website: "https://aurora-automation.com/",
  about:
    "Aurora Automation is an automation company that designs and delivers automation solutions and related services. We help businesses reduce manual work, connect their tools, and run day-to-day operations more efficiently.",
  services: [
    "Business process automation",
    "Workflow and system integration",
    "AI-powered automation solutions",
    "Automation consulting and support",
  ],
};

// shows "aurora-automation.com" instead of the full URL
const websiteLabel = COMPANY.website.replace(/^https?:\/\//, "").replace(/\/$/, "");

export default function Settings() {
  const { user } = useUser();
  const { t } = useLanguage();

  return (
    <NavAndSidebar
      pageInfo={[
        "Settings",
        "Manage your profile details, security options, and subscription settings.",
        "setting",
      ]}
      user={[
        user.name,
        user.profilePic,
        user.notificationNumber,
        user.purchasePlan,
        user.WebHook_Url["setting"],
      ]}
    >
      <div className="w-full">
        <Card
          // header={
          //   <div className="py-1">
          //     <h2 className="text-xl font-bold text-slate-800">{t("Company Information")}</h2>
          //     <p className="text-sm text-slate-400 mt-1">
          //       {t("Details about the company behind this platform.")}
          //     </p>
          //   </div>
          // }
        >
          <div className="space-y-6">
            {/* COMPANY HEADER */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-200">
                {COMPANY.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">{COMPANY.name}</h3>
                <p className="text-sm text-indigo-600 font-medium">{t(COMPANY.industry)}</p>
              </div>
            </div>

            {/* ABOUT */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1.5">{t("About")}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{t(COMPANY.about)}</p>
            </div>

            {/* DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t("Company Name")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{COMPANY.name}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t("Industry")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{t(COMPANY.industry)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t("Website")}
                </p>
                <a
                  href={COMPANY.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:underline break-all"
                >
                  {websiteLabel}
                  <FaExternalLinkAlt className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>

            {/* WHAT WE DO */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2.5">{t("What We Do")}</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COMPANY.services.map((service) => (
                  <li
                    key={service}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
                  >
                    <FaCheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                    {t(service)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </NavAndSidebar>
  );
}