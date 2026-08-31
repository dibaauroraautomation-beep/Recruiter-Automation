"use client";
import { useState } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import TableComponent, { type TableData } from "@/app/components/TableComponent";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaChevronDown,
  FaChevronUp,
  FaCalendarAlt,
} from "react-icons/fa";

const APPROVE_WEBHOOK_URL = "https://n8naurora.duckdns.org/webhook/approve-info";

// how many words to show when the post description is collapsed
const COLLAPSED_WORD_COUNT = 5;

// alternate names each column might arrive under from the webhook
const KEY_ALIASES: Record<string, string[]> = {
  jobtitle: ["JobTitle", "jobtitle", "title", "job"],
  postcontent: ["PostContent", "postcontent", "postdescription", "description"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// map a logical key to the real header present in the fetched data
function resolveColumn(datas: TableData | null, key: string): string[] {
  if (!datas) return [];
  const map = new Map(Object.keys(datas).map((h) => [norm(h), h]));
  for (const alias of KEY_ALIASES[key] ?? [key]) {
    const hit = map.get(norm(alias));
    if (hit) return datas[hit] ?? [];
  }
  return [];
}

function snippet(text: string, words: number) {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return text;
  return parts.slice(0, words).join(" ") + "…";
}

// ===== SINGLE ROW COMPONENT =====
// All per-row column logic lives here, isolated from the table/map logic below.
type PostApprovalRowProps = {
  index: number;
  jobTitle: string;
  postContent: string;
  isApproved: boolean;
  isSending: boolean;
  isExpanded: boolean;
  selectedDate: string;
  onToggleExpand: (index: number) => void;
  onDateChange: (index: number, value: string) => void;
  onApprove: (index: number) => void;
  t: (key: string) => string;
};

function PostApprovalRow(props: PostApprovalRowProps) {
  const {
    index,
    jobTitle,
    postContent,
    isApproved,
    isSending,
    isExpanded,
    selectedDate,
    onToggleExpand,
    onDateChange,
    onApprove,
    t,
  } = props;

  const isEmpty = !postContent || postContent.toLowerCase() === "null";
  const isUrl = !isEmpty && /^https?:\/\//i.test(postContent);
  const hasDate = Boolean(selectedDate);

  const titleEmpty = !jobTitle || jobTitle.toLowerCase() === "null";

  return (
    <tr className="group transition-colors hover:bg-slate-50/60">
      {/* COLUMN: JOB TITLE */}
      <td className="py-4 px-5 align-top bg-indigo-50/40 border-r border-indigo-100 group-hover:bg-indigo-50/70 transition-colors">
        <span className="text-sm font-bold text-indigo-900 tracking-tight break-words">
          {titleEmpty ? "—" : jobTitle}
        </span>
      </td>

      {/* COLUMN: POST DESCRIPTION */}
      <td className="py-4 px-5 align-top">
        <div className="flex items-start gap-2 min-w-0">
          {isEmpty && <p className="text-xs italic text-slate-400">—</p>}

          {!isEmpty && (
            <>
              <p className="text-xs text-slate-600 min-w-0 flex-1 whitespace-pre-wrap break-words">
                {isUrl ? (
                  <a
                    href={postContent}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:underline break-all"
                  >
                    {isExpanded
                      ? postContent
                      : snippet(postContent, COLLAPSED_WORD_COUNT)}
                  </a>
                ) : isExpanded ? (
                  postContent
                ) : (
                  snippet(postContent, COLLAPSED_WORD_COUNT)
                )}
              </p>

              <button
                type="button"
                onClick={() => onToggleExpand(index)}
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

      {/* COLUMN: POST DATE */}
      <td className="py-4 px-5 align-top">
        <div className="relative">
          <FaCalendarAlt className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(index, e.target.value)}
            disabled={isApproved}
            className="pl-7 pr-2 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-400 w-full"
          />
        </div>
      </td>

      {/* COLUMN: USER APPROVAL */}
      <td className="py-4 px-5 align-top">
        {!isApproved && (
          <button
            type="button"
            onClick={() => onApprove(index)}
            disabled={!hasDate || isSending}
            title={!hasDate ? t("Select a post date first") : undefined}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition shadow-sm shadow-emerald-200 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-teal-500"
          >
            {isSending ? t("Sending...") : t("Approve")}
          </button>
        )}
        {isApproved && (
          <span className="text-xs font-medium text-slate-400">{t("Approved")}</span>
        )}
      </td>

      {/* COLUMN: STATUS */}
      <td className="py-4 px-5 align-top">
        {isApproved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 shadow-sm whitespace-nowrap">
            <FaCheckCircle className="w-3.5 h-3.5" />
            {t("Scheduled")}
          </span>
        )}
        {!isApproved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm whitespace-nowrap">
            <FaHourglassHalf className="w-3.5 h-3.5" />
            {t("Waiting for Approval")}
          </span>
        )}
      </td>
    </tr>
  );
}

// ===== MAIN PAGE COMPONENT =====
export default function PostApproval() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [datas, setDatas] = useState<TableData | null>(null);

  // COLUMN: STATUS — set only after webhook call succeeds
  const [approvedRows, setApprovedRows] = useState<Set<number>>(new Set());

  // COLUMN: USER APPROVAL — tracks in-flight webhook requests per row
  const [sendingRows, setSendingRows] = useState<Set<number>>(new Set());

  // COLUMN: POST DESCRIPTION — expand/collapse state
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // COLUMN: POST DATE — selected date per row
  const [selectedDates, setSelectedDates] = useState<Record<number, string>>({});

  // Columns resolved by NAME, not by letter position.
  // This is the fix: letter formulas ("A", "C") resolve against the key order
  // of the returned JSON, and n8n omits empty cells — so "C" landed on formlink.
  const jobTitles = resolveColumn(datas, "jobtitle");
  const postContents = resolveColumn(datas, "postcontent");

  const rowCount = Math.max(jobTitles.length, postContents.length);

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

  const setDateForRow = (index: number, value: string) => {
    setSelectedDates((prev) => ({ ...prev, [index]: value }));
  };

  // COLUMN: USER APPROVAL — sends the row to n8n; only marks Scheduled on success
  const approveRow = async (index: number) => {
    if (!selectedDates[index]) return; // guard: post date required
    if (sendingRows.has(index)) return; // guard: already in flight

    setSendingRows((prev) => new Set(prev).add(index));

    const payload = {
      rowIndex: index,
      jobTitle: jobTitles[index] ?? null,
      postContent: postContents[index] ?? null,
      postDate: selectedDates[index],
      approvedBy: user?.name ?? null,
    };

    try {
      const response = await fetch(APPROVE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Webhook responded with status " + response.status);
      }

      setApprovedRows((prev) => new Set(prev).add(index));
    } catch (err) {
      console.error("Approve webhook failed:", err);
      // row stays "Waiting for Approval" on failure so it can be retried
    } finally {
      setSendingRows((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const isLoading = datas === null;

  // build a plain array of row indexes [0, 1, 2, ...] to map over
  const rowIndexes: number[] = [];
  for (let i = 0; i < rowCount; i++) {
    rowIndexes.push(i);
  }

  return (
    <NavAndSidebar
      pageInfo={[
        "post approval",
        "The job vacancy will be posted to the careers page immediately once the hiring manager approves it.",
        "post-approval",
      ]}
      user={[
        user.name,
        user.profilePic,
        user.notificationNumber,
        user.purchasePlan,
        user.WebHook_Url["ApplicationsStatus"],
      ]}
    >
      <TableComponent
        title="Post Approval"
        // rows={[]} returns every column keyed by its real name —
        // no letter formulas, so column order in the response can't break it
        cols={[]}
        rows={[]}
        baseUrl="https://n8naurora.duckdns.org/webhook/dataFetch"
        userId="gh"
        onData={setDatas}
        debug={false}
        dataBaseId="job link"
      >
        <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
          <colgroup>
            <col style={{ width: "16%" }} /> {/* COLUMN: JOB TITLE */}
            <col style={{ width: "32%" }} /> {/* COLUMN: POST DESCRIPTION */}
            <col style={{ width: "16%" }} /> {/* COLUMN: POST DATE */}
            <col style={{ width: "14%" }} /> {/* COLUMN: USER APPROVAL */}
            <col style={{ width: "22%" }} /> {/* COLUMN: STATUS */}
          </colgroup>

          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
              <th className="py-3.5 px-5 rounded-tl-xl bg-indigo-50/80 text-indigo-700 border-r border-indigo-100">
                {t("Job Title")}
              </th>
              <th className="py-3.5 px-5">{t("Post Description")}</th>
              <th className="py-3.5 px-5">{t("Post Date")}</th>
              <th className="py-3.5 px-5">{t("User Approval")}</th>
              <th className="py-3.5 px-5 rounded-tr-xl">{t("Status")}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rowCount === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-xs text-slate-400"
                >
                  {isLoading ? t("Loading...") : t("No jobs to approve")}
                </td>
              </tr>
            )}

            {rowIndexes.map((i) => (
              <PostApprovalRow
                key={i}
                index={i}
                jobTitle={jobTitles[i] ?? ""}
                postContent={postContents[i] ?? ""}
                isApproved={approvedRows.has(i)}
                isSending={sendingRows.has(i)}
                isExpanded={expandedRows.has(i)}
                selectedDate={selectedDates[i] ?? ""}
                onToggleExpand={toggleExpand}
                onDateChange={setDateForRow}
                onApprove={approveRow}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </TableComponent>
    </NavAndSidebar>
  );
}