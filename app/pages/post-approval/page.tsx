"use client";
import { useState } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import TableComponent, { type TableData } from "@/app/components/TableComponent";
import { FaCheckCircle, FaHourglassHalf } from "react-icons/fa";

export default function PostApproval() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [datas, setDatas] = useState<TableData | null>(null);
  const [approvedRows, setApprovedRows] = useState<Set<number>>(new Set());

  const approveRow = (index: number) =>
    setApprovedRows((prev) => new Set(prev).add(index));

  const jobTitles = datas?.JobTitle ?? [];
  const dateApplied = datas?.DateApplied ?? [];
  const statuses = datas?.Status ?? [];
  const rowCount = Math.max(
    jobTitles.length,
    dateApplied.length,
    statuses.length
  );

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
        rows={[{ JobTitle: "A" }, { DateApplied: "I" }, { Status: "G" }]}
        baseUrl="https://n8naurora.duckdns.org/webhook/dataFetch"
        // baseUrl="https://n8naurora.duckdns.org/webhook-test/dataFetch"
        userId="gh"
        onData={setDatas}
        debug={false}
        dataBaseId="job link"
      >
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
              <th className="py-3.5 px-5 rounded-tl-xl">{t("Job Title")}</th>
              <th className="py-3.5 px-5">{t("Date Applied")}</th>
              <th className="py-3.5 px-5">{t("Status")}</th>
              <th className="py-3.5 px-5 text-right rounded-tr-xl">
                {t("Action")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rowCount }, (_, i) => {
              const title = jobTitles[i] ?? "—";
              const date = dateApplied[i] ?? "—";
              const statusText = statuses[i] ?? "";
              const isPublished =
                approvedRows.has(i) ||
                statusText.toLowerCase().includes("publish");
              return (
                <tr
                  key={i}
                  className="group transition-colors hover:bg-slate-50/60"
                >
                  <td className="py-4 px-5">
                    <span className="text-sm font-bold text-slate-800 tracking-tight truncate">
                      {title}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-[11px] whitespace-nowrap font-semibold text-slate-700">
                      {date}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {isPublished ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                        <FaCheckCircle className="w-3.5 h-3.5" />
                        {t("Published")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                        <FaHourglassHalf className="w-3.5 h-3.5" />
                        {t("Waiting for Approval")}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-2">
                      {!isPublished && (
                        <button
                          onClick={() => approveRow(i)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition shadow-sm shadow-emerald-200 whitespace-nowrap"
                        >
                          {t("Approve")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableComponent>
    </NavAndSidebar>
  );
}
