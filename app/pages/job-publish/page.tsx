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
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState("");

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setAiSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ["jobTitle", "company", "location", "description"];
    if (required.some((k) => !form[k as keyof typeof form].trim())) {
      setError(t("Please fill in all required fields."));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        // "https://n8naurora.duckdns.org/webhook-test/title-fetch",
        "https://n8naurora.duckdns.org/webhook/job-info",
        // "https://n8naurora.duckdns.org/webhook-test/post-a-job",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            email: localStorage.getItem("userEmail") ?? "",
            timestamp: new Date().toISOString(),
          }),
        }
      );
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      setPosted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("Something went wrong while posting the job. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };
  const dataFillUpByAI = async () => {
    const hasAnyField = [
      "jobTitle",
      "company",
      "location",
      "salary",
      "description",
      "skills",
      "education",
    ].some((k) => form[k as keyof typeof form].trim());

    if (!hasAnyField) {
      setAiError(t("Please fill in at least one field so AI can complete the rest."));
      return;
    }

    setAiSubmitting(true);
    setAiError("");
    setAiSuccess("");
    try {
      const params = new URLSearchParams({
        ...form,
        email: localStorage.getItem("userEmail") ?? "",
        timestamp: new Date().toISOString(),
      });
      const res = await fetch(
        // `https://n8naurora.duckdns.org/webhook-test/dataFillUpByAI?${params.toString()}`,
        `https://n8naurora.duckdns.org/webhook/dataFillUpByAI?${params.toString()}`,
        { method: "GET" }
      );
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const raw = await res.text();
      let data: unknown = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      const payload = Array.isArray(data) ? data[0] : data;
      if (payload && typeof payload === "object") {
        setForm((prev) => {
          const next = { ...prev };
          (Object.keys(next) as (keyof typeof next)[]).forEach((key) => {
            if (next[key].trim()) return;
            const val = (payload as Record<string, unknown>)[key];
            if (typeof val === "string" && val.trim()) next[key] = val;
          });
          return next;
        });
        setAiSuccess(t("AI filled in the missing fields for you."));
      } else {
        setAiError(t("The AI service didn't return usable data. Check the n8n webhook response."));
      }
    } catch {
      setAiError(t("Something went wrong while filling data with AI. Please try again."));
    } finally {
      setAiSubmitting(false);
    }
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

  const educationOptions = [
    t("No Formal Education"),
    t("High School Diploma / GED"),
    t("Vocational / Trade Certificate"),
    t("Some College"),
    t("Associate's Degree"),
    t("Diploma / Postgraduate Diploma"),
    t("Bachelor's Degree"),
    t("Postgraduate Certificate"),
    t("Master's Degree"),
    t("MBA"),
    t("Juris Doctor (JD)"),
    t("Doctor of Medicine (MD)"),
    t("PhD / Doctorate"),
    t("Professional Certification"),
    t("Not Required"),
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
            <select
              value={form.education}
              onChange={(e) => update("education", e.target.value)}
              className={inputClass}
            >
              <option value="">{t("Select education level")}</option>
              {educationOptions.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(error || aiError || aiSuccess) && (
          <p className={`text-sm ${error || aiError ? "text-red-600" : "text-green-600"}`}>
            {error || aiError || aiSuccess}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={dataFillUpByAI}
            disabled={aiSubmitting}
            className="w-full px-6 py-3 text-sm font-semibold text-indigo-700 bg-white border-2 border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.091 3.091ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
            {aiSubmitting ? t("Filling\u2026") : t("Fill Data by AI")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? t("Posting\u2026") : t("Post Job")}
          </button>
        </div>
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