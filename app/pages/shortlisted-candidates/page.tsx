"use client";
import NavAndSidebar from "@/app/components/navAndSidebar";
import TableComponent, { type TableData } from "@/app/components/TableComponent";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/app/contexts/LanguageContext";
import { useUser } from "@/app/contexts/UserContext";

type Candidate = {
  id: number;
  rank: number;
  name: string;
  currentRole: string;
  score: number | null;
  skills: string[];
  email: string;
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

export default function Dashboard() {
  
  const WebHook_Url = "sdfgh";
  const filterScore:number = 50;
  const t = useT();
  const { user } = useUser();
  console.log("user.WebHook_Ur:", user.WebHook_Url["Dashboard"]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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

    const nameCol = col("CandidateName");
    const roleCol = col("CurrentRole");
    const scoreCol = col("Score");
    const skillsCol = col("Skills");
    const rankCol = col("Rank");
    const emailCol = col("email");

    const rowCount = Math.max(
      nameCol.length,
      roleCol.length,
      scoreCol.length,
      skillsCol.length,
      rankCol.length,
      emailCol.length,
    );

    if (rowCount === 0 && keys.length > 0) {
      console.warn(
        "[shortlisted-candidates] No matching candidate columns found. Available columns:",
        keys,
      );
      return [];
    }

    return Array.from({ length: rowCount }, (_, i) => ({
      id: i + 1,
      name: nameCol[i] && nameCol[i] !== "null" ? nameCol[i] : "Unknown",
      currentRole:
        roleCol[i] && roleCol[i] !== "null" ? roleCol[i] : "Unknown",
      score:
        scoreCol[i] !== undefined &&
        scoreCol[i] !== "null" &&
        Number.isFinite(parseFloat(scoreCol[i]))
          ? parseFloat(scoreCol[i])
          : null,
      skills: parseSkills(skillsCol[i]),
      rank:
        rankCol[i] !== undefined &&
        Number.isFinite(parseFloat(rankCol[i]))
          ? parseFloat(rankCol[i])
          : i + 1,
      email: emailCol[i] && emailCol[i] !== "null" ? emailCol[i] : "",
    }))
      .filter((c) => c.score !== null && c.score > filterScore)
      .sort((a, b) => a.rank - b.rank);
  }, [datas]);

  const allSelected =
    candidates.length > 0 && selectedIds.length === candidates.length;

  const toggleAll = () =>
    setSelectedIds(allSelected ? [] : candidates.map((c) => c.id));

  const toggleOne = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

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
          title={`Candidates with scores > ${filterScore}%`}
          cols={[
            { Rank: "RANK(Score,Score,0)" },
            { CandidateName: "" },
            { CurrentRole: "" },
            { Score: `IF(Score>${filterScore},Score)` },
            { Skills: "" },
            { InterviewInvitation: "" },
            { email: "" },
          ]}
          baseUrl="https://n8naurora.duckdns.org/webhook/dataFetch"
          // baseUrl="https://n8naurora.duckdns.org/webhook-test/dataFetch"
          userId="gh"
          onData={setDatas}
          debug={false}
          dataBaseId="candidate info"
        >
          <>
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between gap-3 px-5 py-2.5 mb-2 bg-slate-50 border border-slate-200 rounded-xl">
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
                <th className="py-3.5 px-5 rounded-tl-xl">Rank</th>
                <th className="py-3.5 px-5">Candidate Name</th>
                <th className="py-3.5 px-5">Current Role</th>
                <th className="py-3.5 px-5">Score (%)</th>
                <th className="py-3.5 px-5">Skills</th>
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
                    colSpan={7}
                    className="py-10 text-center text-xs text-slate-400"
                  >
                    Loading candidates…
                  </td>
                </tr>
              )}
              {candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="group transition-colors hover:bg-slate-50/60"
                >
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
                      {candidate.currentRole}
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
                    <span className="text-xs text-slate-400 font-medium leading-relaxed">
                      {candidate.skills.join(", ")}
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
              ))}
            </tbody>
            </table>
          </>
        </TableComponent>
      </NavAndSidebar>
    </div>
  );
}
