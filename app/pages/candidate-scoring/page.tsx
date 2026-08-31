"use client";
import { useState } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import TableComponent, { type TableData } from "@/app/components/TableComponent";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const CANDIDATE_DATA_URL = "https://n8naurora.duckdns.org/webhook/candidate-data";

// how many words to show when the summary is collapsed
const COLLAPSED_WORD_COUNT = 5;

// ===== COLUMN ORDER =====
// key   = column name as it arrives from the webhook (case-insensitive match)
// label = header text shown in the table
// width = <col> width; must add up to 100%
const COLUMNS: { key: string; label: string; width: string }[] = [
  { key: "formtitle",    label: "Job Title",       width: "12%" },
  { key: "fullname",     label: "Full Name",       width: "12%" },
  { key: "email",        label: "Email",           width: "14%" },
  { key: "phoneno",      label: "Phone No",        width: "10%" },
  { key: "cvlink",       label: "CV Link",         width: "7%"  },
  { key: "atsscore",     label: "ATS Score",       width: "8%"  },
  { key: "summarycomment", label: "Summary",       width: "22%" },
  { key: "salary",       label: "Expected Salary", width: "8%"  },
  { key: "noticeperiod", label: "Notice Period",   width: "7%"  },
];

const JOB_TITLE_KEY = "formtitle";
const SUMMARY_KEY = "summarycomment";

// alternate names the same column might arrive under
const KEY_ALIASES: Record<string, string[]> = {
  formtitle: ["formtitle", "jobtitle", "title"],
  fullname: ["fullname", "name", "candidatename"],
  email: ["email", "emailaddress"],
  phoneno: ["phoneno", "phone", "phonenumber", "mobile"],
  cvlink: ["cvlink", "cv", "resume", "resumelink", "drivelink"],
  atsscore: ["atsscore", "score", "ats", "candidatescore"],
  summarycomment: ["summarycomment", "summary", "comment", "aisummary", "remarks"],
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

export default function CandidateScoring() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [datas, setDatas] = useState<TableData | null>(null);

  // COLUMN: SUMMARY — expand/collapse state per row
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const rawHeaders = datas ? Object.keys(datas) : [];

  // only keep the columns defined above, in that exact order;
  // id / created_at / updated_at and anything else are dropped
  const columns = COLUMNS.map((col) => ({
    ...col,
    resolved: resolveKey(rawHeaders, col.key),
  })).filter((col) => col.resolved !== null);

  const rowCount =
    rawHeaders.length > 0 && Array.isArray(datas?.[rawHeaders[0]])
      ? datas![rawHeaders[0]].length
      : 0;

  const isLoading = datas === null;

  const toggleExpand = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const rowIndexes: number[] = [];
  for (let i = 0; i < rowCount; i++) {
    rowIndexes.push(i);
  }

  return (
    <NavAndSidebar
      pageInfo={[
        "candidate scoring",
        "Applicant data collected from the job forms is evaluated against the criteria defined for each role.",
        "candidate-scoring",
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
        <table className="w-full text-left border-collapse table-fixed min-w-[1150px]">
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

            {rowIndexes.map((i) => {
              const isExpanded = expandedRows.has(i);

              return (
                <tr key={i} className="group transition-colors hover:bg-slate-50/60">
                  {columns.map((col) => {
                    const value = String(datas?.[col.resolved!]?.[i] ?? "");
                    const isEmpty = !value || value.toLowerCase() === "null";
                    const isLink = /^https?:\/\//i.test(value);

                    // ===== COLUMN: JOB TITLE =====
                    if (col.key === JOB_TITLE_KEY) {
                      return (
                        <td
                          key={col.key}
                          className="py-4 px-5 align-top bg-indigo-50/40 border-r border-indigo-100 group-hover:bg-indigo-50/70 transition-colors"
                        >
                          <span className="text-sm font-bold text-indigo-900 tracking-tight break-words">
                            {isEmpty ? "—" : value}
                          </span>
                        </td>
                      );
                    }

                    // ===== COLUMN: SUMMARY =====
                    if (col.key === SUMMARY_KEY) {
                      return (
                        <td key={col.key} className="py-4 px-5 align-top">
                          <div className="flex items-start gap-2 min-w-0">
                            {isEmpty && (
                              <p className="text-xs italic text-slate-400">—</p>
                            )}

                            {!isEmpty && (
                              <>
                                <p className="text-xs text-slate-600 min-w-0 flex-1 whitespace-pre-wrap break-words">
                                  {isExpanded
                                    ? value
                                    : snippet(value, COLLAPSED_WORD_COUNT)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(i)}
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
                            {isEmpty ? "" : value}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableComponent>
    </NavAndSidebar>
  );
}