"use client";
import { useState, useEffect, useRef } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import TableComponent, { type TableData } from "@/app/components/TableComponent";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const CANDIDATE_DATA_URL = "https://n8naurora.duckdns.org/webhook/candidate-data";

// Fired when the Reject button of a row is clicked.
// TODO: replace with the real n8n webhook URL for the rejection notification.
const REJECT_WEBHOOK_URL = "https://n8naurora.duckdns.org/webhook/rejection-email";

// how many words to show when a long cell is collapsed
const COLLAPSED_WORD_COUNT = 5;

// Filter that is applied automatically the first time the data loads.
// It is matched against the real values in the table, ignoring case and spacing.
const DEFAULT_FILTER = { key: "formtitle", value: "AI Engineer" };

// ===== COLUMN ORDER =====
// key    = column name as it arrives from the webhook (case-insensitive match)
// label  = header text shown in the table
// width  = <col> width; the visible columns + Action + Rejection must add up to 100%
// hidden = still fetched (used for search and the reject payload) but not shown
const COLUMNS: { key: string; label: string; width: string; hidden?: boolean }[] = [
  { key: "formtitle", label: "Job Title", width: "8%" },
  { key: "fullname", label: "Full Name", width: "8%" },
  // { key: "email", label: "Email", width: "10%" },
  // { key: "phoneno", label: "Phone No", width: "7%" },
  { key: "cvlink", label: "CV Link", width: "5%" },
  { key: "atsscore", label: "Candidate Match", width: "7%" },
  { key: "musthaverequirements", label: "Must Have Requirements", width: "9%" },
  { key: "aiconfidencelevel", label: "Assesment Confidence", width: "9%" },
    { key: "strengths", label: "Strengths", width: "12%" },
  { key: "gaprisk", label: "Potential Gap and Risk", width: "13%" },
  { key: "summarycomment", label: "Summary", width: "12%" },
  // { key: "salary", label: "Expected Salary", width: "13%" },
  // { key: "noticeperiod", label: "Notice Period", width: "4%" },
];

const JOB_TITLE_KEY = "formtitle";
const ATS_SCORE_KEY = "atsscore";
const BREAKDOWN_KEY = "scorebreakdown"; // fetched but never rendered as its own column

// every column that gets the expand / collapse chevron
const EXPANDABLE_KEYS = new Set([
  "summarycomment",
  "strengths",
  "gaprisk",
  "salary",
]);

