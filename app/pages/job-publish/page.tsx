"use client";
import { useState } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import Card from "@/app/components/Card";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";

export default function JobPublish() {
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
    experienceLevel: "Entry-level",
    education: "",
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
      experienceLevel: "Entry-level",
      education: "",
    });
    setPosted(false);
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition";

  const employmentOptions = [
    t("Full-time"),
    t("Part-time"),
    t("Contract"),
    t("Remote"),
  ];

  const experienceOptions = [
    t("Entry-level"),
    t("Mid-level"),
    t("Senior"),
    t("Lead"),
    t("Manager"),
  ];

  const formPanel = posted ? (
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
        className="mt-8 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition shadow-sm"
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
            {t("Fill in the details below and we\u2019ll find the perfect candidates for you.")}{" "}
            <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 text-indigo-600 font-semibold text-xs shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M12 18.75V21m8.5-8.5H18.25M5.75 12.5H3.5M6.34 6.34l1.59 1.59m9.73 9.73 1.59 1.59M17.66 6.34l-1.59 1.59M6.34 17.66l1.59-1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
              </svg>
              {t("Leave fields blank and AI will fill them for you")}
            </span>
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
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Description")}</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder={t("Describe the role, responsibilities, and what you\u2019re looking for.")}
            rows={4}
            className={inputClass + " resize-y"}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Skills Required")}</label>
          <input
            type="text"
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            placeholder={t("e.g. React, Node.js, TypeScript")}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Experience Level")}</label>
            <select
              value={form.experienceLevel}
              onChange={(e) => update("experienceLevel", e.target.value)}
              className={inputClass}
            >
              {experienceOptions.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Education")}</label>
            <input
              type="text"
              value={form.education}
              onChange={(e) => update("education", e.target.value)}
              placeholder={t("e.g. Bachelor\u2019s in Computer Science")}
              className={inputClass}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? t("Posting\u2026") : t("Post Job")}
        </button>
      </form>
    </Card>
  );

  return (
    <NavAndSidebar
      pageInfo={[
        t("Job publish"),
        t("Creating, optimizing, and distributing open roles across multiple external job boards, career pages, and internal networks."),
        "job-publish",
      ]}
      user={[
        user.name,
        user.profilePic,
        user.notificationNumber,
        user.purchasePlan,
        user.WebHook_Url["ApplicationsStatus"],
      ]}
    >
      <div className="w-full">{formPanel}</div>
    </NavAndSidebar>
  );
}