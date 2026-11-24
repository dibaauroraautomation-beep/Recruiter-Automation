"use client";
import { useState, useEffect, useRef, type ComponentType } from "react";
import { createPortal } from "react-dom";
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
  FaPencilAlt,
  FaCheck,
  FaFacebook,
  FaLinkedin,
  FaInstagram
} from "react-icons/fa";

const APPROVE_WEBHOOK_URL = "https://n8naurora.duckdns.org/webhook/approve-info";

// how many words to show when the post description is collapsed
const COLLAPSED_WORD_COUNT = 5;

// max platform icons shown in the closed dropdown before the "+N" chip
const MAX_VISIBLE_PLATFORM_ICONS = 3;

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

// ===== PLATFORMS =====
type IconProps = { className?: string; style?: React.CSSProperties };

// X (formerly Twitter) logo as inline SVG so no extra icon package is needed
function XIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type PlatformDef = {
  id: string;
  label: string;
  Icon: ComponentType<IconProps>;
  color: string;
};

// Add or remove platforms here, the dropdown and the webhook payload follow automatically.
const PLATFORMS: PlatformDef[] = [
  { id: "facebook", label: "Facebook", Icon: FaFacebook, color: "#1877F2" },
  { id: "linkedin", label: "LinkedIn", Icon: FaLinkedin, color: "#0A66C2" },
  { id: "x", label: "X", Icon: XIcon, color: "#0F172A" },
  { id: "instagram", label: "Instagram", Icon: FaInstagram, color: "#E4405F" }
];

// ===== PLATFORM MULTI-SELECT DROPDOWN =====
type PlatformSelectProps = {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
  t: (key: string) => string;
};

