"use client";
import NavAndSidebar from "@/app/components/navAndSidebar";
import TableComponent, { type TableData } from "@/app/components/TableComponent";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/app/contexts/LanguageContext";
import { useUser } from "@/app/contexts/UserContext";

type ExperienceEntry = {
  role: string;
  company: string;
  duration: string;
  tasks: string[];
};

type EducationEntry = {
  degree: string;
  institute: string;
  date: string;
};

type Candidate = {
  id: number;
  rank: number;
  name: string;
  formtitle: string;
  score: number | null;
  skills: string[];
  mustHaveSkill: string;
  mustHaveSkillMatched: number | null;
  email: string;
  profile: string;
  address: string;
  phone: string;
  links: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
};

const sendCandidateAction = (
  action: string,
  candidateId: number,
  candidateName: string = "",
  userId: string = "",
  email: string = "",
  // baseUrl: string = "https://n8naurora.duckdns.org/webhook-test/SendAnEmail",
  baseUrl: string = "https://n8naurora.duckdns.org/webhook/SendAnEmail",
): Promise<{ ok: boolean; message: string }> => {
  const targetUrl =
    `${baseUrl}?action=${encodeURIComponent(action)}` +
    `&id=${candidateId}` +
    `&name=${encodeURIComponent(candidateName)}` +
    `&userId=${encodeURIComponent(userId)}` +
    `&email=${encodeURIComponent(email)}`;

  return fetch(targetUrl, { method: "GET" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.text();
    })
    .then(() => {
      console.log(`"${action}" sent for`, candidateName, candidateId);
      return { ok: true, message: `${action} sent to ${candidateName || "candidate"}` };
    })
    .catch((error) => {
      console.error("Fetch failed:", error);
      return {
        ok: false,
        message: `Failed to send "${action}" to ${candidateName || "candidate"}`,
      };
    });
};

