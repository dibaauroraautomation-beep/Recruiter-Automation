"use client";
import { useState } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import TableComponent, { type TableData } from "@/app/components/TableComponent";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const CANDIDATE_DATA_URL = "https://n8naurora.duckdns.org/webhook/candidate-data";

// how many words to show when a long cell is collapsed
const COLLAPSED_WORD_COUNT = 5;

// ===== COLUMN ORDER =====
// key   = column name as it arrives from the webhook (case-insensitive match)
// label = header text shown in the table
// width = <col> width; must add up to 100%
const COLUMNS: { key: string; label: string; width: string }[] = [
  { key: "formtitle", label: "Job Title", width: "7%" },
  { key: "fullname", label: "Full Name", width: "7%" },
  { key: "email", label: "Email", width: "10%" },
  { key: "phoneno", label: "Phone No", width: "7%" },
  { key: "cvlink", label: "CV Link", width: "4%" },
  { key: "atsscore", label: "ATS Score", width: "5%" },
  { key: "aiconfidencelevel", label: "AI Confidence Level", width: "9%" },
  { key: "strengths", label: "Strengths", width: "13%" },
  { key: "gaprisk", label: "Potential Gap and Risk", width: "13%" },
  { key: "summarycomment", label: "Summary", width: "13%" },
  { key: "salary", label: "Expected Salary", width: "13%" },
  { key: "noticeperiod", label: "Notice Period", width: "4%" },
];

const JOB_TITLE_KEY = "formtitle";
const ATS_SCORE_KEY = "atsscore";
const BREAKDOWN_KEY = "scorebreakdown"; // fetched but never rendered as its own column

// every column that gets the expand / collapse chevron
const EXPANDABLE_KEYS = new Set([
  "summarycomment",
  "strengths",
  "gaprisk",
  "aiconfidencelevel",
  "salary",
]);

// alternate names the same column might arrive under
const KEY_ALIASES: Record<string, string[]> = {
  formtitle: ["formtitle", "jobtitle", "title"],
  fullname: ["fullname", "name", "candidatename"],
  email: ["email", "emailaddress"],
  phoneno: ["phoneno", "phone", "phonenumber", "mobile"],
  cvlink: ["cvlink", "cv", "resume", "resumelink", "drivelink"],
  atsscore: ["atsscore", "score", "ats", "candidatescore"],
  scorebreakdown: ["scorebreakdown", "breakdown", "scoredetails"],
  summarycomment: ["summarycomment", "summary", "comment", "aisummary", "remarks"],
  // the source table spells this "strenghs" — both spellings are matched
  strengths: ["strengths", "strenghs", "strength", "strong points"],
  gaprisk: ["gaprisk", "gap", "risk", "gapandrisk", "potentialgapandrisk"],
  aiconfidencelevel: ["aiconfidencelevel", "aiconfidence", "confidencelevel", "confidence"],
  salary: ["salary", "expectedsalary"],
  noticeperiod: ["noticeperiod", "notice"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// map a COLUMNS key to the real header present in the fetched data
function resolveKey(rawHeaders: string[], key: string): string | null {
  const map = new Map(rawHeaders.map((h) => [norm(h), h]));
  for (const alias of KEY_ALIASES[key] ?? [key]) {
    const hit = map.get(norm(alias));
    if (hit) return hit;
  }
  return null;
}

function snippet(text: string, words: number) {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return text;
  return parts.slice(0, words).join(" ") + "…";
}

const isBlank = (value: string) => !value || value.toLowerCase() === "null";

/* ------------------------------------------------------------------ */
/* scoreBreakdown parsing                                              */
/* Arrives as newline separated "Label: value" lines. Value is either  */
/* a plain number (75) or a fraction (6/9).                            */
/* ------------------------------------------------------------------ */

interface BreakdownItem {
  label: string;
  display: string;
  percent: number | null;
}

function parseBreakdown(raw: string): BreakdownItem[] {
  if (isBlank(raw)) return [];

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const splitAt = line.indexOf(":");
      if (splitAt === -1) return { label: line, display: "", percent: null };

      const label = line.slice(0, splitAt).trim();
      const value = line.slice(splitAt + 1).trim();

      // fraction, e.g. 6/9
      const fraction = value.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
      if (fraction) {
        const top = Number(fraction[1]);
        const bottom = Number(fraction[2]);
        return {
          label,
          display: value,
          percent: bottom > 0 ? Math.round((top / bottom) * 100) : null,
        };
      }

      // plain number, e.g. 75
      const plain = Number(value.replace(/[^0-9.]/g, ""));
      if (value !== "" && Number.isFinite(plain)) {
        return { label, display: value, percent: Math.max(0, Math.min(100, plain)) };
      }

      return { label, display: value, percent: null };
    });
}

