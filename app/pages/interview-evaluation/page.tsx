"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import TableComponent, { type TableData } from "@/app/components/TableComponent";

type NavProps = ComponentProps<typeof NavAndSidebar>;

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const CANDIDATE_DATA_URL = "https://n8naurora.duckdns.org/webhook/candidate-data";
const CONFIRMATION_MAIL_URL = "https://n8naurora.duckdns.org/webhook/sent-email";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SelectionStatus = "selected" | "not_selected" | "hired";
type SortKey = "totalScore" | "cvScore" | "interviewScore" | "name";
type SortOrder = "desc" | "asc";

interface Candidate {
  id: string;
  name: string;
  role: string; // job title from the form
  email: string;
  cvScore: number;
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

/* ------------------------------------------------------------------ */
/* Webhook column mapping (same idea as candidate-scoring)             */
/* ------------------------------------------------------------------ */

const KEY_ALIASES: Record<string, string[]> = {
  fullname: ["fullname", "name", "candidatename"],
  formtitle: ["formtitle", "jobtitle", "title"],
  email: ["email", "emailaddress"],
  atsscore: ["atsscore", "score", "ats", "candidatescore", "cvscore"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

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

/** Interview score out of 100. Pen icon only until a score exists, then score + pen. */
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

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function InterviewEvaluationPage() {
  const pageInfo: NavProps["pageInfo"] = [
    "Interview Evaluation",
    "Shortlisted candidates are reviewed here with their CV score, interview score and interviewer feedback before offers go out.",
    "interview-evaluation",
  ];

  const user: NavProps["user"] = [
    "Recruiter",
    "/profile.png",
    0,
    "Premium Pro",
    "WebHook_Url:InterviewEvaluation",
  ];

  /* ---------------- fetched data ---------------- */
  const [datas, setDatas] = useState<TableData | null>(null);

  /* ---------------- recruiter input ---------------- */
  const [interviewScores, setInterviewScores] = useState<Record<string, number>>({});
  const [breakdowns, setBreakdowns] = useState<Record<string, Breakdown>>({});
  const [statuses, setStatuses] = useState<Record<string, SelectionStatus>>({});

  /* ---------------- ui state ---------------- */
  const [minScoreInput, setMinScoreInput] = useState<string>("83");
  const [search, setSearch] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("totalScore");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [sortOpen, setSortOpen] = useState<boolean>(false);
  const [scoreFor, setScoreFor] = useState<Candidate | null>(null);
  const [scoreDraft, setScoreDraft] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [statusOpenFor, setStatusOpenFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");
  const [sendingMail, setSendingMail] = useState<string | null>(null);
  const [sentMails, setSentMails] = useState<Record<string, boolean>>({});
  /* ---------------- feedback ---------------- */
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [feedbackFor, setFeedbackFor] = useState<Candidate | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<string>("");
  const [feedbackMode, setFeedbackMode] = useState<"view" | "edit">("edit");

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

    const rowCount = Array.isArray(datas[rawHeaders[0]]) ? datas[rawHeaders[0]].length : 0;

    const list: Candidate[] = [];
    for (let i = 0; i < rowCount; i++) {
      const name = nameKey ? String(datas[nameKey][i] ?? "") : "";
      if (!name || name.toLowerCase() === "null") continue;

      list.push({
        id: `row-${i}`,
        name,
        role: titleKey ? String(datas[titleKey][i] ?? "—") : "—",
        email: emailKey ? String(datas[emailKey][i] ?? "") : "",
        cvScore: scoreKey ? toNumber(datas[scoreKey][i]) : 0,
      });
    }
    return list;
  }, [datas]);

  /* ---------------- total = average of CV score and interview score ---------------- */
  function totalOf(candidate: Candidate): number | null {
    const interview = interviewScores[candidate.id];
    if (interview === undefined) return null;
    return (candidate.cvScore + interview) / 2;
  }

  const rankedRows = useMemo(() => {
    const dir = sortOrder === "desc" ? 1 : -1;

    const withTotals = candidates.map((candidate) => ({
      candidate,
      interview: interviewScores[candidate.id] ?? null,
      total: totalOf(candidate),
    }));

    // Candidates that have no interview score yet are always kept visible,
    // otherwise nobody would ever be scoreable. Scored ones must clear the threshold.
    // Delete the `t.total === null ||` part if you want a strict filter.
    const ranked = withTotals
      .filter((t) => t.total === null || t.total >= minScore)
      .sort((a, b) => {
        if (sortKey === "name") {
          return a.candidate.name.localeCompare(b.candidate.name) * (sortOrder === "desc" ? -1 : 1);
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
  }, [candidates, interviewScores, minScore, search, sortKey, sortOrder]);

  const confirmedCount = useMemo(
    () => Object.values(statuses).filter((s) => s === "selected" || s === "hired").length,
    [statuses]
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
    setScoreDraft(breakdowns[candidate.id] ?? EMPTY_BREAKDOWN);
  }

  function draftTotal(draft: Breakdown): number {
    return CRITERIA.reduce((sum, c) => {
      const raw = Number(draft[c.key]);
      const safe = Number.isFinite(raw) ? Math.max(0, Math.min(c.max, raw)) : 0;
      return sum + safe;
    }, 0);
  }

  function submitScore() {
    if (!scoreFor) return;
    const id = scoreFor.id;
    const total = draftTotal(scoreDraft);
    setBreakdowns((prev) => ({ ...prev, [id]: scoreDraft }));
    setInterviewScores((prev) => ({ ...prev, [id]: total }));
    setScoreFor(null);
    setScoreDraft(EMPTY_BREAKDOWN);
    // TODO: POST { candidateId, breakdown, total } to n8n here if you want it persisted
  }

  /* ---------------- feedback modal ---------------- */
  function openFeedback(candidate: Candidate, mode: "view" | "edit") {
    setFeedbackFor(candidate);
    setFeedbackDraft(feedbacks[candidate.id] ?? "");
    setFeedbackMode(mode);
  }

  function saveFeedback() {
    if (!feedbackFor) return;
    const id = feedbackFor.id;
    setFeedbacks((prev) => ({ ...prev, [id]: feedbackDraft.trim() }));
    setFeedbackFor(null);
    setFeedbackDraft("");
  }

  /* ---------------- mail ---------------- */
  async function sendConfirmationMail(candidate: Candidate) {
    setSendingMail(candidate.id);

    // full row payload
    const payload = {
      rowId: candidate.id,
      name: candidate.name,
      email: candidate.email,
      jobTitle: candidate.role,
      cvScore: candidate.cvScore,
      interviewScore: interviewScores[candidate.id] ?? null,
      interviewBreakdown: breakdowns[candidate.id] ?? null,
      totalScore: totalOf(candidate),
      status: statuses[candidate.id] ?? "recommended",
      feedback: feedbacks[candidate.id] ?? "",
    };

    try {
      const res = await fetch(CONFIRMATION_MAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // n8n returns something like { status: "success" } — accept a few shapes
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

      setSentMails((prev) => ({ ...prev, [candidate.id]: true }));
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
    <NavAndSidebar pageInfo={pageInfo} user={user} sidebarHeight="h-screen">
      {/* data fetcher only — renders no UI */}
      <div className="hidden">
        <TableComponent
          title=""
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
              Final review of top candidates with scores &gt;=
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
              <span className="text-base font-medium text-slate-800">%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-500 focus-within:border-teal-500">
              <SearchIcon />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-40 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                aria-label="Search candidates"
              />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
              title={sortOrder === "desc" ? "Showing high to low" : "Showing low to high"}
              aria-label="Toggle sort order"
            >
              <FilterIcon />
            </button>

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
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead className="bg-slate-100 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Rank</th>
                <th className="px-3 py-3">Candidate Name</th>
                <th className="px-3 py-3">Job Title</th>
                <th className="px-3 py-3">CV Score (%)</th>
                <th className="px-3 py-3">Interview Score (100)</th>
                <th className="px-3 py-3">Total Score</th>
                <th className="px-3 py-3">Final Status</th>
                <th className="px-3 py-3">Feedback</th>
                <th className="px-3 py-3">Confirmation Mail</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {rankedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                    {datas === null
                      ? "Loading candidates…"
                      : `No candidate reached ${minScore}. Lower the score to see more people.`}
                  </td>
                </tr>
              ) : (
                rankedRows.map(({ candidate, interview, total, rank }) => {
                  const chosen = statuses[candidate.id];
                  const isRecommended = total !== null && total >= minScore;

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
                      <td className="px-3 py-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-white">
                          {rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">{candidate.name}</td>
                      <td className="px-3 py-3 text-slate-600">{candidate.role}</td>
                      <td className="px-3 py-3">
                        <CvScoreBar value={candidate.cvScore} />
                      </td>

                      {/* ---- Interview score: pen only, then score + pen ---- */}
                      <td className="px-3 py-3">
                        <InterviewScoreCell
                          value={interview}
                          onEdit={() => openScoreModal(candidate)}
                        />
                      </td>

                      <td className="px-3 py-3">
                        <TotalScoreCell value={total} />
                      </td>

                      {/* ---- Final status dropdown ---- */}
                      <td className="px-3 py-3">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setStatusOpenFor((open) =>
                                open === candidate.id ? null : candidate.id
                              )
                            }
                            className={[
                              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                              chosen === "selected"
                                ? "bg-sky-500 text-white"
                                : chosen === "not_selected"
                                  ? "bg-rose-100 text-rose-600 ring-1 ring-rose-300"
                                  : chosen === "hired"
                                    ? "bg-violet-600 text-white"
                                    : isRecommended
                                      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                                      : "bg-slate-100 text-slate-500 ring-1 ring-slate-300",
                            ].join(" ")}
                          >
                            {chosen
                              ? STATUS_OPTIONS.find((o) => o.value === chosen)?.label
                              : isRecommended
                                ? "Recommended"
                                : "Pending"}
                            <ChevronIcon />
                          </button>

                          {statusOpenFor === candidate.id ? (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setStatusOpenFor(null)}
                                aria-hidden="true"
                              />
                              <div className="absolute left-0 z-20 mt-2 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                {STATUS_OPTIONS.map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      setStatuses((prev) => ({
                                        ...prev,
                                        [candidate.id]: option.value,
                                      }));
                                      setStatusOpenFor(null);
                                    }}
                                    className={[
                                      "block w-full rounded-md px-3 py-2 text-left text-sm",
                                      chosen === option.value
                                        ? "bg-teal-50 font-medium text-teal-700"
                                        : "text-slate-600 hover:bg-slate-50",
                                    ].join(" ")}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </td>

                      {/* ---- Feedback ---- */}
                      <td className="px-3 py-3">
                        {feedbacks[candidate.id] ? (
                          <button
                            type="button"
                            onClick={() => openFeedback(candidate, "view")}
                            className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600"
                          >
                            View Feedback
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openFeedback(candidate, "edit")}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            <EditIcon />
                            Add Feedback
                          </button>
                        )}
                      </td>

                      {/* ---- Send confirmation mail ---- */}
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => sendConfirmationMail(candidate)}
                          disabled={sendingMail === candidate.id || sentMails[candidate.id]}
                          className={[
                            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold",
                            sentMails[candidate.id]
                              ? "bg-slate-200 text-slate-600 cursor-default"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60",
                          ].join(" ")}
                        >
                          <MailIcon />
                          {sentMails[candidate.id]
                            ? "Confirmation Sent"
                            : sendingMail === candidate.id
                              ? "Sending…"
                              : "Send Confirmation Mail"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Card footer */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Showing {rankedRows.length} of {candidates.length} candidates ·{" "}
            {confirmedCount} confirmed for an offer
          </p>
          <button
            type="button"
            onClick={finalizeSelection}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Finalize Selection &amp; Send Offers
          </button>
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
    </NavAndSidebar>
  );
}