// alternate names the same column might arrive under
const KEY_ALIASES: Record<string, string[]> = {
  formtitle: ["formtitle", "jobtitle", "title"],
  fullname: ["fullname", "name", "candidatename"],
  // email and phone are not shown as columns, but the reject webhook needs them
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
  musthaverequirements: ["musthaverequirements", "musthaveskill", "musthaverequirement", "mandatoryrequirements", "requirements"],
  // salary: ["salary", "expectedsalary"],
  // noticeperiod: ["noticeperiod", "notice"],
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

const NOT_AVAILABLE = "Not Available";

// what a cell shows (and what filters compare against)
const show = (value: string) => (isBlank(value) ? NOT_AVAILABLE : value);

// "97" or "97%" -> 97, anything else -> null
const toNumber = (value: string): number | null => {
  if (isBlank(value)) return null;
  const parsed = Number(value.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

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
/* Filters                                                             */
/* The filter type of every column is detected from its own data, so   */
/* new or renamed columns work without any change here.                */
/*   all values numeric           -> "is greater than"                 */
/*   up to 4 repeating values     -> "is" (dropdown)                   */
/*   up to 12 repeating values    -> "is any of" (multi select)        */
/*   anything else                -> "contains" (text)                 */
/* ------------------------------------------------------------------ */

type ColKind = "text" | "select" | "multi" | "number";

interface ColumnInfo {
  kind: ColKind;
  options: string[];
}

interface FilterChip {
  id: number;
  colKey: string;
  value: string; // text / select / number
  values: string[]; // multi
}

function detectColumn(values: string[]): ColumnInfo {
  const filled = values.filter((v) => !isBlank(v));

  if (filled.length > 0 && filled.every((v) => /^-?\d+(\.\d+)?%?$/.test(v.trim()))) {
    return { kind: "number", options: [] };
  }

  const options = Array.from(new Set(values.map(show))).sort();
  const hasRepeats = options.length < values.length;
  const allShort = options.every((o) => o.length <= 40);
  const hasLinks = filled.some((v) => /^https?:\/\//i.test(v));

  if (hasRepeats && allShort && !hasLinks) {
    if (options.length <= 4) return { kind: "select", options };
    if (options.length <= 12) return { kind: "multi", options };
  }

  return { kind: "text", options: [] };
}

const OPERATOR_LABEL: Record<ColKind, string> = {
  text: "contains",
  select: "is",
  multi: "is any of",
  number: "is greater than",
};

const underlineField =
  "border-0 border-b-[1.5px] border-blue-600 bg-transparent px-0.5 text-slate-900 outline-none";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-slate-400" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-500" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

interface FilterBarProps {
  columns: { key: string; label: string }[];
  columnInfo: Record<string, ColumnInfo>;
  filters: FilterChip[];
  onFiltersChange: (next: FilterChip[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  t: (key: string) => string;
}

function FilterBar({
  columns,
  columnInfo,
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  t,
}: FilterBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const [openMultiId, setOpenMultiId] = useState<number | null>(null);
  const nextId = useRef(1); // id 0 is reserved for the default filter set by the page

  // close the column menu / multi-select popover on outside click or Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-add-wrap]")) setMenuOpen(false);
      if (!el.closest("[data-multi-wrap]")) setOpenMultiId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setOpenMultiId(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const addFilter = (colKey: string) => {
    onFiltersChange([...filters, { id: nextId.current++, colKey, value: "", values: [] }]);
    setMenuOpen(false);
    setMenuQuery("");
  };

  const updateFilter = (id: number, patch: Partial<FilterChip>) => {
    onFiltersChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeFilter = (id: number) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const menuItems = columns.filter((c) =>
    t(c.label).toLowerCase().includes(menuQuery.trim().toLowerCase())
  );

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm">
      {/* SEARCH */}
      <div className="flex items-center gap-2.5">
        <SearchIcon />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("Search jobs, candidates...")}
          autoComplete="off"
          className="flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      {/* FILTER CHIPS + ADD BUTTON */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const col = columns.find((c) => c.key === f.colKey);
          const info = columnInfo[f.colKey];
          if (!col || !info) return null;

          return (
            <span
              key={f.id}
              className="relative inline-flex items-center gap-2.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] text-slate-600"
            >
              <span>
                <b className="font-medium text-slate-900">{t(col.label)}</b>{" "}
                {t(OPERATOR_LABEL[info.kind])}
              </span>

              {info.kind === "text" && (
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                  placeholder={t("type...")}
                  autoComplete="off"
                  className={`${underlineField} w-28`}
                />
              )}

              {info.kind === "number" && (
                <input
                  type="number"
                  value={f.value}
                  onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                  placeholder="0"
                  min={0}
                  max={100}
                  className={`${underlineField} w-16`}
                />
              )}

              {info.kind === "select" && (
                <select
                  value={f.value}
                  onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                  className={`${underlineField} max-w-[190px] cursor-pointer`}
                >
                  <option value="">{t("Select...")}</option>
                  {info.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}

              {info.kind === "multi" && (
                <span className="relative" data-multi-wrap>
                  <button
                    type="button"
                    onClick={() => setOpenMultiId(openMultiId === f.id ? null : f.id)}
                    className={`${underlineField} max-w-[160px] truncate text-left`}
                  >
                    {f.values.length ? f.values.join(", ") : t("Select...")}
                  </button>
                  {openMultiId === f.id && (
                    <div className="absolute left-0 top-full z-20 mt-2 min-w-[150px] rounded-[10px] border border-slate-200 bg-white p-1.5 shadow-lg">
                      {info.options.map((o) => (
                        <label
                          key={o}
                          className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 hover:bg-slate-100"
                        >
                          <input
                            type="checkbox"
                            checked={f.values.includes(o)}
                            onChange={() =>
                              updateFilter(f.id, {
                                values: f.values.includes(o)
                                  ? f.values.filter((v) => v !== o)
                                  : [...f.values, o],
                              })
                            }
                            className="accent-blue-600"
                          />
                          {o}
                        </label>
                      ))}
                    </div>
                  )}
                </span>
              )}

              <button
                type="button"
                onClick={() => removeFilter(f.id)}
                aria-label={t("Remove filter")}
                className="text-base leading-none text-slate-500 hover:text-slate-800"
              >
                &times;
              </button>
            </span>
          );
        })}

        {/* ADD FILTER: menu lists every visible column of the table */}
        <div className="relative" data-add-wrap>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((o) => !o);
              setMenuQuery("");
            }}
            aria-label={t("Add filter")}
            className="h-[30px] w-[30px] rounded-md bg-blue-600 text-xl leading-none text-white transition hover:bg-blue-700"
          >
            +
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-full z-20 mt-2.5 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <input
                type="text"
                value={menuQuery}
                onChange={(e) => setMenuQuery(e.target.value)}
                placeholder={t("Filter by...")}
                autoComplete="off"
                autoFocus
                className="mb-1.5 w-full rounded-md border-[1.5px] border-blue-600 px-2.5 py-2 text-sm outline-none ring-[3px] ring-blue-600/15"
              />
              {menuItems.length === 0 && (
                <div className="p-2.5 text-slate-400">{t("No matches")}</div>
              )}
              {menuItems.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => addFilter(c.key)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <FileIcon />
                  {t(c.label)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

  // search + filter chips
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const defaultFilterApplied = useRef(false);

  // rejection notification state, keyed by row index
  const [rejectingRows, setRejectingRows] = useState<Set<number>>(new Set());
  const [rejectedRows, setRejectedRows] = useState<Set<number>>(new Set());
  const [failedRows, setFailedRows] = useState<Set<number>>(new Set());

  // row selection for bulk rejection, keyed by row index
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  // The table scrolls inside its own box that always ends at the bottom of the screen,
  // so the one horizontal scrollbar is always visible and never needs a page scroll.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fit = () => {
      const el = scrollRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      setTableMaxHeight(Math.max(320, window.innerHeight - top - 40));
    };
    fit();
    window.addEventListener("resize", fit);
    // also re-fit when anything above the table changes height (filter chips wrapping, etc.)
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(document.body);
    return () => {
      window.removeEventListener("resize", fit);
      observer?.disconnect();
    };
  }, []);

  // Apply DEFAULT_FILTER once, the first time real data arrives.
  useEffect(() => {
    if (!datas || defaultFilterApplied.current) return;
    const headers = Object.keys(datas);
    if (headers.length === 0) return; // not real data yet, wait for the next update

    defaultFilterApplied.current = true;

    const header = resolveKey(headers, DEFAULT_FILTER.key);
    if (!header) return;

    const first = datas[headers[0]];
    const count = Array.isArray(first) ? first.length : 0;
    const values: string[] = [];
    for (let r = 0; r < count; r++) {
      values.push(String(datas[header]?.[r] ?? ""));
    }

    // exact value as it is written in the table (e.g. "AI Engineer")
    const match = Array.from(new Set(values.map(show))).find(
      (v) => norm(v) === norm(DEFAULT_FILTER.value)
    );
    if (!match) return;

    const kind = detectColumn(values).kind;
    setFilters([
      {
        id: 0,
        colKey: DEFAULT_FILTER.key,
        value: kind === "multi" ? "" : match,
        values: kind === "multi" ? [match] : [],
      },
    ]);
  }, [datas]);

  const rawHeaders = datas ? Object.keys(datas) : [];

  // only keep the visible columns defined above, in that exact order
  const columns = COLUMNS.filter((col) => !col.hidden)
    .map((col) => ({
      ...col,
      resolved: resolveKey(rawHeaders, col.key),
    }))
    .filter((col) => col.resolved !== null);

  // scoreBreakdown is read for the modal but is not a visible column
  const breakdownHeader = resolveKey(rawHeaders, BREAKDOWN_KEY);
  const nameHeader = resolveKey(rawHeaders, "fullname");
  const atsHeader = resolveKey(rawHeaders, "atsscore");
  const jobTitleHeader = resolveKey(rawHeaders, JOB_TITLE_KEY); // searchable even if hidden

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

  // ===== FILTER TYPE PER COLUMN, DETECTED FROM THE FETCHED DATA =====
  const columnInfo: Record<string, ColumnInfo> = {};
  columns.forEach((col) => {
    const values: string[] = [];
    for (let r = 0; r < rowCount; r++) {
      values.push(String(datas?.[col.resolved!]?.[r] ?? ""));
    }
    columnInfo[col.key] = detectColumn(values);
  });

  const matchesSearch = (index: number) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const headers = columns.map((c) => c.resolved!);
    if (jobTitleHeader && !headers.includes(jobTitleHeader)) headers.push(jobTitleHeader);
    return headers.some((h) =>
      String(datas?.[h]?.[index] ?? "").toLowerCase().includes(term)
    );
  };

  const matchesFilter = (f: FilterChip, index: number) => {
    const col = columns.find((c) => c.key === f.colKey);
    const info = columnInfo[f.colKey];
    if (!col || !info) return true;

    const raw = String(datas?.[col.resolved!]?.[index] ?? "");

    switch (info.kind) {
      case "number": {
        if (f.value === "") return true;
        const n = toNumber(raw);
        return n !== null && n > Number(f.value);
      }
      case "select":
        return f.value === "" || show(raw) === f.value;
      case "multi":
        return f.values.length === 0 || f.values.includes(show(raw));
      default:
        return (
          f.value.trim() === "" ||
          show(raw).toLowerCase().includes(f.value.trim().toLowerCase())
        );
    }
  };

  // row order: highest ATS score first; blank scores sink to the bottom
  const sortedIndexes: number[] = [];
  for (let i = 0; i < rowCount; i++) {
    sortedIndexes.push(i);
  }

  sortedIndexes.sort((a, b) => {
    const scoreAt = (index: number) => {
      if (!atsHeader) return -1;
      const raw = String(datas?.[atsHeader]?.[index] ?? "");
      if (isBlank(raw)) return -1;
      const parsed = Number(raw.replace(/[^0-9.]/g, ""));
      return Number.isFinite(parsed) ? parsed : -1;
    };
    return scoreAt(b) - scoreAt(a);
  });

  // rows that survive the search box and every filter chip
  const rowIndexes = sortedIndexes.filter(
    (i) => matchesSearch(i) && filters.every((f) => matchesFilter(f, i))
  );

    // ===== REJECTION NOTIFICATION =====
  // Sends ONE candidate to the n8n webhook. The payload carries the full row:
  // every column of the table, visible or hidden, under "candidate".
  // Returns true when the webhook accepted the request.
  const sendReject = async (index: number): Promise<boolean> => {
    if (rejectingRows.has(index) || rejectedRows.has(index)) return false;

    setRejectingRows((prev) => new Set(prev).add(index));
    setFailedRows((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });

    const valueOf = (key: string): string | null => {
      const header = resolveKey(rawHeaders, key);
      const value = header ? String(datas?.[header]?.[index] ?? "") : "";
      return isBlank(value) ? null : value;
    };

    // the whole row, keyed by the real column names, so n8n can use any field
    const candidate: Record<string, string> = {};
    rawHeaders.forEach((h) => {
      candidate[h] = String(datas?.[h]?.[index] ?? "");
    });

    const payload = {
      rowIndex: index,
      fullName: valueOf("fullname"),
      email: valueOf("email"),
      phone: valueOf("phoneno"),
      jobTitle: valueOf(JOB_TITLE_KEY),
      rejectedBy: user?.name ?? null,
      candidate,
    };

    try {
      const response = await fetch(REJECT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Webhook responded with status " + response.status);
      }

      setRejectedRows((prev) => new Set(prev).add(index));
      setSelectedRows((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      return true;
    } catch (err) {
      console.error("Reject webhook failed:", err);
      setFailedRows((prev) => new Set(prev).add(index)); // stays selected, button turns into "Retry"
      return false;
    } finally {
      setRejectingRows((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  // single row: the Reject button of that row
  const rejectCandidate = (index: number) => {
    void sendReject(index);
  };

  // ===== BULK SELECTION =====
  // rows that can still be selected: visible (after search/filters) and not rejected yet
  const selectableRows = rowIndexes.filter((i) => !rejectedRows.has(i));
  const selectedVisible = selectableRows.filter((i) => selectedRows.has(i));
  const allSelected =
    selectableRows.length > 0 && selectedVisible.length === selectableRows.length;
  const someSelected = selectedVisible.length > 0 && !allSelected;

  const toggleRowSelected = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // header checkbox: select every visible candidate, or clear them all
  const toggleSelectAll = () => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectableRows.forEach((i) => next.delete(i));
      } else {
        selectableRows.forEach((i) => next.add(i));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedRows(new Set());

  // sends every selected candidate to the same webhook, one after another,
  // so the existing n8n workflow works unchanged and the mail service is not flooded
  const rejectSelected = async () => {
    const targets = selectedVisible.filter((i) => !rejectingRows.has(i));
    if (targets.length === 0 || bulkSending) return;

    const ok = window.confirm(
      `${t("Send a rejection notification to the selected candidates?")} (${targets.length})`
    );
    if (!ok) return;

    setBulkSending(true);
    for (const i of targets) {
      await sendReject(i);
    }
    setBulkSending(false);
  };

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
<<<<<<< Updated upstream:app/pages/cv-bank-and-ranking/page.tsx
=======
      pageInfo={[
        "CV Bank and Ranking",
        "Applicant data collected from the job forms is evaluated against the criteria defined for each role.",
        "candidate-ranking",
      ]}
>>>>>>> Stashed changes:app/pages/candidate-ranking/page.tsx
      user={[
        user.name,
        user.profilePic,
        user.notificationNumber,
        user.purchasePlan,
        user.WebHook_Url["CandidateScoring"],
      ]}
      sidebarHeight="h-screen"
    >
      {/* ===== Search + filters ===== */}
      <FilterBar
        columns={columns.map((c) => ({ key: c.key, label: c.label }))}
        columnInfo={columnInfo}
        filters={filters}
        onFiltersChange={setFilters}
        search={search}
        onSearchChange={setSearch}
        t={t}
      />

      {/* Data loader only. TableComponent still fetches the data and hands it to onData,
          but its own header (title + search box) and scroll area are hidden. */}
      <div className="hidden" aria-hidden="true">
        <TableComponent
          title="Candidate Scoring"
          cols={[]}                       // empty = return every column
          baseUrl={CANDIDATE_DATA_URL}
          userId="gh"
          onData={setDatas}
          debug={false}
          dataBaseId="candidate"
        >
          <></>
        </TableComponent>
      </div>

      {/* ===== Table: starts directly with the column headers ===== */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* bulk toolbar: select several candidates (or all) and reject them together */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
          <p className="text-xs text-slate-500">
            {selectedVisible.length > 0
              ? `${selectedVisible.length} ${t("selected")}`
              : t("Select candidates to reject several at once")}
          </p>
          <div className="flex items-center gap-2">
            {selectedVisible.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                disabled={bulkSending}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {t("Clear selection")}
              </button>
            )}
            <button
              type="button"
              onClick={rejectSelected}
              disabled={selectedVisible.length === 0 || bulkSending}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSending
                ? t("Sending...")
                : `${t("Reject Selected")}${selectedVisible.length > 0 ? ` (${selectedVisible.length})` : ""}`}
            </button>
          </div>
        </div>
        {/* the only scroll area: vertical + horizontal scrollbars stay inside the screen */}
        <div
          ref={scrollRef}
          style={{ maxHeight: tableMaxHeight }}
          className="overflow-auto"
        >
          {/* table-fixed + colgroup: this is what makes truncate actually work */}
          <table className="w-full text-left border-collapse table-fixed min-w-[1800px]">
            <colgroup>
                          <col style={{ width: "3%" }} /> {/* Select */}
              {columns.map((col) => (
                <col key={col.key} style={{ width: col.width }} />
              ))}
              <col style={{ width: "7%" }} /> {/* Action */}
              <col style={{ width: "7%" }} /> {/* Rejection Notification */}
            </colgroup>

            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="sticky top-0 z-[1] bg-slate-50 py-3.5 px-3 shadow-[0_1px_0_0_#e2e8f0]">
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    disabled={selectableRows.length === 0 || bulkSending}
                    aria-label={t("Select all")}
                    className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={
                      "sticky top-0 z-[1] py-3.5 px-5 whitespace-nowrap shadow-[0_1px_0_0_#e2e8f0] " +
                      // COLUMN: JOB TITLE — highlighted header
                      (col.key === JOB_TITLE_KEY
                        ? "bg-indigo-50 text-indigo-700 border-r border-indigo-100"
                        : "bg-slate-50")
                    }
                  >
                    {t(col.label)}
                  </th>
                ))}
                <th className="sticky top-0 z-[1] bg-slate-50 py-3.5 px-5 whitespace-nowrap shadow-[0_1px_0_0_#e2e8f0]">
                  {t("Action")}
                </th>
                <th className="sticky top-0 z-[1] bg-slate-50 py-3.5 px-5 whitespace-nowrap shadow-[0_1px_0_0_#e2e8f0]">
                  {t("Rejection Notification")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rowIndexes.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 3}
                    className="py-10 text-center text-xs text-slate-400"
                  >
                    {isLoading
                      ? t("Loading...")
                      : rowCount === 0
                        ? t("No candidates yet")
                        : t("No candidates found")}
                  </td>
                </tr>
              )}

              {rowIndexes.map((i) => {
                const isRejecting = rejectingRows.has(i);
                const isRejected = rejectedRows.has(i);
                const isFailed = failedRows.has(i);

                return (
                  <tr key={i} className="group transition-colors hover:bg-slate-50/60">
                    {/* COLUMN: SELECT (checkbox for bulk rejection) */}
                    <td className="py-4 px-3 align-top">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(i)}
                        onChange={() => toggleRowSelected(i)}
                        disabled={isRejected || isRejecting || bulkSending}
                        aria-label={t("Select candidate")}
                        className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
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
                              {empty ? NOT_AVAILABLE : value}
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
                                {empty ? NOT_AVAILABLE : value}
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
                              {empty && (
                                <p className="text-xs italic text-slate-400">{NOT_AVAILABLE}</p>
                              )}

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
                              {t("View CV")}
                            </a>
                          ) : (
                            <span className="block truncate" title={value}>
                              {empty ? NOT_AVAILABLE : value}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* COLUMN: ACTION (status badge) */}
                    <td className="py-4 px-5 align-top">
                      {isRejected ? (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-300">
                          {t("Rejected")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-300">
                          {t("Under Review")}
                        </span>
                      )}
                    </td>

                    {/* COLUMN: REJECTION NOTIFICATION (reject button -> n8n webhook) */}
                    <td className="py-4 px-5 align-top">
                      <button
                        type="button"
                        onClick={() => rejectCandidate(i)}
                        disabled={isRejecting || isRejected}
                        title={isFailed ? t("Sending failed. Click to retry.") : undefined}
                        className={
                          "inline-flex items-center whitespace-nowrap rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed " +
                          (isRejected
                            ? "border-slate-200 bg-slate-100 text-slate-400"
                            : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-60")
                        }
                      >
                        {isRejected
                          ? t("Rejected")
                          : isRejecting
                            ? t("Sending...")
                            : isFailed
                              ? t("Retry")
                              : t("Reject")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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