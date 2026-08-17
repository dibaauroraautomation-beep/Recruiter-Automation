"use client";
import { useState } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import Card from "@/app/components/Card";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";

export default function JobPostings() {
  const { user } = useUser();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    jobTitle: "",
    company: "",
    location: "",
    employmentType: "Full-time",
    salary: "",
    description: "",
    skills: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState("");

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required = ["jobTitle", "company", "location", "description"];
    if (required.some((k) => !form[k as keyof typeof form].trim())) {
      setError(t("Please fill in all required fields."));
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setPosted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1200);
  };

  const resetForm = () => {
    setForm({
      jobTitle: "",
      company: "",
      location: "",
      employmentType: "Full-time",
      salary: "",
      description: "",
      skills: "",
    });
    setPosted(false);
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition";

  const employmentOptions = [
    t("Full-time"),
    t("Part-time"),
    t("Contract"),
    t("Remote"),
  ];

  return (
    <NavAndSidebar
      pageInfo={[
        t("Job Postings"),
        t("Creating, optimizing, and distributing open roles across multiple external job boards, career pages, and internal networks."),
        "job-postings",
      ]}
      user={[
        user.name,
        user.profilePic,
        user.notificationNumber,
        user.purchasePlan,
        user.WebHook_Url["ApplicationsStatus"],
      ]}
    >
      {posted ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{t("Job Posted!")}</h1>
          <p className="mt-4 text-base text-slate-500 leading-relaxed max-w-md text-center">
            {t("Your job listing is now live. We\u2019ll start matching candidates shortly.")}
          </p>
          <button
            onClick={resetForm}
            className="mt-8 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-700 to-orange-800 rounded-xl hover:from-amber-800 hover:to-orange-900 transition shadow-sm"
          >
            {t("Post Another Job")}
          </button>
        </div>
      ) : (
        <Card
          header={
            <div className="py-1">
              <h2 className="text-xl font-bold text-slate-800">{t("Post a Job")}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {t("Fill in the details below and we\u2019ll find the perfect candidates for you.")}
              </p>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Job Title")}</label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={(e) => update("jobTitle", e.target.value)}
                  placeholder={t("e.g. Senior Software Engineer")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Company")}</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder={t("e.g. Acme Corp")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Location")}</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder={t("e.g. Berlin, Germany")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Employment Type")}</label>
                <select
                  value={form.employmentType}
                  onChange={(e) => update("employmentType", e.target.value)}
                  className={inputClass}
                >
                  {employmentOptions.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Salary Range")}</label>
              <input
                type="text"
                value={form.salary}
                onChange={(e) => update("salary", e.target.value)}
                placeholder={t("e.g. $80k \u2013 $120k")}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Required Skills")}</label>
              <input
                type="text"
                value={form.skills}
                onChange={(e) => update("skills", e.target.value)}
                placeholder={t("e.g. React, Node.js, TypeScript")}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Job Description")}</label>
              <textarea
                rows={6}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder={t("Describe the role, responsibilities, and requirements\u2026")}
                className={`${inputClass} resize-y`}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-700 to-orange-800 rounded-xl hover:from-amber-800 hover:to-orange-900 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? t("Posting\u2026") : t("Post Job")}
            </button>
          </form>
        </Card>
      )}
    </NavAndSidebar>
  );
}