function PlatformSelect({ selected, onChange, disabled, t }: PlatformSelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const chosen = PLATFORMS.filter((p) => selected.includes(p.id));
  const visible = chosen.slice(0, MAX_VISIBLE_PLATFORM_ICONS);
  const extra = chosen.length - visible.length;

  const toggleOpen = () => {
    if (disabled) return;
    if (!open && btnRef.current) {
      // The menu is rendered in a portal with fixed positioning,
      // so the table's overflow can never clip it.
      const r = btnRef.current.getBoundingClientRect();
      const menuHeight = 250;
      const openUp = r.bottom + menuHeight > window.innerHeight && r.top > menuHeight;
      setPos({
        top: openUp ? r.top - menuHeight - 6 : r.bottom + 6,
        left: r.left,
        width: Math.max(r.width, 200),
      });
    }
    setOpen((o) => !o);
  };

  const toggleOne = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  // close on outside click, resize, or scroll
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-full border px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-60 ${
          open
            ? "border-indigo-300 bg-indigo-50/60"
            : "border-slate-200 bg-slate-50/60 hover:bg-slate-50"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {chosen.length === 0 ? (
            <span className="truncate text-xs text-slate-400">{t("Select platform")}</span>
          ) : (
            <>
              {visible.map((p) => {
                const Icon = p.Icon;
                return (
                  <Icon key={p.id} className="h-5 w-5 shrink-0" style={{ color: p.color }} />
                );
              })}
              {extra > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  +{extra}
                </span>
              )}
            </>
          )}
        </span>
        <FaChevronDown
          className={`h-3 w-3 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-multiselectable="true"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
            className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            {PLATFORMS.map((p) => {
              const Icon = p.Icon;
              const checked = selected.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 ${
                    checked ? "bg-indigo-50/60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(p.id)}
                    className="h-3.5 w-3.5 accent-indigo-600"
                  />
                  <Icon className="h-5 w-5 shrink-0" style={{ color: p.color }} />
                  <span>{p.label}</span>
                </label>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

// ===== SINGLE ROW COMPONENT =====
// All per-row column logic lives here, isolated from the table/map logic below.
type PostApprovalRowProps = {
  index: number;
  jobTitle: string;
  postContent: string; // the saved content (edited version if the user saved one)
  isApproved: boolean;
  isSending: boolean;
  isExpanded: boolean;
  isEditing: boolean;
  draft: string;
  selectedDate: string;
  selectedPlatforms: string[];
  onToggleExpand: (index: number) => void;
  onStartEdit: (index: number) => void;
  onCancelEdit: (index: number) => void;
  onDraftChange: (index: number, value: string) => void;
  onSaveEdit: (index: number) => void;
  onDateChange: (index: number, value: string) => void;
  onPlatformsChange: (index: number, ids: string[]) => void;
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
    isEditing,
    draft,
    selectedDate,
    selectedPlatforms,
    onToggleExpand,
    onStartEdit,
    onCancelEdit,
    onDraftChange,
    onSaveEdit,
    onDateChange,
    onPlatformsChange,
    onApprove,
    t,
  } = props;

  const isEmpty = !postContent || postContent.toLowerCase() === "null";
  const isUrl = !isEmpty && /^https?:\/\//i.test(postContent);
  const hasDate = Boolean(selectedDate);
  const hasPlatform = selectedPlatforms.length > 0;

  const titleEmpty = !jobTitle || jobTitle.toLowerCase() === "null";

  // Save only appears when the draft differs from the saved text (and is not blank)
  const isDirty =
    isEditing && draft.trim() !== "" && draft.trim() !== (isEmpty ? "" : postContent.trim());

  const approveDisabled = !hasDate || !hasPlatform || isSending || isEditing;
  const approveHint = isEditing
    ? t("Save or cancel your edit first")
    : !hasDate
    ? t("Select a post date first")
    : !hasPlatform
    ? t("Select at least one platform first")
    : undefined;

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
        {isEditing ? (
          <div className="rounded-xl border border-indigo-200 bg-white p-3 shadow-sm">
            <textarea
              value={draft}
              onChange={(e) => onDraftChange(index, e.target.value)}
              rows={7}
              autoFocus
              className="w-full resize-y rounded-lg border border-slate-200 p-2 text-xs leading-relaxed text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => onCancelEdit(index)}
                className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                {t("Cancel")}
              </button>
              {isDirty && (
                <button
                  type="button"
                  onClick={() => onSaveEdit(index)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-600"
                >
                  <FaCheck className="h-3 w-3" />
                  {t("Save")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 min-w-0">
            {isEmpty ? (
              <p className="min-w-0 flex-1 text-xs italic text-slate-400">—</p>
            ) : (
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
            )}

            {/* expand / collapse */}
            {!isEmpty && (
              <button
                type="button"
                onClick={() => onToggleExpand(index)}
                className="mt-1 shrink-0 text-slate-400 hover:text-slate-700"
                aria-label={isExpanded ? t("Collapse") : t("Expand")}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <FaChevronUp className="w-3 h-3" />
                ) : (
                  <FaChevronDown className="w-3 h-3" />
                )}
              </button>
            )}

            {/* edit icon, beside the expand icon */}
            <div className="relative group/edit shrink-0">
              <button
                type="button"
                onClick={() => onStartEdit(index)}
                disabled={isApproved}
                aria-label={t("Edit")}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FaPencilAlt className="h-3 w-3" />
              </button>
              {!isApproved && (
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/edit:opacity-100">
                  {t("Edit")}
                </span>
              )}
            </div>
          </div>
        )}
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

      {/* COLUMN: PLATFORM */}
      <td className="py-4 px-5 align-top">
        <PlatformSelect
          selected={selectedPlatforms}
          onChange={(ids) => onPlatformsChange(index, ids)}
          disabled={isApproved}
          t={t}
        />
      </td>

      {/* COLUMN: USER APPROVAL */}
      <td className="py-4 px-5 align-top">
        {!isApproved && (
          <button
            type="button"
            onClick={() => onApprove(index)}
            disabled={approveDisabled}
            title={approveHint}
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

  // COLUMN: POST DESCRIPTION — edit mode: which rows are being edited + their unsaved drafts
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  // COLUMN: POST DESCRIPTION — saved edits, they override the fetched text
  const [savedContents, setSavedContents] = useState<Record<number, string>>({});

  // COLUMN: POST DATE — selected date per row
  const [selectedDates, setSelectedDates] = useState<Record<number, string>>({});

  // COLUMN: PLATFORM — selected platform ids per row
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<number, string[]>>({});

  // Columns resolved by NAME, not by letter position.
  // This is the fix: letter formulas ("A", "C") resolve against the key order
  // of the returned JSON, and n8n omits empty cells — so "C" landed on formlink.
  const jobTitles = resolveColumn(datas, "jobtitle");
  const postContents = resolveColumn(datas, "postcontent");

  const rowCount = Math.max(jobTitles.length, postContents.length);

  // the text a row currently holds: the saved edit if there is one, otherwise the fetched text
  const getContent = (index: number): string =>
    savedContents[index] ?? postContents[index] ?? "";

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

  const startEdit = (index: number) => {
    // clicking the pencil again while editing behaves like Cancel
    if (editingRows.has(index)) {
      cancelEdit(index);
      return;
    }
    const current = getContent(index);
    setDrafts((prev) => ({
      ...prev,
      [index]: current.toLowerCase() === "null" ? "" : current,
    }));
    setEditingRows((prev) => new Set(prev).add(index));
  };

  const cancelEdit = (index: number) => {
    setEditingRows((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const setDraftForRow = (index: number, value: string) => {
    setDrafts((prev) => ({ ...prev, [index]: value }));
  };

  const saveEdit = (index: number) => {
    const value = (drafts[index] ?? "").trim();
    if (!value) return; // never save an empty post
    setSavedContents((prev) => ({ ...prev, [index]: value }));
    cancelEdit(index); // closes edit mode and clears the draft
  };

  const setDateForRow = (index: number, value: string) => {
    setSelectedDates((prev) => ({ ...prev, [index]: value }));
  };

  const setPlatformsForRow = (index: number, ids: string[]) => {
    setSelectedPlatforms((prev) => ({ ...prev, [index]: ids }));
  };

  // COLUMN: USER APPROVAL — sends the row to n8n; only marks Scheduled on success
  const approveRow = async (index: number) => {
    const platformIds = selectedPlatforms[index] ?? [];
    if (!selectedDates[index]) return; // guard: post date required
    if (platformIds.length === 0) return; // guard: at least one platform required
    if (editingRows.has(index)) return; // guard: unsaved edit in progress
    if (sendingRows.has(index)) return; // guard: already in flight

    setSendingRows((prev) => new Set(prev).add(index));

    const platformLabels = PLATFORMS.filter((p) => platformIds.includes(p.id)).map(
      (p) => p.label
    );

    const payload = {
      rowIndex: index,
      jobTitle: jobTitles[index] ?? null,
      postContent: getContent(index) || null, // includes the saved edit
      postDate: selectedDates[index],
      platforms: platformLabels,
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
        "Post Approval",
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
        baseUrl="https://n8naurora.duckdns.org/webhook/dataFetch"
        userId="gh"
        onData={setDatas}
        debug={false}
        dataBaseId="job link"
      >
        <table className="w-full text-left border-collapse table-fixed min-w-[1050px]">
          <colgroup>
            <col style={{ width: "13%" }} /> {/* COLUMN: JOB TITLE */}
            <col style={{ width: "30%" }} /> {/* COLUMN: POST DESCRIPTION */}
            <col style={{ width: "12%" }} /> {/* COLUMN: POST DATE */}
            <col style={{ width: "16%" }} /> {/* COLUMN: PLATFORM */}
            <col style={{ width: "9%" }} /> {/* COLUMN: USER APPROVAL */}
            <col style={{ width: "14%" }} /> {/* COLUMN: STATUS */}
          </colgroup>

          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
              <th className="py-3.5 px-5 rounded-tl-xl bg-indigo-50/80 text-indigo-700 border-r border-indigo-100">
                {t("Job Title")}
              </th>
              <th className="py-3.5 px-5">{t("Post Description")}</th>
              <th className="py-3.5 px-5">{t("Post Date")}</th>
              <th className="py-3.5 px-5">{t("Platform")}</th>
              <th className="py-3.5 px-5">{t("User Approval")}</th>
              <th className="py-3.5 px-5 rounded-tr-xl">{t("Status")}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rowCount === 0 && (
              <tr>
                <td
                  colSpan={6}
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
                postContent={getContent(i)}
                isApproved={approvedRows.has(i)}
                isSending={sendingRows.has(i)}
                isExpanded={expandedRows.has(i)}
                isEditing={editingRows.has(i)}
                draft={drafts[i] ?? ""}
                selectedDate={selectedDates[i] ?? ""}
                selectedPlatforms={selectedPlatforms[i] ?? []}
                onToggleExpand={toggleExpand}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onDraftChange={setDraftForRow}
                onSaveEdit={saveEdit}
                onDateChange={setDateForRow}
                onPlatformsChange={setPlatformsForRow}
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