function barTone(percent: number): string {
  if (percent >= 70) return "bg-emerald-500";
  if (percent >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
      aria-hidden="true"
    >
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CandidateScoring() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [datas, setDatas] = useState<TableData | null>(null);

  // expand/collapse state, keyed as "rowIndex:columnKey"
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

  // which row's score breakdown modal is open (null = closed)
  const [breakdownRow, setBreakdownRow] = useState<number | null>(null);

  const rawHeaders = datas ? Object.keys(datas) : [];

  // only keep the columns defined above, in that exact order
  const columns = COLUMNS.map((col) => ({
    ...col,
    resolved: resolveKey(rawHeaders, col.key),
  })).filter((col) => col.resolved !== null);

  // scoreBreakdown is read for the modal but is not a visible column
  const breakdownHeader = resolveKey(rawHeaders, BREAKDOWN_KEY);
  const nameHeader = resolveKey(rawHeaders, "fullname");
  const atsHeader = resolveKey(rawHeaders, "atsscore");

  const rowCount =
    rawHeaders.length > 0 && Array.isArray(datas?.[rawHeaders[0]])
      ? datas![rawHeaders[0]].length
      : 0;

  const isLoading = datas === null;

  const toggleExpand = (index: number, colKey: string) => {
    const cellId = `${index}:${colKey}`;
    setExpandedCells((prev) => {
      const next = new Set(prev);
      if (next.has(cellId)) {
        next.delete(cellId);
      } else {
        next.add(cellId);
      }
      return next;
    });
  };

  // row order: highest ATS score first; blank scores sink to the bottom
  const rowIndexes: number[] = [];
  for (let i = 0; i < rowCount; i++) {
    rowIndexes.push(i);
  }

  rowIndexes.sort((a, b) => {
    const scoreAt = (index: number) => {
      if (!atsHeader) return -1;
      const raw = String(datas?.[atsHeader]?.[index] ?? "");
      if (isBlank(raw)) return -1;
      const parsed = Number(raw.replace(/[^0-9.]/g, ""));
      return Number.isFinite(parsed) ? parsed : -1;
    };
    return scoreAt(b) - scoreAt(a);
  });

  // values for the open modal
  const modalName =
    breakdownRow !== null && nameHeader
      ? String(datas?.[nameHeader]?.[breakdownRow] ?? "")
      : "";
  const modalAts =
    breakdownRow !== null && atsHeader
      ? String(datas?.[atsHeader]?.[breakdownRow] ?? "")
      : "";
  const modalItems =
    breakdownRow !== null && breakdownHeader
      ? parseBreakdown(String(datas?.[breakdownHeader]?.[breakdownRow] ?? ""))
      : [];

  return (
    <NavAndSidebar
      pageInfo={[
        "Candidate Ranking",
        "Applicant data collected from the job forms is evaluated against the criteria defined for each role.",
        "candidate scoring",
      ]}
      user={[
        user.name,
        user.profilePic,
        user.notificationNumber,
        user.purchasePlan,
        user.WebHook_Url["CandidateScoring"],
      ]}
      sidebarHeight="h-screen"
    >
      <TableComponent
        title="Candidate Scoring"
        cols={[]}                       // empty = return every column
        baseUrl={CANDIDATE_DATA_URL}
        userId="gh"
        onData={setDatas}
        debug={false}
        dataBaseId="candidate"
      >
        {/* table-fixed + colgroup: this is what makes truncate actually work */}
        <table className="w-full text-left border-collapse table-fixed min-w-[2300px]">
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>

          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
              {columns.map((col, idx) => (
                <th
                  key={col.key}
                  className={
                    "py-3.5 px-5 whitespace-nowrap" +
                    (idx === 0 ? " rounded-tl-xl" : "") +
                    (idx === columns.length - 1 ? " rounded-tr-xl" : "") +
                    // COLUMN: JOB TITLE — highlighted header
                    (col.key === JOB_TITLE_KEY
                      ? " bg-indigo-50/80 text-indigo-700 border-r border-indigo-100"
                      : "")
                  }
                >
                  {t(col.label)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rowCount === 0 && (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="py-10 text-center text-xs text-slate-400"
                >
                  {isLoading ? t("Loading...") : t("No candidates yet")}
                </td>
              </tr>
            )}

            {rowIndexes.map((i) => (
              <tr key={i} className="group transition-colors hover:bg-slate-50/60">
                {columns.map((col) => {
                  const value = String(datas?.[col.resolved!]?.[i] ?? "");
                  const empty = isBlank(value);
                  const isLink = /^https?:\/\//i.test(value);
                  const isExpanded = expandedCells.has(`${i}:${col.key}`);

                  // ===== COLUMN: JOB TITLE =====
                  if (col.key === JOB_TITLE_KEY) {
                    return (
                      <td
                        key={col.key}
                        className="py-4 px-5 align-top bg-indigo-50/40 border-r border-indigo-100 group-hover:bg-indigo-50/70 transition-colors"
                      >
                        <span className="text-sm font-bold text-indigo-900 tracking-tight break-words">
                          {empty ? "—" : value}
                        </span>
                      </td>
                    );
                  }

                  // ===== COLUMN: ATS SCORE (score + breakdown icon) =====
                  if (col.key === ATS_SCORE_KEY) {
                    const hasBreakdown =
                      !!breakdownHeader &&
                      !isBlank(String(datas?.[breakdownHeader]?.[i] ?? ""));

                    return (
                      <td key={col.key} className="py-4 px-5 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-700">
                            {empty ? "—" : value}
                          </span>
                          {hasBreakdown && (
                            <button
                              type="button"
                              onClick={() => setBreakdownRow(i)}
                              className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                              aria-label={t("View score breakdown")}
                              title={t("View score breakdown")}
                            >
                              <ChartIcon />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // ===== EXPANDABLE COLUMNS =====
                  // summary, strengths, gap & risk, AI confidence, expected salary
                  if (EXPANDABLE_KEYS.has(col.key)) {
                    return (
                      <td key={col.key} className="py-4 px-5 align-top">
                        <div className="flex items-start gap-2 min-w-0">
                          {empty && <p className="text-xs italic text-slate-400">—</p>}

                          {!empty && (
                            <>
                              <p className="text-xs text-slate-600 min-w-0 flex-1 whitespace-pre-wrap break-words">
                                {isExpanded ? value : snippet(value, COLLAPSED_WORD_COUNT)}
                              </p>
                              <button
                                type="button"
                                onClick={() => toggleExpand(i, col.key)}
                                className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-700"
                                aria-label={isExpanded ? t("Collapse") : t("Expand")}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? (
                                  <FaChevronUp className="w-3 h-3" />
                                ) : (
                                  <FaChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // ===== ALL OTHER COLUMNS =====
                  return (
                    <td
                      key={col.key}
                      className="py-4 px-5 text-xs text-slate-700 align-top"
                    >
                      {isLink ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:underline"
                        >
                          {t("Open")}
                        </a>
                      ) : (
                        <span className="block truncate" title={value}>
                          {empty ? "" : value}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TableComponent>

      {/* ===== Score breakdown modal ===== */}
      {breakdownRow !== null && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setBreakdownRow(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t("Score Breakdown")}
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">{modalName}</p>
              </div>
              {!isBlank(modalAts) && (
                <span className="shrink-0 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">
                  {t("ATS")} {modalAts}
                </span>
              )}
            </div>

            <div className="mt-5 space-y-3.5">
              {modalItems.length === 0 && (
                <p className="text-sm italic text-slate-400">
                  {t("No breakdown available for this candidate.")}
                </p>
              )}

              {modalItems.map((item, idx) => (
                <div key={`${item.label}-${idx}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{t(item.label)}</span>
                    <span className="font-semibold text-slate-800">
                      {item.display || "—"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    {item.percent !== null && (
                      <div
                        className={`h-full rounded-full transition-all ${barTone(item.percent)}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setBreakdownRow(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </NavAndSidebar>
  );
}