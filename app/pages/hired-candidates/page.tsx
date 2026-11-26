"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import TableComponent, { type TableData } from "@/app/components/TableComponent";
import { useEvaluations } from "@/app/hooks/useEvaluations";
import { useUser } from "@/app/contexts/UserContext";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useMinScoreSetting } from "@/app/hooks/useMinScoreSetting";
type NavProps = ComponentProps<typeof NavAndSidebar>;

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */
export const dynamic = "force-dynamic";
const CANDIDATE_DATA_URL = "https://n8naurora.duckdns.org/webhook/candidate-data";
const CONFIRMATION_MAIL_URL = "https://n8naurora.duckdns.org/webhook/sent-email";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SelectionStatus = "pending" | "selected" | "not_selected" | "hired";
type SortKey = "totalScore" | "cvScore" | "interviewScore" | "name";
type SortOrder = "desc" | "asc";

interface Candidate {
  id: string; // stable key — email when available
  name: string;
  role: string;
  email: string;
  phone: string;
  cvScore: number;
  cvLink: string;
  aiConfidenceLevel: string;
  strengths: string;
  gapRisk: string;
  summary: string;
  salary: string;
  noticePeriod: string;
  skills: string;
  experience: string;
  location: string;
  attachment: string;
  dataStatus?: SelectionStatus;
  // aiAssessment: string;
  mustHaveRequirements: string;
}

interface Breakdown {
  appearance: string;
  interpersonal: string;
  technical: string;
  problemSolving: string;
  communication: string;
}

const CRITERIA: { key: keyof Breakdown; label: string; max: number }[] = [
  { key: "appearance", label: "Professional Appearance", max: 10 },
  { key: "interpersonal", label: "Interpersonal Skills & Cultural Fit", max: 10 },
  { key: "technical", label: "Technical Knowledge & Skills", max: 40 },
  { key: "problemSolving", label: "Problem-Solving & Critical Thinking", max: 20 },
  { key: "communication", label: "Communication Skills", max: 20 },
];

const EMPTY_BREAKDOWN: Breakdown = {
  appearance: "",
  interpersonal: "",
  technical: "",
  problemSolving: "",
  communication: "",
};

const STATUS_OPTIONS: { value: SelectionStatus; label: string }[] = [
  { value: "selected", label: "Selected" },
  { value: "not_selected", label: "Not Selected" },
  { value: "hired", label: "Hired" },
];
const NOT_AVAILABLE = "Not Available";
/* ------------------------------------------------------------------ */
/* Webhook column mapping                                              */
/* ------------------------------------------------------------------ */

