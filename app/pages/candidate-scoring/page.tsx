"use client";
import FeatureCard from "@/app/components/FeatureCard";
import NavAndSidebar from "@/app/components/navAndSidebar";
import Card from "@/app/components/Card";

import {  useT } from "@/app/contexts/LanguageContext";

import { useJobDescription } from "@/app/contexts/JobDescriptionContext";
import { useGoogleDrivePicker } from "@/app/hooks/useGoogleDrivePicker";


import { useState,useRef, useEffect} from "react";
import { generateCoverLetterPDF } from "@/app/components/jsPDF";
import { generateCoverLetterDocx } from "@/app/components/DocxGenerator";
import { useUser } from "@/app/contexts/UserContext";

function UploadCard({
  file,
  onFileChange,
}: {
  file: File | null;
  onFileChange: (f: File | null) => void;
}) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (f) => {
      if (f.size > 10 * 1024 * 1024) {
        alert(t("File size must be less than 10 MB."));
        return;
      }
      onFileChange(f);
    },
  });

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (!selected) return;
          const maxSize = 10 * 1024 * 1024;
          const allowed = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ];
          if (!allowed.includes(selected.type)) {
            alert(t("Please upload a PDF or DOC file."));
            e.target.value = "";
            return;
          }
          if (selected.size > maxSize) {
            alert(t("File size must be less than 10 MB."));
            e.target.value = "";
            return;
          }
          onFileChange(selected);
        }}
      />
      <FeatureCard
        number={1}
        title={t("Upload Resume")}
        subtitle={t("Upload your resume in PDF or DOCX format to get started.")}
        bodyClassName="flex flex-col"
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 px-4 py-3 mb-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left"
        >
          <svg className="w-6 h-6 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Zm7 1.5L18.5 9H14a1 1 0 0 1-1-1V3.5Z" />
          </svg>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-slate-700 truncate">
              {file ? file.name : t("Upload from Computer")}
            </span>
            <span className="block text-xs text-slate-400">
              {file ? `${(file.size / 1024).toFixed(0)} KB` : t("PDF, DOCX \u2014 Max 10 MB")}
            </span>
          </span>
          {file && (
            <button
              onClick={(e) => { e.stopPropagation(); onFileChange(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="shrink-0 text-slate-400 hover:text-red-500 text-base leading-none p-1"
            >
              &times;
            </button>
          )}
        </button>
        <button
          onClick={openDrivePicker}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left"
        >
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
            <path fill="#0066da" d="M4.5 19.5 7 15h10l-2.5 4.5z" />
            <path fill="#00ac47" d="M9.5 4 4.5 12.5 7 17l5-8.5z" />
            <path fill="#ffba00" d="M14.5 4h-5l5 8.5L19.5 17 14.5 4z" />
          </svg>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-700 truncate">{t("Import from Google Drive")}</span>
            <span className="block text-xs text-slate-400 truncate">{t("Select files directly from Drive")}</span>
          </span>
        </button>
        <p className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 0h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5Z" />
          </svg>
          {t("Your files are secure and private.")}
        </p>
      </FeatureCard>
    </>
  );
}

export default function CoverLetterGenerator() {
  const { user } = useUser();
  const pageWebHookUrl = user.WebHook_Url["coverLetterGenerator"];
  const { coverLetterJobDescription, setCoverLetterJobDescription } = useJobDescription();
  console.log("user.name:", user.name,"user.id:", user.id,"pageWebHookUrl = user.WebHook_Url[\"coverLetterGenerator\"]", pageWebHookUrl);
  const [jobDescription, setJobDescription] = useState(coverLetterJobDescription || "");
  const [aiGeneratedText, setAiGeneratedText] = useState("");
  const [isEditBtnDisabled, setIsEditBtnDisabled] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "completed" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Sync shared description to local state
  useEffect(() => {
    setJobDescription(coverLetterJobDescription);
  }, [coverLetterJobDescription]);

  // Modern and safe clipboard API utility handler
  const handleCopyText = async () => {
    if (!aiGeneratedText) return;
    try {
      await navigator.clipboard.writeText(aiGeneratedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleClick = (
    language: "de" | "EN",
    // baseUrl: string = "https://n8naurora.duckdns.org/webhook-test/coverLetterGenerator",
    baseUrl: string = "https://n8naurora.duckdns.org/webhook/coverLetterGenerator",
    userId: string = "ATS_Friendly_CV_pdf_Banglalink_20714",
  ) => {
    console.log("Generating cover letter...");
    // 1. Set status to processing when starting the fetch
    setStatus("processing");
    setJobDescription("");
    setAiGeneratedText("");
    // Correct URL formatting using standard ampersand delimiters
    const targetUrl = `${baseUrl}?userId=${userId}&userWritenJobDec=${encodeURIComponent(jobDescription)}&language=${language}`;

    fetch(targetUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.log("User Data Received Successfully");
        setAiGeneratedText(data);
        // 2. Set status to idle when fetch returns successfully (ok)
        setStatus("idle");
      })
      .catch((error) => {
        console.error("Fetch failed:", error);
        setStatus("error");
        setError(error);
      });
  };

  return (
    <NavAndSidebar
      pageInfo={[
        "candidate-scoring_NAME",
        " Utilizing algorithmic matching or automated matrix templates to evaluate raw applicant data against specific job criteria.",
        "candidate-scoring",
      ]}
user={[
        user.name,
        user.profilePic,
        user.notificationNumber,
        user.purchasePlan,
        pageWebHookUrl,
      ]}
      sidebarHeight="h-screen"
    >
      <div className="max-w-[1120px] mx-auto space-y-6">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <UploadCard file={file} onFileChange={setFile} />

          <Card
            width="100%"
            header={
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">2</span>
                <h2 className="text-base font-semibold text-slate-800">Job Description</h2>
              </div>
            }
          >
            <div className="flex flex-col gap-2 h-full">
              <p className="text-xs text-slate-400">Paste the job description to tailor your cover letter.</p>
              <div className="relative flex-1 min-h-[160px] flex flex-col">
                <textarea
                  id="job-description-textarea"
                  className="w-full flex-1 p-3 text-xs bg-slate-50/50 border border-slate-200 rounded-xl resize-none outline-none focus:border-indigo-500 focus:bg-white transition"
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    setCoverLetterJobDescription(e.target.value);
                  }}
                  maxLength={5000}
                ></textarea>
                <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">{jobDescription.length} / 5000</span>
              </div>
            </div>
          </Card>

          <Card
            width="100%"
            header={
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">3</span>
                <h2 className="text-base font-semibold text-slate-800">Generate</h2>
              </div>
            }
            footer={
              <div className="flex flex-row gap-3 w-full p-1 h-8">
                <button
                  className="w-full hover:bg-indigo-700 bg-indigo-600 text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 whitespace-nowrap"
                  onClick={() => handleClick("EN", pageWebHookUrl, user.id)}
                >
                  <span>✨</span>In English
                </button>
                <button
                  className="w-full hover:bg-indigo-700 bg-indigo-600 text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 whitespace-nowrap"
                  onClick={() => handleClick("de", pageWebHookUrl, user.id)}
                >
                  <span>✨</span>In German
                </button>
              </div>
            }
          >
            <div className="flex flex-col items-center justify-center text-center py-4 h-full gap-3">
              <p className="text-xs text-slate-400 px-4">Click a language below to build your tailored cover letter layout.</p>
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-2xl border border-slate-100 shadow-inner">📝</div>
            </div>
          </Card>
        </div>

        <div className="w-full">
          <Card
            width="100%"
            header={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800">Generated Cover Letter</h2>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full border border-emerald-100">AI Generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-1 text-xs border rounded-lg font-medium transition ${
                      !isEditBtnDisabled ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                    onClick={() => setIsEditBtnDisabled((prev) => !prev)}
                  >
                    {!isEditBtnDisabled ? "Save" : "Edit"}
                  </button>
                  <button
                    className="px-3 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition"
                    onClick={handleCopyText}
                  >
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            }
            footer={
              <div className="flex items-center justify-start gap-3 w-full">
                <button
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50/50 transition"
                  onClick={generateCoverLetterDocx}
                >
                  Export as DOCX
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50/50 transition"
                  onClick={generateCoverLetterPDF}
                >
                  Export as PDF
                </button>
              </div>
            }
          >
            {status === "processing" && (
              <div id="AI-generated-text-area" className="w-full p-1 bg-blue-100">
                <div className="flex items-center justify-center h-[250px]">
                  <div className="text-center space-y-3">
                    <svg className="w-8 h-8 mx-auto animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-slate-500 font-medium">Generating your Cover Letter...</p>
                    <p className="text-xs text-slate-400">This may take a few minutes</p>
                  </div>
                </div>
              </div>
            )}
            {status === "error" && (
              <div id="AI-generated-text-area" className="w-full p-1 ">
                <div className="flex items-center justify-center h-[250px]">
                  <div className="text-center space-y-2">
                    <p className="text-red-500 font-medium">Something went wrong: Please reload the page</p>
                    <p className="text-xs text-slate-400">{`error:${error}`}</p>
                  </div>
                </div>
              </div>
            )}
            {status === "idle" && (
              <div id="AI-generated-text-area" className="w-full p-1 ">
                <textarea
                  id="AI-generated-text-area-editable"
                  className="disabled:text-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 w-full min-h-[240px] p-4 text-xs bg-slate-50/50 border border-slate-200 rounded-xl resize-y outline-none font-mono text-slate-700 leading-relaxed focus:border-indigo-500 disabled:bg-slate-50/30 disabled:text-slate-500 transition"
                  placeholder="Your AI generated cover letter text will display here..."
                  disabled={isEditBtnDisabled}
                  title="Press the edit button above to modify this content"
                  value={aiGeneratedText}
                  onChange={(e) => setAiGeneratedText(e.target.value)}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </NavAndSidebar>
  );
}
