"use client";
import { useState, useEffect, useRef } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import Card from "@/app/components/Card";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";

const STORAGE_KEY = "jobPublishFormDraft";

const EMPTY_FORM = {
  jobTitle: "",
  company: "",
  location: "",
  employmentType: "Full-time",
  salary: "",
  description: "",
  skills: "",
  experienceLevel: "Entry-level",
  education: "",
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("jobPublishSessionId");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("jobPublishSessionId", id);
  }
  return id;
}

function FieldSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[1px]">
      <svg className="w-5 h-5 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

// The webhook now returns skills as { required, preferred } instead of a plain string.
// Both shapes are handled so an older response still works.
function normalizeSkills(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;

  if (typeof raw === "object") {
    const obj = raw as { required?: unknown; preferred?: unknown };
    const asText = (v: unknown) =>
      Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : "";
    // only the required list goes into the field
    return asText(obj.required);
  }

  return "";
}

// Webhook returns education as an array; a comma-separated string is also accepted.
function normalizeEducation(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

export default function JobPublish() {
  const { user } = useUser();
  const { t } = useLanguage();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const EDUCATION_OPTIONS = [
    "Secondary School Certificate (SSC / O-Level)",
    "Higher Secondary Certificate (HSC / A-Level)",
    "Diploma",
    "Associate Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "MBA",
    "MPhil",
    "PhD / Doctorate",
    "Professional Certification",
    "No formal education required",
  ];
  const [submitting, setSubmitting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  // Always holds the latest jobTitle without re-registering the interval
  const jobTitleRef = useRef(form.jobTitle);
  const [educationIsOther, setEducationIsOther] = useState<boolean>(
    !!form.education && !EDUCATION_OPTIONS.includes(form.education)
  );
  const [aiEducationOptions, setAiEducationOptions] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    jobTitleRef.current = form.jobTitle;
  }, [form.jobTitle]);

  // Restore the saved draft once, when the page mounts
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.form) setForm({ ...EMPTY_FORM, ...d.form });
        if (Array.isArray(d.aiEducationOptions)) setAiEducationOptions(d.aiEducationOptions);
        if (typeof d.educationIsOther === "boolean") setEducationIsOther(d.educationIsOther);
      }
    } catch {
      /* ignore corrupted draft */
    }
    setHydrated(true);
  }, []);

  // Save the draft on every change (only after the restore has finished)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ form, aiEducationOptions, educationIsOther })
      );
    } catch {
      /* storage full or blocked */
    }
  }, [form, aiEducationOptions, educationIsOther, hydrated]);

  // Fires every 50s, sends the job title, and fills description + skills + education options from the response
  useEffect(() => {
    const WEBHOOK_URL = "https://n8naurora.duckdns.org/webhook/title-fetch";

    const interval = setInterval(async () => {
      const title = jobTitleRef.current.trim();
      if (!title) return; // skip empty title
      setAiLoading(true);
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle: title, sessionId: getSessionId() }),
        });

        if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

        const data = await res.json();
        const result = Array.isArray(data) ? data[0] : data; // n8n wraps output in an array

        const skillsText = normalizeSkills(result.skills);
        const educationList = normalizeEducation(result.education);

        setForm((prev) => ({
          ...prev,
          description: result.description || prev.description,
          skills: skillsText || prev.skills,
        }));

        // Put the AI education list into the dropdown (user still picks one)
        if (educationList.length) setAiEducationOptions(educationList);
      } catch (err) {
        console.error("title-fetch webhook error:", err);
      } finally {
        setAiLoading(false);
      }
    }, 50000); // 50 sec

    return () => clearInterval(interval);
  }, []);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Now requires every field, not just the original four
    const allFields = Object.keys(form) as (keyof typeof form)[];
    const emptyField = allFields.some((k) => !form[k].trim());

    if (emptyField) {
      setError(t("Please fill in all fields before posting."));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("https://n8naurora.duckdns.org/webhook/post-a-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

      setSubmitting(false);
      clearForm(); // job is posted, so drop the saved draft
      setPosted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("post-a-job webhook error:", err);
      setSubmitting(false);
      setError(t("Something went wrong while posting the job. Please try again."));
    }
  };

  const clearForm = () => {
    setForm({ ...EMPTY_FORM });
    setAiEducationOptions([]);
    setEducationIsOther(false);
    setError("");
  };

  const resetForm = () => {
    clearForm();
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

  // AI options if the webhook sent any, otherwise the static list
  const educationOptions = aiEducationOptions.length ? aiEducationOptions : EDUCATION_OPTIONS;

  // Show the free-text box on "Other", or when the saved value isn't in the list
  const showEducationOther =
    educationIsOther || (!!form.education && !educationOptions.includes(form.education));

  const formPanel = posted ? (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-slate-900">{t("Submitted for Approval")}</h1>
      <p className="mt-4 text-base text-slate-500 leading-relaxed max-w-md text-center">
        {t("Your job listing has been sent for review. It will go live once approved.")}
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
            {t("Fill in the details below and we’ll find the perfect candidates for you.")}{" "}
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
            placeholder={t("e.g. $80k – $120k")}
            className={inputClass}
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Description")}</label>
          <div className="relative">
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder={t("Job Description will be added by AI")}
              rows={4}
              disabled={aiLoading}
              className={inputClass + " resize-y"}
            />
            {aiLoading && <FieldSpinner />}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t("Skills Required")}</label>
          <div className="relative">
            <input
              type="text"
              value={form.skills}
              onChange={(e) => update("skills", e.target.value)}
              placeholder={t("Required skills will be added by AI")}
              disabled={aiLoading}
              className={inputClass}
            />
            {aiLoading && <FieldSpinner />}
          </div>
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
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("Education")}
            </label>

            <select
              value={showEducationOther ? "__other__" : form.education}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "__other__") {
                  setEducationIsOther(true);
                  update("education", "");
                } else {
                  setEducationIsOther(false);
                  update("education", value);
                }
              }}
              className={inputClass}
            >
              <option value="">{t("Select education level")}</option>
              {educationOptions.map((option) => (
                <option key={option} value={option}>
                  {aiEducationOptions.length ? option : t(option)}
                </option>
              ))}
              <option value="__other__">{t("Other")}</option>
            </select>

            {showEducationOther && (
              <input
                type="text"
                value={form.education}
                onChange={(e) => update("education", e.target.value)}
                placeholder={t("Type the required education")}
                className={`${inputClass} mt-2`}
                autoFocus
              />
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={clearForm}
            disabled={submitting}
            className="sm:w-40 px-6 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t("Clear")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? t("Posting…") : t("Create Job for Approval")}
          </button>
        </div>
      </form>
    </Card>
  );

  return (
    <NavAndSidebar
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