"use client";
import FeatureCard from "@/app/components/FeatureCard";
import NavAndSidebar from "@/app/components/navAndSidebar";
import Card from "@/app/components/Card";
import TableComponent from "@/app/components/TableComponent";

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
      <TableComponent title="Candidate Scoring" />
      
    </NavAndSidebar>
  );
}
