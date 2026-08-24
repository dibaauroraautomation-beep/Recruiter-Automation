"use client";
import NavAndSidebar from "@/app/components/navAndSidebar";
import TableComponent from "@/app/components/TableComponent";

import { useEffect, useState } from "react";
import { useT } from "@/app/contexts/LanguageContext";
import { useUser } from "@/app/contexts/UserContext";

type Candidate = {
  id: number;
  name: string;
  currentRole: string;
  score: number;
  skills: string[];
};

const sampleCandidates: Candidate[] = [
  {
    id: 1,
    name: "Lanry Delth",
    currentRole: "Applied Manager",
    score: 83,
    skills: ["Project Management", "Java"],
  },
  {
    id: 2,
    name: "Karin Dioen",
    currentRole: "Engineering",
    score: 85,
    skills: ["Project Management", "Java", "Python"],
  },
  {
    id: 3,
    name: "Rachel Ambers",
    currentRole: "Data Analyst",
    score: 79,
    skills: ["SQL", "Power BI", "Python"],
  },
  {
    id: 4,
    name: "Tom Becker",
    currentRole: "Backend Developer",
    score: 85,
    skills: ["Node.js", "PostgreSQL", "Docker"],
  },
];

export default function Dashboard() {
  const WebHook_Url = "sdfgh";
  const t = useT();
  const { user } = useUser();
  console.log("user.WebHook_Ur:", user.WebHook_Url["Dashboard"]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const allSelected = selectedIds.length === sampleCandidates.length;

  const toggleAll = () =>
    setSelectedIds(allSelected ? [] : sampleCandidates.map((c) => c.id));

  const toggleOne = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  useEffect(() => {
    fetch(WebHook_Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: localStorage.getItem("userEmail") ?? "",
        page: "Dashboard",
        action: "page_view",
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  return (
    <div>
      <NavAndSidebar
        pageInfo={[
          "Shortlisted Candidates_NAME",
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
        <TableComponent title="Shortlisted Candidates">
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
              {sampleCandidates.map((candidate, index) => (
                <tr
                  key={candidate.id}
                  className="group transition-colors hover:bg-slate-50/60"
                >
                  <td className="py-4 px-5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {index + 1}
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
                        onClick={() =>
                          console.log("Send invitation:", candidate.name, candidate.id)
                        }
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
                      >
                        Send Invitation
                      </button>
                      <button
                        onClick={() =>
                          console.log("Decline:", candidate.name, candidate.id)
                        }
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition shadow-sm whitespace-nowrap"
                      >
                        Decline
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableComponent>
      </NavAndSidebar>
    </div>
  );
}
