"use client";

import { useMemo, useState } from "react";
import type { ComponentProps } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";

type NavProps = ComponentProps<typeof NavAndSidebar>;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SelectionStatus = "in_review" | "selected" | "not_selected";
type SortKey = "cvScore" | "interviewScore" | "name";
type SortOrder = "desc" | "asc";

interface Candidate {
  id: string;
  name: string;
  role: string;
  cvScore: number;
  interviewScore: number;
  interviewer: string;
  status: SelectionStatus;
  stagesCleared: number; // 0 = none, 1 = 1st round, 2 = 2nd round, 3 = final panel
  feedback: string;
}

const STAGE_LABELS = ["1st Round", "2nd Round", "Final Panel"] as const;

/* ------------------------------------------------------------------ */
/* Demo data (replace with your API / context data)                    */
/* ------------------------------------------------------------------ */

const demoCandidates: Candidate[] = [
  {
    id: "c-01",
    name: "Lanry Delth",
    role: "Applied Manager",
    cvScore: 83,
    interviewScore: 9,
    interviewer: "John Doe",
    status: "in_review",
    stagesCleared: 3,
    feedback: "Strong structured thinking in the case round.",
  },
  {
    id: "c-02",
    name: "Karin Dioen",
    role: "Engineering",
    cvScore: 85,
    interviewScore: 9,
    interviewer: "Sarah Chen",
    status: "selected",
    stagesCleared: 3,
    feedback: "Best system design answer of the batch.",
  },
  {
    id: "c-03",
    name: "Saiva Reith",
    role: "Applied Manager",
    cvScore: 85,
    interviewScore: 6,
    interviewer: "Mike Ross",
    status: "not_selected",
    stagesCleared: 2,
    feedback: "Good CV, but stakeholder handling was weak.",
  },
  {
    id: "c-04",
    name: "Maria Rhord",
    role: "Engineering",
    cvScore: 85,
    interviewScore: 8,
    interviewer: "John Doe",
    status: "in_review",
    stagesCleared: 3,
    feedback: "",
  },
  {
    id: "c-05",
    name: "Earan Arlarki",
    role: "Engineering",
    cvScore: 84,
    interviewScore: 5,
    interviewer: "Sarah Chen",
    status: "not_selected",
    stagesCleared: 2,
    feedback: "Struggled with the live coding task.",
  },
  {
    id: "c-06",
    name: "Maris Rowns",
    role: "Applied Manager",
    cvScore: 83,
    interviewScore: 7,
    interviewer: "Mike Ross",
    status: "in_review",
    stagesCleared: 3,
    feedback: "",
  },
  {
    id: "c-07",
    name: "Noor Ahsan",
    role: "Engineering",
    cvScore: 77,
    interviewScore: 6,
    interviewer: "Mike Ross",
    status: "in_review",
    stagesCleared: 2,
    feedback: "",
  },
  {
    id: "c-08",
    name: "Dams Ranadon",
    role: "Engineering",
    cvScore: 70,
    interviewScore: 7,
    interviewer: "Sarah Chen",
    status: "in_review",
    stagesCleared: 2,
    feedback: "",
  },
  {
    id: "c-09",
    name: "Kara Lolibma",
    role: "Applied Manager",
    cvScore: 65,
    interviewScore: 8,
    interviewer: "John Doe",
    status: "in_review",
    stagesCleared: 1,
    feedback: "",
  },
];

/* ------------------------------------------------------------------ */
/* Icons (inline SVG, no extra package needed)                         */
/* ------------------------------------------------------------------ */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M4 7h14M4 12h10M4 17h6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
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

function InterviewScoreBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(10, value));
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-sm font-medium text-slate-700">{safe}</span>
      <div className="flex h-6 w-1.5 items-end rounded-full bg-slate-200">
        <div
          className="w-full rounded-full bg-teal-500"
          style={{ height: `${safe * 10}%` }}
        />
      </div>
    </div>
  );
}