// Skills lists can run long; clamp to 3 lines and only offer a
// show more/less toggle when the text actually overflows that clamp.
function ExpandableSkills({ skills }: { skills: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [skills]);

  if (skills.length === 0) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  return (
    <div className="max-w-[240px] flex flex-col items-start text-left">
      <span
        ref={textRef}
        className={`w-full text-left text-xs text-slate-400 font-medium leading-relaxed ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {skills.join(", ")}
      </span>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="mt-0.5 self-start text-left text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  
  const WebHook_Url = "sdfgh";
  const [filterScore, setFilterScore] = useState<number>(0);
  const [filterMustHaveSkill, setFilterMustHaveSkill] = useState<number>(0);
  const t = useT();
  const { user } = useUser();
  console.log("user.WebHook_Ur:", user.WebHook_Url["Dashboard"]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [datas, setDatas] = useState<TableData | null>(null);

  const candidates: Candidate[] = useMemo(() => {
    if (!datas) return [];

    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const keys = Object.keys(datas);
    const col = (target: string) => {
      const key = keys.find((k) => norm(k) === norm(target));
      return key ? (datas[key] ?? []) : [];
    };

    const parseSkills = (raw?: string): string[] => {
      if (!raw || raw === "null") return [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.matched_skills)) {
          return parsed.matched_skills.map(String);
        }
      } catch {
        // not JSON, fall through to comma splitting
      }
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    };

    const cleanValue = (raw?: string): string => {
      if (!raw || raw === "null") return "";
      return raw.trim();
    };

    // musthaveskill comes in as "matched/total", e.g. "3/5". Keep the full
    // text for display, and pull out the leading number (matched count)
    // separately for the numeric threshold filter.
    const parseMustHaveSkill = (
      raw?: string,
    ): { display: string; matched: number | null } => {
      const display = cleanValue(raw);
      if (!display) return { display: "", matched: null };
      const leading = display.match(/-?\d+(\.\d+)?/);
      return {
        display,
        matched: leading ? parseFloat(leading[0]) : null,
      };
    };

    // Education/experience come in as loosely-formed JSON objects, e.g.
    // {"ex1":["task","task1"],"ex2":["task2"]} - sometimes with trailing
    // commas or stray characters. Parse leniently, and if that fails, fall
    // back to showing the raw text rather than dropping the data.
    const parseEntryMap = (raw: string | undefined, prefix: string): { label: string; tasks: string[] }[] => {
      const cleaned = cleanValue(raw);
      if (!cleaned) return [];
      try {
        const jsonSafe = cleaned.replace(/,(\s*[}\]])/g, "$1");
        const parsed = JSON.parse(jsonSafe);
        if (parsed && typeof parsed === "object") {
          const entries = Object.values(parsed as Record<string, unknown>);
          if (entries.length > 0) {
            return entries.map((value, idx) => ({
              label: `${prefix} ${idx + 1}`,
              tasks: Array.isArray(value)
                ? value.map(String)
                : [String(value)],
            }));
          }
        }
      } catch {
        // not valid JSON, fall through to showing the raw text
      }
      return [{ label: prefix, tasks: [cleaned] }];
    };

    const parseLinks = (raw?: string): string[] => {
      const cleaned = cleanValue(raw);
      if (!cleaned) return [];
      return cleaned
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s && s.toLowerCase() !== "null");
    };

    // The "education" column stores per-entry sub-fields under keys like
    // "ed1_ki" (degree), "ed1_kob" (date), "ed1_kun"/"ed1_ko_un" (institute).
    // The surrounding JSON is often malformed, so pull out "key":"value"
    // pairs directly with a regex instead of relying on JSON.parse.
    const parseEducation = (raw?: string): EducationEntry[] => {
      const cleaned = cleanValue(raw);
      if (!cleaned) return [];

      const pairRegex = /"([a-zA-Z]+\d+)_([a-zA-Z_]+)"\s*:\s*"([^"]*)"/g;
      const groups = new Map<string, Record<string, string>>();
      let match: RegExpExecArray | null;
      while ((match = pairRegex.exec(cleaned)) !== null) {
        const [, prefix, suffix, value] = match;
        if (!groups.has(prefix)) groups.set(prefix, {});
        groups.get(prefix)![suffix] = value;
      }

      if (groups.size === 0) {
        // Doesn't match the key:value shape - show the raw text as the
        // degree line rather than dropping it.
        return [{ degree: cleaned, institute: "", date: "" }];
      }

      return Array.from(groups.values()).map((fields) => ({
        degree: fields["ki"] ?? Object.values(fields)[0] ?? "",
        institute: fields["kun"] ?? fields["ko_un"] ?? "",
        date: fields["kob"] ?? "",
      }));
    };

    // The "experience" column's primary shape is a JSON array of
    // objects, e.g. [{"role":"Full Stack Developer","company":"Sunshine
    // Digital","duration":"2022 - Present"}, {...}]. Older data may
    // instead use sub-keys like "ex1_role"/"ex1_company"/"ex1_duration",
    // or the oldest {"ex1":["task","task2"]} label+tasks shape - all
    // three are supported so no existing data silently breaks.
    const parseExperience = (raw?: string): ExperienceEntry[] => {
      const cleaned = cleanValue(raw);
      if (!cleaned) return [];

      const toEntry = (item: unknown): ExperienceEntry | null => {
        if (!item || typeof item !== "object") return null;
        const obj = item as Record<string, unknown>;
        const pick = (...keys: string[]): string => {
          for (const key of keys) {
            const value = obj[key];
            if (typeof value === "string" && value.trim() && value !== "null") {
              return value.trim();
            }
          }
          return "";
        };
        const tasksRaw = obj.tasks ?? obj.task ?? obj.responsibilities ?? obj.details;
        const tasks = Array.isArray(tasksRaw)
          ? tasksRaw.map(String)
          : typeof tasksRaw === "string" && tasksRaw.trim()
            ? [tasksRaw.trim()]
            : [];
        return {
          role: pick("role", "title", "position", "jobTitle"),
          company: pick("company", "employer", "organization"),
          duration: pick("duration", "date", "dates", "period"),
          tasks,
        };
      };

      // Preferred shape: a JSON array (or object) of {role, company, duration}.
      try {
        const jsonSafe = cleaned.replace(/,(\s*[}\]])/g, "$1");
        const parsed = JSON.parse(jsonSafe);
        const items = Array.isArray(parsed)
          ? parsed
          : parsed && typeof parsed === "object"
            ? Object.values(parsed as Record<string, unknown>)
            : [];
        const entries = items
          .map(toEntry)
          .filter((entry): entry is ExperienceEntry => entry !== null);
        if (entries.length > 0) return entries;
      } catch {
        // not valid JSON, fall through to the older formats below
      }

      // Legacy shape: sub-keys like "ex1_role", "ex1_company", "ex1_duration".
      const pairRegex = /"([a-zA-Z]+\d+)_([a-zA-Z0-9_]+)"\s*:\s*"([^"]*)"/g;
      const groups = new Map<string, Record<string, string>>();
      let match: RegExpExecArray | null;
      while ((match = pairRegex.exec(cleaned)) !== null) {
        const [, prefix, suffix, value] = match;
        if (!groups.has(prefix)) groups.set(prefix, {});
        groups.get(prefix)![suffix] = value;
      }
      if (groups.size > 0) {
        return Array.from(groups.values()).map((fields) => {
          const taskKeys = Object.keys(fields)
            .filter((key) => /^task\d+$/.test(key))
            .sort(
              (a, b) =>
                parseInt(a.replace("task", ""), 10) -
                parseInt(b.replace("task", ""), 10),
            );
          return {
            role: fields["role"] ?? "",
            company: fields["company"] ?? "",
            duration: fields["duration"] ?? "",
            tasks: taskKeys.map((key) => fields[key]).filter(Boolean),
          };
        });
      }

      // Oldest shape: {"ex1":["task","task2"]} - generic label + tasks only.
      return parseEntryMap(cleaned, "Experience").map((entry) => ({
        role: entry.label,
        company: "",
        duration: "",
        tasks: entry.tasks,
      }));
    };

    const nameCol = col("CandidateName");
    const roleCol = col("formtitle");
    const scoreCol = col("Score");
    const skillsCol = col("Skills");
    const mustHaveSkillCol = col("musthaveskill");
    const rankCol = col("Rank");
    const emailCol = col("email");
    const profileCol = col("Profile");
    const addressCol = col("address");
    const educationCol = col("education");
    const experienceCol = col("experience");
    const linksCol = col("links");
    const phoneCol = col("phone");

    const rowCount = Math.max(
      nameCol.length,
      roleCol.length,
      scoreCol.length,
      skillsCol.length,
      mustHaveSkillCol.length,
      rankCol.length,
      emailCol.length,
      profileCol.length,
      addressCol.length,
      educationCol.length,
      experienceCol.length,
      linksCol.length,
      phoneCol.length,
    );

    if (rowCount === 0 && keys.length > 0) {
      console.warn(
        "[shortlisted-candidates] No matching candidate columns found. Available columns:",
        keys,
      );
      return [];
    }

    return Array.from({ length: rowCount }, (_, i) => {
      const mustHaveSkillParsed = parseMustHaveSkill(mustHaveSkillCol[i]);
      return {
        id: i + 1,
        name: nameCol[i] && nameCol[i] !== "null" ? nameCol[i] : "Unknown",
        formtitle:
          roleCol[i] && roleCol[i] !== "null" ? roleCol[i] : "Unknown",
        score:
          scoreCol[i] !== undefined &&
          scoreCol[i] !== "null" &&
          Number.isFinite(parseFloat(scoreCol[i]))
            ? parseFloat(scoreCol[i])
            : null,
        skills: parseSkills(skillsCol[i]),
        mustHaveSkill: mustHaveSkillParsed.display,
        mustHaveSkillMatched: mustHaveSkillParsed.matched,
        rank:
          rankCol[i] !== undefined &&
          Number.isFinite(parseFloat(rankCol[i]))
            ? parseFloat(rankCol[i])
            : i + 1,
        email: emailCol[i] && emailCol[i] !== "null" ? emailCol[i] : "",
        profile: cleanValue(profileCol[i]),
        address: cleanValue(addressCol[i]),
        phone: cleanValue(phoneCol[i]),
        links: parseLinks(linksCol[i]),
        education: parseEducation(educationCol[i]),
        experience: parseExperience(experienceCol[i]),
      };
    })
      .filter(
        (c) =>
          filterScore <= 0 || (c.score !== null && c.score > filterScore),
      )
      .filter(
        (c) =>
          filterMustHaveSkill <= 0 ||
          (c.mustHaveSkillMatched !== null &&
            c.mustHaveSkillMatched > filterMustHaveSkill),
      )
      .sort((a, b) => a.rank - b.rank);
  }, [datas, filterScore, filterMustHaveSkill]);

  const allSelected =
    candidates.length > 0 && selectedIds.length === candidates.length;

  const toggleAll = () =>
    setSelectedIds(allSelected ? [] : candidates.map((c) => c.id));

  const toggleOne = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const toggleExpand = (id: number) =>
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";

  const toHref = (link: string) =>
    /^https?:\/\//i.test(link) ? link : `https://${link}`;

  const [toast, setToast] = useState<
    { type: "info" | "success" | "error"; message: string } | null
  >(null);
  const [pendingActions, setPendingActions] = useState<
    Map<number, "Send Invitation" | "Decline">
  >(new Map());

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      toast.type === "error" ? 4000 : 2500,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  // Sends one candidate's request and updates that candidate's own
  // pending/toast state. Awaited one at a time (never in parallel) so
  // requests always go out and resolve individually, never simultaneously.
  const sendAndNotify = (
    action: "Send Invitation" | "Decline",
    candidate: Candidate,
  ) => {
    setPendingActions((prev) => new Map(prev).set(candidate.id, action));
    setToast({ type: "info", message: `Sending "${action}" for ${candidate.name}...` });

    return sendCandidateAction(
      action,
      candidate.id,
      candidate.name,
      user.id,
      candidate.email,
    ).then((result) => {
      setPendingActions((prev) => {
        const next = new Map(prev);
        next.delete(candidate.id);
        return next;
      });
      setToast({ type: result.ok ? "success" : "error", message: result.message });
      return result;
    });
  };

  const runAction = (
    action: "Send Invitation" | "Decline",
    candidate: Candidate,
  ) => {
    sendAndNotify(action, candidate);
  };

  const handleBulkAction = async (action: "Send Invitation" | "Decline") => {
    const targets = candidates.filter((c) => selectedIds.includes(c.id));
    if (targets.length === 0) return;

    setSelectedIds([]);

    // One request at a time, in order, instead of firing them all at once.
    for (const candidate of targets) {
      await sendAndNotify(action, candidate);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams({
      email: localStorage.getItem("userEmail") ?? "",
      page: "Dashboard",
      action: "page_view",
      timestamp: new Date().toISOString(),
    });

    fetch(`${WebHook_Url}?${params.toString()}`, { method: "GET" }).catch(() => {});
  }, []);

  return (
    <div>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
      />
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 max-w-xs px-4 py-3 rounded-xl shadow-lg text-xs font-semibold text-white transition-opacity ${
            toast.type === "success"
              ? "bg-emerald-600"
              : toast.type === "error"
                ? "bg-red-600"
                : "bg-slate-800"
          }`}
        >
          {toast.message}
        </div>
      )}
      <NavAndSidebar
        pageInfo={[
          "Shortlisted Candidates",
          "Narrowing down the entire applicant pool into a curated, high-potential segment ready for direct human interaction.",
          "shortlisted-candidates",
        ]}
        user={[
          user.name,
          user.profilePic,
          user.notificationNumber,
          user.purchasePlan,
          user.WebHook_Url["Dashboard"],
        ]}
      >
        <TableComponent
        
          title={
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                Candidates with scores {">"}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filterScore}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setFilterScore(Number.isFinite(next) ? next : 0);
                  }}
                  className="w-14 px-1.5 py-0.5 text-sm font-bold text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
                %
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                Must-have skills {">"}
                <input
                  type="number"
                  min={0}
                  value={filterMustHaveSkill}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setFilterMustHaveSkill(Number.isFinite(next) ? next : 0);
                  }}
                  className="w-14 px-1.5 py-0.5 text-sm font-bold text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </span>
            </div>
          }
          cols={[
            { Rank: "RANK(Score,Score,0)" },
            { CandidateName: "" },
            { formtitle: "" },
            { Score: `IF(Score>${filterScore},Score)` },
            { Skills: "" },
            { InterviewInvitation: "" },
            { email: "" },
            { Profile: "" },
            { address: "" },
            { experience: "" },
            { phoneno: "" },
            { links: "" },
            { education: "" },
            { musthaveskill: "" },
          ]}
          baseUrl="https://n8naurora.duckdns.org/webhook/dataFetch"
          // baseUrl="https://n8naurora.duckdns.org/webhook-test/dataFetch"
          userId="gh"
          onData={setDatas}
          debug={false}
          dataBaseId="candidate"
        >
          <>
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 mb-2 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-semibold text-slate-600">
                  {selectedIds.length} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkAction("Send Invitation")}
                    disabled={pendingActions.size > 0}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Invitation
                  </button>
                  <button
                    onClick={() => handleBulkAction("Decline")}
                    disabled={pendingActions.size > 0}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
            <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                <th className="py-3.5 px-5 rounded-tl-xl"></th>
                <th className="py-3.5 px-5">Rank</th>
                <th className="py-3.5 px-5">Candidate Name</th>
                <th className="py-3.5 px-5">Job title</th>
                <th className="py-3.5 px-5">Score (%)</th>
                <th className="py-3.5 px-5">Skills</th>
                <th className="py-3.5 px-5">Must Have Skill</th>
                <th className="py-3.5 px-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <span>Select All</span>
                  </label>
                </th>
                <th className="py-3.5 px-5 rounded-tr-xl">Interview Invitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 text-center text-xs text-slate-400"
                  >
                    Loading candidates…
                  </td>
                </tr>
              )}
              {candidates.map((candidate) => (
                <Fragment key={candidate.id}>
                <tr
                  className="group transition-colors hover:bg-slate-50/60"
                >
                  <td className="py-4 px-5 text-center">
                    <button
                      type="button"
                      onClick={() => toggleExpand(candidate.id)}
                      aria-label={expandedIds.includes(candidate.id) ? "Hide candidate CV" : "Show candidate CV"}
                      aria-expanded={expandedIds.includes(candidate.id)}
                      className="mx-auto flex items-center justify-center w-6 h-6 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          expandedIds.includes(candidate.id) ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </td>
                  <td className="py-4 px-5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {candidate.rank}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-sm font-bold text-slate-800 tracking-tight truncate">
                      {candidate.name}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                      {candidate.formtitle}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {candidate.score === null ? (
                      <span className="text-xs text-slate-300">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          <div
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${candidate.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {candidate.score}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <ExpandableSkills skills={candidate.skills} />
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-xs text-slate-400 font-medium leading-relaxed">
                      {candidate.mustHaveSkill || "Not Available Yet"}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(candidate.id)}
                      onChange={() => toggleOne(candidate.id)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runAction("Send Invitation", candidate)}
                        disabled={pendingActions.has(candidate.id)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pendingActions.get(candidate.id) === "Send Invitation"
                          ? "Sending..."
                          : "Send Invitation"}
                      </button>
                      <button
                        onClick={() => runAction("Decline", candidate)}
                        disabled={pendingActions.has(candidate.id)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pendingActions.get(candidate.id) === "Decline"
                          ? "Sending..."
                          : "Decline"}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedIds.includes(candidate.id) && (
                    <tr>
                      <td colSpan={9} className="px-5 pb-5 pt-0">
                        <div
                          style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}
                          className="sticky left-0 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] lg:w-[calc(100vw-19rem)] max-w-[980px] rounded-xl overflow-hidden shadow-md ring-1 ring-slate-200 flex flex-col sm:flex-row bg-white"
                        >

                          {/* Sidebar */}
                          <div
                            style={{ background: "#17181C", color: "#FFFFFF", padding: "36px 28px" }}
                            className="w-full sm:w-[280px] shrink-0 flex flex-col gap-[26px]"
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                              <div
                                style={{
                                  width: "56px",
                                  height: "56px",
                                  borderRadius: "50%",
                                  background: "#F2A93B",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "18px",
                                  fontWeight: 700,
                                  color: "#17181C",
                                }}
                              >
                                {getInitials(candidate.name)}
                              </div>
                              <div>
                                <div style={{ fontSize: "21px", fontWeight: 800, lineHeight: 1.15 }}>
                                  {candidate.name}
                                </div>
                                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#F2A93B", marginTop: "5px" }}>
                                  {candidate.formtitle}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 4h16v16H4z" /><path d="M4 6l8 7 8-7" />
                                </svg>
                                <span>{candidate.email || "Not on file"}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c1 .3 2 .5 3 .6a2 2 0 0 1 1.7 2z" />
                                </svg>
                                <span>{candidate.phone || "Not on file"}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{candidate.address || "Not on file"}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" />
                                </svg>
                                {candidate.links.length > 0 ? (
                                  <span style={{ display: "flex", flexWrap: "wrap", gap: "2px 6px" }}>
                                    {candidate.links.map((link, idx) => (
                                      <a
                                        key={idx}
                                        href={toHref(link)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "rgba(255,255,255,0.75)", textDecoration: "underline" }}
                                      >
                                        {link}
                                        {idx < candidate.links.length - 1 ? "," : ""}
                                      </a>
                                    ))}
                                  </span>
                                ) : (
                                  <span>Not on file</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.55)", marginBottom: "12px" }}>
                                Skills
                              </div>
                              {candidate.skills.length > 0 ? (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                                  {candidate.skills.map((skill) => (
                                    <span
                                      key={skill}
                                      style={{
                                        fontSize: "11.5px",
                                        color: "rgba(255,255,255,0.85)",
                                        border: "1px solid rgba(255,255,255,0.25)",
                                        padding: "4px 10px",
                                        borderRadius: "999px",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>No skills on file</span>
                              )}
                            </div>

                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.55)", marginBottom: "12px" }}>
                                Education
                              </div>
                              {candidate.education.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                  {candidate.education.map((entry, entryIdx) => {
                                    const dateAndInstitute = [entry.date, entry.institute]
                                      .filter(Boolean)
                                      .join(", ");
                                    return (
                                    <div key={entryIdx}>
                                      <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#FFFFFF" }}>
                                        {entry.degree || "Not on file"}
                                      </div>
                                      {dateAndInstitute && (
                                        <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.6)", marginTop: "3px" }}>
                                          {dateAndInstitute}
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.6)" }}>Not on file</div>
                              )}
                            </div>

                            <div>
                              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.55)", marginBottom: "12px" }}>
                                Certifications
                              </div>
                              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>Not on file</div>
                            </div>
                          </div>

                          {/* Main */}
                          <div style={{ flex: 1, minWidth: 0, padding: "36px 32px", display: "flex", flexDirection: "column", gap: "24px", background: "#FFFFFF" }}>

                            <div>
                              <div style={{ fontSize: "12.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#F2A93B", marginBottom: "14px" }}>
                                Profile
                              </div>
                              <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: "#3A3C44", margin: 0 }}>
                                {candidate.profile ||
                                  `${candidate.name} is being evaluated for ${candidate.formtitle}${
                                    candidate.score !== null
                                      ? `, scoring ${candidate.score}% against this role's requirements`
                                      : ""
                                  }${
                                    candidate.skills.length > 0
                                      ? `, with listed strengths in ${candidate.skills.slice(0, 4).join(", ")}.`
                                      : "."
                                  }`}
                              </p>
                            </div>

                            <div>
                              <div style={{ fontSize: "12.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#F2A93B", marginBottom: "14px" }}>
                                Experience
                              </div>
                              {candidate.experience.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                                  {candidate.experience.map((entry, entryIdx) => (
                                    <div key={entryIdx}>
                                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#17181C" }}>{entry.role || "Not on file"}</div>
                                      {(entry.company || entry.duration) && (
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginTop: "3px" }}>
                                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#6B6D76" }}>
                                            {entry.company || "Employer not on file"}
                                          </div>
                                          <div style={{ fontSize: "12px", fontWeight: 600, color: "#9A9CA6", whiteSpace: "nowrap" }}>
                                            {entry.duration || "Present"}
                                          </div>
                                        </div>
                                      )}
                                      {entry.tasks.length > 0 && (
                                        <ul style={{ margin: "8px 0 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                          {entry.tasks.map((task, idx) => (
                                            <li key={idx} style={{ fontSize: "13.5px", lineHeight: 1.6, color: "#3A3C44" }}>
                                              {task}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#17181C" }}>{candidate.formtitle}</div>
                                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#9A9CA6", whiteSpace: "nowrap" }}>Present</div>
                                  </div>
                                  <div style={{ fontSize: "13px", color: "#6B6D76", marginTop: "2px" }}>Employer not on file</div>
                                  <ul style={{ margin: "10px 0 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {candidate.skills.length > 0 ? (
                                      candidate.skills.slice(0, 4).map((skill) => (
                                        <li key={skill} style={{ fontSize: "13.5px", lineHeight: 1.6, color: "#3A3C44" }}>
                                          Brings hands-on experience with {skill}.
                                        </li>
                                      ))
                                    ) : (
                                      <li style={{ fontSize: "13.5px", lineHeight: 1.6, color: "#9A9CA6" }}>No further experience details on file.</li>
                                    )}
                                  </ul>
                                </>
                              )}
                            </div>

                          </div>

                        </div>
                      </td>
                    </tr>
                )}
                </Fragment>
              ))}
            </tbody>
            </table>
          </>
        </TableComponent>
      </NavAndSidebar>
    </div>
  );
}