const KEY_ALIASES: Record<string, string[]> = {
  fullname: ["fullname", "name", "candidatename"],
  formtitle: ["formtitle", "jobtitle", "title"],
  email: ["email", "emailaddress"],
  atsscore: ["atsscore", "score", "ats", "candidatescore", "cvscore"],
  phoneno: ["phoneno", "phone", "phonenumber"],
  cvlink: ["cvlink", "cv", "resumelink"],
  aiconfidencelevel: ["aiconfidencelevel", "confidence", "aiconfidence"],
  strengths: ["strengths", "strenghs"],
  gaprisk: ["gaprisk", "gap", "risk", "potentialgap"],
  summarycomment: ["summarycomment", "summary", "comment"],
  salary: ["salary", "expectedsalary"],
  noticeperiod: ["noticeperiod", "notice"],
  skills: ["skills", "expertise"],
  experience: ["experience", "yearsofexperience", "exp"],
  location: ["address", "location", "city"],
  // The n8n table spells this column "Attchments".
  finalstatus: ["finalstatus", "status", "selectionstatus", "candidatestatus"],
  attachments: ["attchments", "attachments", "attachment"],
  // aiassesment: ["aiassesment", "aiassessment", "AIassesment"],
  musthaverequirements: ["musthaverequirements", "musthaveskill", "musthaverequirement", "mandatoryrequirements", "requirements"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function parseStatus(raw?: string): SelectionStatus | undefined {
  const v = norm(raw ?? "");
  if (v === "pending") return "pending";
  if (v === "selected") return "selected";
  if (v === "notselected" || v === "rejected" || v === "declined") return "not_selected";
  if (v === "hired" || v === "tobehired") return "hired";
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Columns Configuration                                               */
/* ------------------------------------------------------------------ */
// Gap and risk, salary, notice period, skills and experience are no longer
// columns: their data is part of the "Overview" cell (see buildOverview).
const COLUMNS: { key: string; label: string; width: string }[] = [
  { key: "formtitle", label: "Job Title", width: "11%" },
  { key: "fullname", label: "Full Name", width: "11%" },
  { key: "attachments", label: "Attachments", width: "9%" },
  { key: "location", label: "Location", width: "12%" },
  { key: "totalscore", label: "Total Score", width: "9%" },
  { key: "summarycomment", label: "Overview", width: "48%" },
];

function resolveKey(rawHeaders: string[], key: string): string | null {
  const map = new Map(rawHeaders.map((h) => [norm(h), h]));
  for (const alias of KEY_ALIASES[key] ?? [key]) {
    const hit = map.get(norm(alias));
    if (hit) return hit;
  }
  return null;
}

function toNumber(value: unknown): number {
  const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanValue(value: unknown): string {
  const str = String(value ?? "").trim();
  return str.toLowerCase() === "null" ? "" : str;
}

function parseMustHave(raw: string): { met: number; total: number } | null {
  const match = raw.match(/(\d+)\s*(?:\/|of|out of)\s*(\d+)/i);
  if (!match) return null;
  return { met: Number(match[1]), total: Number(match[2]) };
}

function getAiRecommendation(
  cvScore: number,
  interviewScore: number | null,
  total: number | null,
  mustHave: { met: number; total: number } | null
): { verdict: "Hire" | "Do Not Hire" | "Manual Review"; reason: string } {
  if (interviewScore === null || total === null) {
    return { verdict: "Manual Review", reason: "Interview score not yet recorded." };
  }

  if (mustHave && mustHave.total > 0) {
    const ratio = mustHave.met / mustHave.total;
    if (ratio < 0.75) {
      return {
        verdict: "Do Not Hire",
        reason: `Only ${mustHave.met} of ${mustHave.total} mandatory requirements met.`,
      };
    }
  }

  if (total >= 80) {
    return { verdict: "Hire", reason: `Strong total score (${total.toFixed(1)}) with mandatory requirements met.` };
  }
  if (total >= 60) {
    return { verdict: "Manual Review", reason: `Moderate total score (${total.toFixed(1)}); review interview notes.` };
  }
  return { verdict: "Do Not Hire", reason: `Low total score (${total.toFixed(1)}).` };
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
      <path d="M4 7h14M4 12h10M4 17h6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// "Overview" cell: one structured summary that combines every cell of the row.
type OverviewSection = { label: string; value: string };
function buildOverview(
  c: Candidate,
  interview: number | null,
  total: number | null,
  verdict: string,
  statusLabel: string | undefined,
  feedback?: string
): { headline: string; sections: OverviewSection[] } {
  const has = (v?: string | null) => !!v && v !== NOT_AVAILABLE;
  const sections: OverviewSection[] = [];
  const add = (label: string, value?: string | null) => {
    if (has(value)) sections.push({ label, value: String(value).trim() });
  };

  const scores: string[] = [`CV match ${c.cvScore}%`];
  if (interview !== null) scores.push(`Interview ${interview}/100`);
  if (total !== null) scores.push(`Total ${Math.round(total)}`);
  if (has(c.mustHaveRequirements)) scores.push(`Must-have ${c.mustHaveRequirements}`);
  if (has(c.aiConfidenceLevel)) scores.push(`Confidence ${c.aiConfidenceLevel}`);

  const headline = [statusLabel, verdict ? `AI: ${verdict}` : "", ...scores]
    .filter(Boolean)
    .join(" · ");

  add("Strengths", c.strengths);
  add("Gap & risk", c.gapRisk);
  add("Summary", c.summary);
  add("Interview feedback", feedback);
  add("Experience", c.experience);
  add("Skills", c.skills);
  add("Expected salary", c.salary);
  add("Notice period", c.noticePeriod);
  add("Contact", [c.email, c.phone].filter((v) => has(v)).join(" · "));

  return { headline, sections };
}

function OverviewCell({
  overview,
  isExpanded,
  onToggle,
}: {
  overview: { headline: string; sections: OverviewSection[] };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { headline, sections } = overview;
  const preview = sections.find((x) => x.label === "Summary") ?? sections[0];
  return (
    <div className="flex items-start gap-2 min-w-0">
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-xs font-semibold text-slate-800">{headline}</p>
        {isExpanded ? (
          <dl className="space-y-1.5">
            {sections.map((sec) => (
              <div key={sec.label}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{sec.label}</dt>
                <dd className="text-xs text-slate-600 break-words">{sec.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          preview && <p className="text-xs text-slate-500 line-clamp-2 break-words">{preview.value}</p>
        )}
      </div>
      {sections.length > 0 && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-700"
          aria-label={isExpanded ? "Collapse" : "Expand"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

/* Helper function to truncate text to first 5 words */
function truncateToFiveWords(text: string): { truncated: string; isTruncated: boolean } {
  if (!text) return { truncated: "", isTruncated: false };
  const words = text.trim().split(/\s+/);
  if (words.length <= 5) return { truncated: text, isTruncated: false };
  return { truncated: words.slice(0, 5).join(" ") + "…", isTruncated: true };
}

/* Component for rendering expandable text cells */
function ExpandableTextCell({
  text,
  isExpanded,
  onToggle,
}: {
  text: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (text === NOT_AVAILABLE) return <p className="text-xs italic text-slate-400">{NOT_AVAILABLE}</p>;
  const { truncated, isTruncated } = truncateToFiveWords(text);
  return (
    <div className="flex items-start gap-2 min-w-0">
      <p className="text-xs text-slate-600 min-w-0 flex-1 whitespace-pre-wrap break-words">
        {isExpanded ? text : truncated}
      </p>
      {isTruncated && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-700"
          aria-label={isExpanded ? "Collapse" : "Expand"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

function ValueOrNotAvailable({ text }: { text: string }) {
  if (text === NOT_AVAILABLE) {
    return <span className="text-xs italic text-slate-400">{NOT_AVAILABLE}</span>;
  }
  return <>{text}</>;
}

// Metallic gradient per file type (light edge -> deep body -> light edge).
function attachmentTone(ext: string): string {
  switch (ext.toLowerCase().replace(/^\./, "")) {
    case "doc":
    case "docx":
      return "from-sky-300 via-blue-600 to-blue-800";
    case "ppt":
    case "pptx":
      return "from-amber-300 via-orange-600 to-orange-800";
    case "pdf":
      return "from-rose-300 via-red-600 to-red-800";
    case "txt":
      return "from-slate-300 via-slate-500 to-slate-700";
    case "mp4":
    case "mov":
      return "from-fuchsia-300 via-purple-600 to-purple-800";
    case "xls":
    case "xlsx":
    case "csv":
      return "from-emerald-300 via-green-600 to-green-800";
    default:
      return "from-teal-300 via-teal-600 to-teal-800";
  }
}

// Clickable attachment chip: opens a small fly-out menu that shows a loading
// state first, then the file details.
function AttachmentChip({
  ext,
  tone,
  candidateName,
  cvLink,
}: {
  ext: string;
  tone: string;
  candidateName: string;
  cvLink: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 900);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if ((t as HTMLElement).closest?.("[data-attachment-menu]")) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const width = 224;
      setPos({
        top: r.bottom + 6,
        left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
      });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`cursor-pointer rounded-md bg-gradient-to-br px-2 py-0.5 text-[11px] font-semibold uppercase text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_2px_rgba(15,23,42,0.35)] ring-1 ring-inset ring-white/20 transition hover:brightness-110 ${tone}`}
      >
        {ext}
      </button>
      {open && (
        <div
          data-attachment-menu
          role="menu"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: 224 }}
          className="z-50 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-xl"
        >
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-slate-500" role="status">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
              Loading {ext.toUpperCase()} file…
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-slate-800">{ext.toUpperCase()} attachment</p>
              <dl className="space-y-1">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Candidate</dt>
                  <dd className="truncate font-medium">{candidateName}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">File type</dt>
                  <dd className="font-medium uppercase">{ext}</dd>
                </div>
              </dl>
              {cvLink ? (
                <a
                  href={cvLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  className="block rounded-md bg-slate-800 px-2 py-1.5 text-center font-medium text-white hover:bg-slate-700"
                >
                  Open CV
                </a>
              ) : (
                <p className="italic text-slate-400">No file link available.</p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Cell renderers                                                      */
/* ------------------------------------------------------------------ */

function CvScoreBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${safe}%` }} />
      </div>
      <span className="w-9 text-sm font-medium text-slate-700">{safe}%</span>
    </div>
  );
}

/** Pen icon only until a score exists, then score + pen. */
function InterviewScoreCell({
  value,
  onEdit,
}: {
  value: number | null;
  onEdit: () => void;
}) {
  const safe = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      {value !== null && (
        <>
          <span className="w-8 text-sm font-medium text-slate-700">{safe}</span>
          <div className="h-2 w-14 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${safe}%` }} />
          </div>
        </>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label={value === null ? "Add interview score" : "Edit interview score"}
      >
        <EditIcon />
      </button>
    </div>
  );
}

function TotalScoreCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs italic text-slate-400">—</span>;
  return (
    <span className="inline-flex items-center rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">
      {value.toFixed(1)}
    </span>
  );
}

function RecommendationBadge({
  verdict,
  reason,
}: {
  verdict: "Hire" | "Do Not Hire" | "Manual Review";
  reason: string;
}) {
  const tone =
    verdict === "Hire"
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
      : verdict === "Do Not Hire"
        ? "bg-rose-100 text-rose-600 ring-1 ring-rose-300"
        : "bg-amber-100 text-amber-700 ring-1 ring-amber-300";
  return (
    <div className="space-y-1">
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
        {verdict}
      </span>
      <p className="text-xs text-slate-500 whitespace-pre-wrap break-words">{reason}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function InterviewEvaluationPage() {
  const { user: contextUser } = useUser();


  const user: NavProps["user"] = [
    contextUser.name,
    contextUser.profilePic,
    contextUser.notificationNumber,
    contextUser.purchasePlan,
    contextUser.WebHook_Url["InterviewEvaluation"] || "WebHook_Url:InterviewEvaluation",
  ];

  /* ---------------- fetched candidate data ---------------- */
  const [datas, setDatas] = useState<TableData | null>(null);

  /* ---------------- persisted evaluations (Supabase) ---------------- */
  const { rows: evals, loading: evalsLoading, saveEvaluation } = useEvaluations();

  const interviewScores = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of Object.values(evals)) {
      if (row.interview_score !== null && row.interview_score !== undefined) {
        map[row.candidate_key] = Number(row.interview_score);
      }
    }
    return map;
  }, [evals]);

  const statuses = useMemo(() => {
    const map: Record<string, SelectionStatus> = {};
    for (const row of Object.values(evals)) {
      if (row.status) map[row.candidate_key] = row.status as SelectionStatus;
    }
    return map;
  }, [evals]);


  const feedbacks = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of Object.values(evals)) {
      if (row.feedback) map[row.candidate_key] = row.feedback;
    }
    return map;
  }, [evals]);

  const sentMails = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const row of Object.values(evals)) {
      if (row.mail_sent) map[row.candidate_key] = true;
    }
    return map;
  }, [evals]);

  /* ---------------- ui state ---------------- */
  const { minScoreInput, setMinScoreInput } = useMinScoreSetting();
  const [search, setSearch] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("totalScore");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [sortOpen, setSortOpen] = useState<boolean>(false);
  const [scoreFor, setScoreFor] = useState<Candidate | null>(null);
  const [scoreDraft, setScoreDraft] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [statusOpenFor, setStatusOpenFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");
  const [sendingMail, setSendingMail] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState<number>(3800);
  const isSyncingScroll = useRef(false);


  /* ---------------- feedback modal state ---------------- */
  const [feedbackFor, setFeedbackFor] = useState<Candidate | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<string>("");
  const [feedbackMode, setFeedbackMode] = useState<"view" | "edit">("edit");
  const [detailForId, setDetailForId] = useState<string | null>(null);

  const minScore = useMemo(() => {
    const parsed = Number(minScoreInput);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(100, parsed));
  }, [minScoreInput]);

  /* ---------------- webhook rows -> candidates ---------------- */
  const candidates: Candidate[] = useMemo(() => {
    if (!datas) return [];
    const rawHeaders = Object.keys(datas);
    if (rawHeaders.length === 0) return [];

    const nameKey = resolveKey(rawHeaders, "fullname");
    const titleKey = resolveKey(rawHeaders, "formtitle");
    const emailKey = resolveKey(rawHeaders, "email");
    const scoreKey = resolveKey(rawHeaders, "atsscore");
    const phoneKey = resolveKey(rawHeaders, "phoneno");
    const cvLinkKey = resolveKey(rawHeaders, "cvlink");
    const aiConfidenceKey = resolveKey(rawHeaders, "aiconfidencelevel");
    const strengthsKey = resolveKey(rawHeaders, "strengths");
    const gapRiskKey = resolveKey(rawHeaders, "gaprisk");
    const summaryKey = resolveKey(rawHeaders, "summarycomment");
    const salaryKey = resolveKey(rawHeaders, "salary");
    const noticePeriodKey = resolveKey(rawHeaders, "noticeperiod");
    const skillsKey = resolveKey(rawHeaders, "skills");
    const experienceKey = resolveKey(rawHeaders, "experience");
    const locationKey = resolveKey(rawHeaders, "location");
    const attachmentKey = resolveKey(rawHeaders, "attachments");
    const finalStatusKey = resolveKey(rawHeaders, "finalstatus");
    // const aiAssessmentKey = resolveKey(rawHeaders, "aiassesment");
    const mustHaveKey = resolveKey(rawHeaders, "musthaverequirements");
    const rowCount = Array.isArray(datas[rawHeaders[0]]) ? datas[rawHeaders[0]].length : 0;

    const list: Candidate[] = [];
    for (let i = 0; i < rowCount; i++) {
      const name = nameKey ? String(datas[nameKey][i] ?? "") : "";
      if (!name || name.toLowerCase() === "null") continue;

      const email = emailKey ? String(datas[emailKey][i] ?? "") : "";

      list.push({
        // email is stable across reorders; index fallback only if email is missing
        id: email && email.toLowerCase() !== "null" ? email : `row-${i}`,
        name,
        role: titleKey ? (cleanValue(datas[titleKey]?.[i]) || NOT_AVAILABLE) : NOT_AVAILABLE,
        email,
        phone: phoneKey ? cleanValue(datas[phoneKey]?.[i]) : "",
        cvScore: scoreKey ? toNumber(datas[scoreKey][i]) : 0,
        cvLink: cvLinkKey ? cleanValue(datas[cvLinkKey]?.[i]) : "",
        aiConfidenceLevel: aiConfidenceKey ? cleanValue(datas[aiConfidenceKey]?.[i]) : "",
        strengths: strengthsKey ? cleanValue(datas[strengthsKey]?.[i]) : "",
        gapRisk: gapRiskKey ? cleanValue(datas[gapRiskKey]?.[i]) : "",

        summary: summaryKey ? cleanValue(datas[summaryKey]?.[i]) : "",
        salary: salaryKey ? cleanValue(datas[salaryKey]?.[i]) : "",
        noticePeriod: noticePeriodKey ? cleanValue(datas[noticePeriodKey]?.[i]) : "",
        skills: skillsKey ? cleanValue(datas[skillsKey]?.[i]) : "",
        experience: experienceKey ? cleanValue(datas[experienceKey]?.[i]) : "",
        location: locationKey ? cleanValue(datas[locationKey]?.[i]) : "",
        attachment: attachmentKey ? cleanValue(datas[attachmentKey]?.[i]) : "",
        dataStatus: finalStatusKey ? parseStatus(cleanValue(datas[finalStatusKey]?.[i])) : undefined,
        // aiAssessment: aiAssessmentKey ? String(datas[aiAssessmentKey][i] ?? "") : "",
        mustHaveRequirements: mustHaveKey ? cleanValue(datas[mustHaveKey]?.[i]) : "",
      });
    }
    return list;
  }, [datas]);

  // Final Status per candidate: a choice made in this app (Supabase) wins,
  // otherwise the status that came with the n8n data (same as Interview & Selection).
  const allStatuses = useMemo(() => {
    const map: Record<string, SelectionStatus> = {};
    for (const c of candidates) {
      const status = statuses[c.id] ?? c.dataStatus;
      if (status) map[c.id] = status;
    }
    return map;
  }, [candidates, statuses]);

  useEffect(() => {
    const measure = () => {
      if (mainScrollRef.current) setTableScrollWidth(mainScrollRef.current.scrollWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [candidates]);

  const handleMainScroll = () => {
    if (isSyncingScroll.current) { isSyncingScroll.current = false; return; }
    if (mainScrollRef.current && topScrollRef.current) {
      isSyncingScroll.current = true;
      topScrollRef.current.scrollLeft = mainScrollRef.current.scrollLeft;
    }
  };

  const handleTopScroll = () => {
    if (isSyncingScroll.current) { isSyncingScroll.current = false; return; }
    if (mainScrollRef.current && topScrollRef.current) {
      isSyncingScroll.current = true;
      mainScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  /* ---------------- total = average of CV and interview score ---------------- */
  const totalOf = useCallback(
    (candidate: Candidate): number | null => {
      const interview = interviewScores[candidate.id];
      if (interview === undefined) return null;
      return (candidate.cvScore + interview) / 2;
    },
    [interviewScores]
  );

  const rankedRows = useMemo(() => {
    const dir = sortOrder === "desc" ? 1 : -1;

    // Only candidates marked Selected / To Be Hired on Interview & Selection.
    const shortlisted = candidates.filter((c) => {
      const st = allStatuses[c.id];
      return st === "selected" || st === "hired";
    });

    const withTotals = shortlisted.map((candidate) => ({
      candidate,
      interview: interviewScores[candidate.id] ?? null,
      total: totalOf(candidate),
    }));

    // Unscored candidates stay visible, otherwise nobody could ever be scored.
    // Delete `t.total === null ||` for a strict filter.
    const ranked = withTotals
      .filter((t) => t.total === null || t.total >= minScore)
      .sort((a, b) => {
        if (sortKey === "name") {
          return (
            a.candidate.name.localeCompare(b.candidate.name) *
            (sortOrder === "desc" ? -1 : 1)
          );
        }
        const pick = (row: typeof a) =>
          sortKey === "cvScore"
            ? row.candidate.cvScore
            : sortKey === "interviewScore"
              ? row.interview ?? -1
              : row.total ?? -1;
        const primary = (pick(b) - pick(a)) * dir;
        if (primary !== 0) return primary;
        return a.candidate.name.localeCompare(b.candidate.name);
      })
      .map((row, index) => ({ ...row, rank: index + 1 }));

    const query = search.trim().toLowerCase();
    if (!query) return ranked;

    return ranked.filter(
      ({ candidate }) =>
        candidate.name.toLowerCase().includes(query) ||
        candidate.role.toLowerCase().includes(query)
    );
  }, [candidates, allStatuses, interviewScores, minScore, search, sortKey, sortOrder, totalOf]);

  const detailCandidate = candidates.find((c) => c.id === detailForId) ?? null;
  const detailInterview = detailCandidate ? interviewScores[detailCandidate.id] ?? null : null;
  const detailTotal = detailCandidate ? totalOf(detailCandidate) : null;

  const confirmedCount = useMemo(
    () => Object.values(allStatuses).filter((s) => s === "selected" || s === "hired").length,
    [allStatuses]
  );

  /* ---------------- status dropdown auto-close after 10s ---------------- */
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!statusOpenFor) return;
    closeTimer.current = setTimeout(() => setStatusOpenFor(null), 10000);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [statusOpenFor]);

  /* ---------------- score modal ---------------- */
  function openScoreModal(candidate: Candidate) {
    setScoreFor(candidate);
    setScoreDraft((evals[candidate.id]?.breakdown as Breakdown) ?? EMPTY_BREAKDOWN);
  }

  function draftTotal(draft: Breakdown): number {
    return CRITERIA.reduce((sum, c) => {
      const raw = Number(draft[c.key]);
      const safe = Number.isFinite(raw) ? Math.max(0, Math.min(c.max, raw)) : 0;
      return sum + safe;
    }, 0);
  }

  async function submitScore() {
    if (!scoreFor) return;
    const total = draftTotal(scoreDraft);
    const ok = await saveEvaluation(scoreFor.id, {
      candidate_name: scoreFor.name,
      job_title: scoreFor.role,
      interview_score: total,
      breakdown: scoreDraft,
      mail_sent: false,
    });
    if (!ok) setToast("Score shown locally but not saved. Check the Supabase connection.");
    setScoreFor(null);
    setScoreDraft(EMPTY_BREAKDOWN);
  }

  /* ---------------- feedback modal ---------------- */
  function openFeedback(candidate: Candidate, mode: "view" | "edit") {
    setFeedbackFor(candidate);
    setFeedbackDraft(feedbacks[candidate.id] ?? "");
    setFeedbackMode(mode);
  }

  async function saveFeedback() {
    if (!feedbackFor) return;
    const ok = await saveEvaluation(feedbackFor.id, {
      candidate_name: feedbackFor.name,
      job_title: feedbackFor.role,
      feedback: feedbackDraft.trim(),
    });
    if (!ok) setToast("Note shown locally but not saved. Check the Supabase connection.");
    setFeedbackFor(null);
    setFeedbackDraft("");
  }

  /* ---------------- status ---------------- */
  async function changeStatus(candidate: Candidate, status: SelectionStatus) {
    setStatusOpenFor(null);
    const ok = await saveEvaluation(candidate.id, {
      candidate_name: candidate.name,
      job_title: candidate.role,
      status,
      mail_sent: false,
    });
    if (!ok) setToast("Status shown locally but not saved. Check the Supabase connection.");
  }

  /* ---------------- mail ---------------- */
  async function sendConfirmationMail(candidate: Candidate) {
    setSendingMail(candidate.id);

    const payload = {
      rowId: candidate.id,
      name: candidate.name,
      email: candidate.email,
      jobTitle: candidate.role,
      cvScore: candidate.cvScore,
      interviewScore: interviewScores[candidate.id] ?? null,
      interviewBreakdown: evals[candidate.id]?.breakdown ?? null,
      totalScore: totalOf(candidate),
      status: allStatuses[candidate.id] ?? "recommended",
      feedback: feedbacks[candidate.id] ?? "",
    };

    try {
      const res = await fetch(CONFIRMATION_MAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let ok = true;
      try {
        const data = await res.json();
        const flag = String(data?.status ?? data?.result ?? data?.message ?? "").toLowerCase();
        if (flag) ok = ["success", "sent", "ok", "true", "200"].includes(flag);
        else if (typeof data?.success === "boolean") ok = data.success;
      } catch {
        // empty or non-JSON body: a 2xx is good enough
      }

      if (!ok) throw new Error("Webhook reported a failure");

      await saveEvaluation(candidate.id, {
        candidate_name: candidate.name,
        job_title: candidate.role,
        mail_sent: true,
      });
      setToast(`Confirmation mail sent to ${candidate.name}.`);
    } catch {
      setToast(`Could not send the mail to ${candidate.name}. Check the webhook.`);
    } finally {
      setSendingMail(null);
    }
  }

  function finalizeSelection() {
    if (confirmedCount === 0) {
      setToast("Set at least one candidate to Selected or Hired before sending offers.");
      return;
    }
    setToast(`Offers sent to ${confirmedCount} candidate${confirmedCount > 1 ? "s" : ""}.`);
  }

  return (
    <NavAndSidebar user={user} sidebarHeight="h-screen">
      {/* search box + "+" column filters; also loads and filters the data */}
      <div className="mb-4">
        <TableComponent
          title="Candidates"
          headerOnly
          filterColumns={COLUMNS.map((c) => ({ label: c.label, aliases: KEY_ALIASES[c.key] ?? [c.key] }))}
          cols={[]}
          baseUrl={CANDIDATE_DATA_URL}
          userId="gh"
          onData={setDatas}
          debug={false}
          dataBaseId="candidate"
        >
          <></>
        </TableComponent>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        {/* Card header: threshold + search + sort */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-medium text-slate-800">
              Show candidates with a total score of at least
            </p>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                value={minScoreInput}
                onChange={(e) => setMinScoreInput(e.target.value)}
                className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-base font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                aria-label="Minimum total score"
              />
              <span className="text-base font-medium text-slate-800"></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((open) => !open)}
                className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Sort options"
              >
                <SortIcon />
              </button>

              {sortOpen ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {(
                      [
                        { key: "totalScore", label: "Total score" },
                        { key: "cvScore", label: "CV score" },
                        { key: "interviewScore", label: "Interview score" },
                        { key: "name", label: "Candidate name" },
                      ] as { key: SortKey; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setSortKey(option.key);
                          setSortOpen(false);
                        }}
                        className={[
                          "block w-full rounded-md px-3 py-2 text-left text-sm",
                          sortKey === option.key
                            ? "bg-teal-50 font-medium text-teal-700"
                            : "text-slate-600 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        Sort by {option.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Table */}
        <style jsx>{`
  .no-native-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-native-scrollbar {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
`}</style>
        <div className="relative mt-4">
          <div
            ref={mainScrollRef}
            onScroll={handleMainScroll}
            className="overflow-x-auto rounded-lg border border-slate-200 no-native-scrollbar"
          >
            <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
              <colgroup>
                {COLUMNS.map((col) => (
                  <col key={col.key} style={{ width: col.width }} />
                ))}
              </colgroup>

              <thead className="bg-slate-100 text-xs font-bold text-slate-600">
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="px-3 py-3">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {rankedRows.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-slate-500">
                      {datas === null || evalsLoading
                        ? "Loading candidates…"
                        : `No candidate reached ${minScore}. Lower the score to see more people.`}
                    </td>
                  </tr>
                ) : (
                  rankedRows.map(({ candidate, interview, total, rank }) => {
                    const chosen = allStatuses[candidate.id];
                    const isRecommended = total !== null && total >= minScore;
                    const recommendation = getAiRecommendation(
                      candidate.cvScore,
                      interview,
                      total,
                      parseMustHave(candidate.mustHaveRequirements)
                    );
                    const rowTone =
                      chosen === "not_selected"
                        ? "bg-rose-50"
                        : chosen === "hired"
                          ? "bg-violet-50"
                          : chosen === "selected"
                            ? "bg-sky-50"
                            : isRecommended
                              ? "bg-emerald-50/50"
                              : "bg-white";

                    return (
                      <tr key={candidate.id} className={rowTone}>
                        {/* Render dynamic columns from COLUMNS */}
                        {COLUMNS.map((col) => {
                          const isExpanded = expandedRows.has(`${candidate.id}-${col.key}`);
                          const toggleExpand = () => {
                            const key = `${candidate.id}-${col.key}`;
                            setExpandedRows((prev) => {
                              const newSet = new Set(prev);
                              if (newSet.has(key)) newSet.delete(key);
                              else newSet.add(key);
                              return newSet;
                            });
                          };
                          let cellContent: any = NOT_AVAILABLE;
                          switch (col.key) {
                            case "fullname":
                              cellContent = (
                                <button
                                  type="button"
                                  onClick={() => setDetailForId(candidate.id)}
                                  className="text-left font-medium text-slate-800 hover:text-teal-700 hover:underline"
                                >
                                  {candidate.name}
                                </button>
                              );
                              break;
                            case "formtitle":
                              cellContent = candidate.role;
                              break;
                            case "email":
                              cellContent = candidate.email;
                              break;
                            case "totalscore":
                              cellContent = <TotalScoreCell value={total} />;
                              break;
                            case "location":
                              cellContent = candidate.location || NOT_AVAILABLE;
                              break;
                            case "phoneno":
                              cellContent = candidate.phone || NOT_AVAILABLE;
                              break;
                            case "attachments": {
                              // Shows exactly what the n8n table's Attchments column holds.
                              const att = candidate.attachment;
                              cellContent = /^https?:\/\//i.test(att) ? (
                                <a href={att} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                  View attachment
                                </a>
                              ) : att ? (
                                <div className="flex flex-wrap gap-1">
                                  {att
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean)
                                    .map((t, i) => (
                                      <AttachmentChip
                                        key={`${t}-${i}`}
                                        ext={t}
                                        tone={attachmentTone(t)}
                                        candidateName={candidate.name}
                                        cvLink={candidate.cvLink}
                                      />
                                    ))}
                                </div>
                              ) : (NOT_AVAILABLE);
                              break;
                            }
                            case "cvlink":
                              cellContent = candidate.cvLink ? (
                                <a href={candidate.cvLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                  View CV
                                </a>
                              ) : (NOT_AVAILABLE);
                              break;
                            case "atsscore":
                              cellContent = `${candidate.cvScore}%`;
                              break;
                            case "aiconfidencelevel":
                              cellContent = candidate.aiConfidenceLevel || NOT_AVAILABLE;
                              break;
                            case "strengths":
                              cellContent = <ExpandableTextCell text={candidate.strengths || NOT_AVAILABLE} isExpanded={isExpanded} onToggle={toggleExpand} />;
                              break;
                            case "gaprisk":
                              cellContent = <ExpandableTextCell text={candidate.gapRisk || NOT_AVAILABLE} isExpanded={isExpanded} onToggle={toggleExpand} />;
                              break;
                            case "summarycomment":
                              cellContent = (
                                <OverviewCell
                                  overview={buildOverview(
                                    candidate,
                                    interview,
                                    total,
                                    recommendation.verdict,
                                    chosen ? STATUS_OPTIONS.find((o) => o.value === chosen)?.label : undefined,
                                    feedbacks[candidate.id]
                                  )}
                                  isExpanded={isExpanded}
                                  onToggle={toggleExpand}
                                />
                              );
                              break;
                            case "salary":
                              cellContent = candidate.salary || NOT_AVAILABLE;
                              break;
                            case "noticeperiod":
                              cellContent = candidate.noticePeriod || NOT_AVAILABLE;
                              break;
                            case "skills":
                              cellContent = <ExpandableTextCell text={candidate.skills || NOT_AVAILABLE} isExpanded={isExpanded} onToggle={toggleExpand} />;
                              break;
                            case "experience":
                              cellContent = <ExpandableTextCell text={candidate.experience || NOT_AVAILABLE} isExpanded={isExpanded} onToggle={toggleExpand} />;
                              break;
                            // case "aiassesment":
                            //   cellContent = <ExpandableTextCell text={candidate.aiAssessment || "—"} isExpanded={isExpanded} onToggle={toggleExpand} />;
                            //   break;
                            case "musthaverequirements":
                              cellContent = <ExpandableTextCell text={candidate.mustHaveRequirements || NOT_AVAILABLE} isExpanded={isExpanded} onToggle={toggleExpand} />;
                              break;
                          }
                          return (
                            <td key={col.key} className="px-3 py-3 text-slate-700 text-xs align-top">
                              {cellContent}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="sticky bottom-0 z-20 overflow-x-auto overflow-y-hidden bg-white"
            style={{ height: "14px" }}
          >
            <div style={{ width: tableScrollWidth, height: "1px" }} />
          </div>
        </div>

        {/* Card footer */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        </div>

        {toast ? (
          <p className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">{toast}</p>
        ) : null}
      </div>

      {/* ---------------- Interview score modal ---------------- */}
      {scoreFor ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Interview score for {scoreFor.name}
            </h2>
            <p className="mt-1 text-sm text-slate-400/70">
              Enter scores to calculate the candidate&apos;s overall interview score.
            </p>

            <div className="mt-4 space-y-3">
              {CRITERIA.map((criterion) => (
                <div key={criterion.key} className="flex items-center justify-between gap-3">
                  <label htmlFor={`score-${criterion.key}`} className="text-sm text-slate-700">
                    {criterion.label}
                    <span className="ml-1 text-xs text-slate-400">/ {criterion.max}</span>
                  </label>
                  <input
                    id={`score-${criterion.key}`}
                    type="number"
                    min={0}
                    max={criterion.max}
                    value={scoreDraft[criterion.key]}
                    onChange={(e) =>
                      setScoreDraft((prev) => ({ ...prev, [criterion.key]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-20 shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-500">Overall interview score</span>
              <span className="text-base font-semibold text-slate-800">
                {draftTotal(scoreDraft)} / 100
              </span>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setScoreFor(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitScore}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------------- Feedback modal ---------------- */}
      {feedbackFor ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Feedback for {feedbackFor.name}
            </h2>
            <p className="mt-1 text-sm text-slate-400/70">{feedbackFor.role}</p>

            {feedbackMode === "view" ? (
              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {feedbacks[feedbackFor.id]}
              </p>
            ) : (
              <textarea
                value={feedbackDraft}
                onChange={(e) => setFeedbackDraft(e.target.value)}
                rows={5}
                placeholder="What stood out in the interview?"
                className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackFor(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              {feedbackMode === "view" ? (
                <button
                  type="button"
                  onClick={() => setFeedbackMode("edit")}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                >
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveFeedback}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Save note
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {/* ---------------- Candidate detail modal ---------------- */}
      {detailCandidate ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">Candidate Details</h2>
              <button
                type="button"
                onClick={() => setDetailForId(null)}
                className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 text-sm space-y-3">
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Candidate Name:</span>
                <span className="text-slate-600 break-words">{detailCandidate.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Job Title:</span>
                <span className="text-slate-600 break-words">{detailCandidate.role}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Email:</span>
                <span className="text-slate-600 break-words">{detailCandidate.email || NOT_AVAILABLE}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Phone No:</span>
                <span className="text-slate-600 break-words">{detailCandidate.phone || NOT_AVAILABLE}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">CV Link:</span>
                {detailCandidate.cvLink ? (
                  <a href={detailCandidate.cvLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-words">
                    View CV
                  </a>
                ) : (
                  <span className="text-slate-600">NOT_AVAILABLE</span>
                )}
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">ATS / CV Score:</span>
                <span className="text-slate-600">{detailCandidate.cvScore}%</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">AI Confidence Level:</span>
                <span className="text-slate-600 break-words">
                  {detailCandidate.aiConfidenceLevel || NOT_AVAILABLE}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Strengths:</span>
                <span className="text-slate-600 whitespace-pre-wrap break-words">{detailCandidate.strengths || NOT_AVAILABLE}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Potential Gap and Risk:</span>
                <span className="text-slate-600 whitespace-pre-wrap break-words">{detailCandidate.gapRisk || NOT_AVAILABLE}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Summary:</span>
                <span className="text-slate-600 whitespace-pre-wrap break-words">{detailCandidate.summary || NOT_AVAILABLE}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Expected Salary:</span>
                <span className="text-slate-600 break-words">{detailCandidate.salary || NOT_AVAILABLE}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Notice Period:</span>
                <span className="text-slate-600 break-words">{detailCandidate.noticePeriod || NOT_AVAILABLE}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Skills:</span>
                <span className="text-slate-600 whitespace-pre-wrap break-words">{detailCandidate.skills || NOT_AVAILABLE}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Experience:</span>
                <span className="text-slate-600 whitespace-pre-wrap break-words">{detailCandidate.experience || NOT_AVAILABLE}</span>
              </div>
              {/* <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">AI Assessment:</span>
                <span className="text-slate-600 whitespace-pre-wrap break-words">{detailCandidate.aiAssessment || "—"}</span>
              </div> */}
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Interview Score:</span>
                <span className="text-slate-600">{detailInterview !== null ? detailInterview : ""}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0">Total Score:</span>
                <span className="text-slate-600">{detailTotal !== null ? detailTotal.toFixed(1) : ""}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </NavAndSidebar>
  );
}