function StageProgress({ stagesCleared }: { stagesCleared: number }) {
  const cleared = Math.max(0, Math.min(3, stagesCleared));
  return (
    <div className="w-44">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={[
              "h-2 flex-1 rounded-full",
              i < cleared
                ? i === cleared - 1
                  ? "bg-teal-500"
                  : "bg-slate-800"
                : "bg-slate-200",
            ].join(" ")}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        {STAGE_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function StatusCell({ candidate }: { candidate: Candidate }) {
  if (candidate.status === "selected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">
        Selected
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8Z" />
        </svg>
      </span>
    );
  }

  if (candidate.status === "not_selected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-300">
        Not Selected
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 12.1-1.4 1.4L12 13.4l-2.1 2.1-1.4-1.4L10.6 12 8.5 9.9l1.4-1.4L12 10.6l2.1-2.1 1.4 1.4L13.4 12Z" />
        </svg>
      </span>
    );
  }

  return <StageProgress stagesCleared={candidate.stagesCleared} />;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function InterviewEvaluationPage() {
  // NavAndSidebar props are TUPLES, not objects.
  // pageInfo = [title, titleDescription, heighLightLink]
  const pageInfo: NavProps["pageInfo"] = [
    "Interview Evaluation and Final Selection",
    "Shortlisted candidates are reviewed here with their CV score, interview score and interviewer feedback before offers go out.",
    "interview-evaluation",
  ];

  // user = [name, profilePic, notificationNumber, purchasePlan, WebHook_Url]
  // Copy this array from candidate-scoring/page.tsx and change only the webhook value.
  const user: NavProps["user"] = [
    "Recruiter",
    "/profile.png",
    0,
    "Premium Pro",
    "WebHook_Url:InterviewEvaluation",
  ];

  const [candidates, setCandidates] = useState<Candidate[]>(demoCandidates);
  const [minScoreInput, setMinScoreInput] = useState<string>("83");
  const [search, setSearch] = useState<string>("");

  const [sortKey, setSortKey] = useState<SortKey>("cvScore");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [sortOpen, setSortOpen] = useState<boolean>(false);

  const [noteFor, setNoteFor] = useState<Candidate | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [toast, setToast] = useState<string>("");

  const minScore = useMemo(() => {
    const parsed = Number(minScoreInput);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(100, parsed));
  }, [minScoreInput]);

  // 1. keep candidates at or above the threshold
  // 2. sort high to low
  // 3. assign rank, then apply the search box
  const rankedRows = useMemo(() => {
    const dir = sortOrder === "desc" ? 1 : -1;

    const ranked = candidates
      .filter((c) => c.cvScore >= minScore)
      .slice()
      .sort((a, b) => {
        if (sortKey === "name") {
          return a.name.localeCompare(b.name) * (sortOrder === "desc" ? -1 : 1);
        }
        const primary = (b[sortKey] - a[sortKey]) * dir;
        if (primary !== 0) return primary;
        const secondary = (b.interviewScore - a.interviewScore) * dir;
        if (secondary !== 0) return secondary;
        return a.name.localeCompare(b.name);
      })
      .map((candidate, index) => ({ candidate, rank: index + 1 }));

    const query = search.trim().toLowerCase();
    if (!query) return ranked;

    return ranked.filter(
      ({ candidate }) =>
        candidate.name.toLowerCase().includes(query) ||
        candidate.role.toLowerCase().includes(query) ||
        candidate.interviewer.toLowerCase().includes(query)
    );
  }, [candidates, minScore, search, sortKey, sortOrder]);

  const selectedCount = useMemo(
    () => candidates.filter((c) => c.status === "selected").length,
    [candidates]
  );

  function confirmHiring(id: string) {
    setCandidates((prev) =>
      prev.map((c): Candidate =>
        c.id === id ? { ...c, status: "selected", stagesCleared: 3 } : c
      )
    );
  }

  function openNote(candidate: Candidate) {
    setNoteFor(candidate);
    setNoteDraft(candidate.feedback);
  }

  function saveNote() {
    if (!noteFor) return;
    const id = noteFor.id;
    setCandidates((prev) =>
      prev.map((c): Candidate => (c.id === id ? { ...c, feedback: noteDraft } : c))
    );
    setNoteFor(null);
    setNoteDraft("");
  }

  function finalizeSelection() {
    if (selectedCount === 0) {
      setToast("Confirm at least one candidate before sending offers.");
      return;
    }
    setToast(
      `Offers sent to ${selectedCount} candidate${selectedCount > 1 ? "s" : ""}.`
    );
  }

  return (
    <NavAndSidebar pageInfo={pageInfo} user={user}>
      {/* NavAndSidebar already renders the title, the description line and the page padding */}
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
                aria-label="Minimum CV score"
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
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSortOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {(
                      [
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
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className="bg-slate-100 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Rank</th>
                <th className="px-3 py-3">Candidate Name</th>
                <th className="px-3 py-3">Current Role</th>
                <th className="px-3 py-3">CV Score (%)</th>
                <th className="px-3 py-3">Interview Score (1-10)</th>
                <th className="px-3 py-3">Interviewer Name</th>
                <th className="px-3 py-3">Final Status</th>
                <th className="px-3 py-3">Add Feedback Note</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {rankedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                    No candidate scored {minScore}% or higher. Lower the score to see more
                    people.
                  </td>
                </tr>
              ) : (
                rankedRows.map(({ candidate, rank }) => {
                  const rowTone =
                    candidate.status === "not_selected"
                      ? "bg-rose-50"
                      : candidate.status === "selected"
                      ? "bg-sky-50"
                      : "bg-white";

                  return (
                    <tr key={candidate.id} className={rowTone}>
                      <td className="px-3 py-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-white">
                          {rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {candidate.name}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{candidate.role}</td>
                      <td className="px-3 py-3">
                        <CvScoreBar value={candidate.cvScore} />
                      </td>
                      <td className="px-3 py-3">
                        <InterviewScoreBar value={candidate.interviewScore} />
                      </td>
                      <td className="px-3 py-3 text-slate-600">{candidate.interviewer}</td>
                      <td className="px-3 py-3">
                        <StatusCell candidate={candidate} />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openNote(candidate)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Add feedback note for ${candidate.name}`}
                        >
                          <EditIcon />
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        {candidate.status === "in_review" ? (
                          <button
                            type="button"
                            onClick={() => confirmHiring(candidate.id)}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Confirm Hiring
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openNote(candidate)}
                            className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600"
                          >
                            View Feedback
                          </button>
                        )}
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
            {selectedCount} confirmed for an offer
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
          <p className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">
            {toast}
          </p>
        ) : null}
      </div>

      {/* Feedback note modal */}
      {noteFor ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Feedback for {noteFor.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {noteFor.role} · interviewed by {noteFor.interviewer}
            </p>

            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={5}
              placeholder="What stood out in the interview?"
              className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteFor(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveNote}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Save note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </NavAndSidebar>
  );
}