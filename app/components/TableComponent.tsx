"use client";
import Link from "next/link";
import NavAndSidebar from "@/app/components/navAndSidebar";
import GoogleSheetReader from "@/app/components/GoogleSheetReader";
import InteractiveBadge from "@/app/components/IneractiveBadge";
import { useState, useCallback } from "react";
import { useUser } from "@/app/contexts/UserContext";
import Card from "@/app/components/FeatureCard";
import { PiSuitcaseSimpleFill } from "react-icons/pi";
import { FaLocationArrow } from "react-icons/fa";
import { FaClock } from "react-icons/fa6";
import { RiCalendarScheduleFill } from "react-icons/ri";
import { IoGiftSharp } from "react-icons/io5";
import { MdCancel } from "react-icons/md";



const fetchDataFromTable = (
  statusState: any,
  applicationId: number,
  roleName: string = "",
  userId: string = "",
  baseUrl: string = "https://n8naurora.duckdns.org/webhook/data-Fetch"
  // baseUrl: string = "https://n8naurora.duckdns.org/webhook-test/data-Fetch",
) => {
  console.log("geting datas:", applicationId);

  // FIX: Explicitly updated 'statusSates' to 'statusState' to match standard parsers
  let targetUrl = `${baseUrl}?userId=${userId}&statusState=${statusState}&id=${applicationId}`;
  
  if (roleName) {
    targetUrl += `&role=${encodeURIComponent(roleName)}`;
  }
 
  fetch(targetUrl, { method: "GET" })
    .then((response) => {
      // console.log(response);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.text();
      // return response;
    })
    .then((e) => console.log("get data as text form",e))
    .catch((error) => console.error("Fetch failed:", error));
};




export default function TableComponent() {

  console.log("dfjhkfjhksdfjh::::");
  let a = fetchDataFromTable("asdfg",23,"sdf","ewe");
console.log("aaaaa",a);

  const { user } = useUser();
  const pageWebHookUrl = user.WebHook_Url["ApplicationsStatus"];
  console.log("user.name:", user.name,"user.id:", user.id,"pageWebHookUrl = user.WebHook_Url[\"ApplicationsStatus\"]", pageWebHookUrl);
  const [applications, setApplications] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalApplications: 0,
    applied: 0,
    underReview: 0,
    interviewScheduled: 0,
    offerReceived: 0,
    rejected: 0,
  });

  const handleDataLoaded = useCallback((rows: any[]) => {
    let applied = 0;
    let underReview = 0;
    let interviewScheduled = 0;
    let offerReceived = 0;
    let rejected = 0;

    const parsedApps = rows.map((row, index) => {
      // FIX: Added row.review to look for your exact spreadsheet header
      const statusText = (row.review || row.status || row.Status || "").trim();
      const statusLower = statusText.toLowerCase();

      let variant = "applied";
      if (statusLower.includes("review")) { 
        variant = "review"; 
        underReview++; 
      } else if (statusLower.includes("interview")) { 
        variant = "interview"; 
        interviewScheduled++; 
      } else if (statusLower.includes("offer")) { 
        variant = "offer"; 
        offerReceived++; 
      } else if (statusLower.includes("reject")) { 
        variant = "reject"; // Aligned with internal enum values[cite: 1, 2]
        rejected++; 
      } else { 
        applied++; 
      }

      return {
        id: index + 1,
        role: row.role || row.Role || "Unknown Position",
        company: row.company || row.Company || "Unknown Company",
        type: row.type || row.Type || "Full-time",
        location: row.location || row.Location || "Remote",
        workplace: row.workplace || row.Workplace || "Remote",
        dateApplied: row.dateApplied || row["Date Applied"] || "N/A",
        relativeDate: row.relativeDate || "",
        status: { text: statusText || "Applied", variant },
        progress: {
          current: variant === "applied" ? 1 : variant === "review" ? 2 : variant === "interview" ? 3 : variant === "offer" ? 5 : null,
          total: 5,
          color: variant === "applied" ? "bg-blue-500" : variant === "review" ? "bg-amber-500" : variant === "interview" ? "bg-purple-500" : variant === "offer" ? "bg-emerald-500" : "bg-slate-200"
        }
      };
    });

    setApplications(parsedApps);
    setMetrics({
      totalApplications: rows.length,
      applied,
      underReview,
      interviewScheduled,
      offerReceived,
      rejected,
    });
  }, []);

  const getPercentage = (count: number) => {
    if (metrics.totalApplications === 0) return "0.0%";
    return `${((count / metrics.totalApplications) * 100).toFixed(1)}%`;
  };

  return (
    <div>
      
        

        <Card
          width="100%"
          header={
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full py-1 relative">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-[280px] shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.603 10.601z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search jobs, companies..."
                    className="w-full text-xs text-slate-700 outline-none placeholder-slate-400 bg-transparent"
                  />
                </div>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full py-2 bg-white">
              <span className="text-xs font-normal text-slate-400">
                Showing <span className="font-medium text-slate-600">1</span> to{" "}
                <span className="font-medium text-slate-600">{applications.length}</span> of{" "}
                <span className="font-medium text-slate-600">{metrics.totalApplications}</span>{" "}
                applications
              </span>
            </div>
          }
        >
          <div className="w-full bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[980px]">
                <thead>
                  <tr className="border-b border-slate-50 text-[11px] font-semibold text-slate-500 bg-slate-50/30">
                    <th className="py-3 px-5 w-[32%]">Job & Company</th>
                    <th className="py-3 px-5 w-[20%]">Location</th>
                    <th className="py-3 px-5 w-[15%]">Date Applied</th>
                    <th className="py-3 px-5 w-[15%]">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100/70">
                  {applications.map((app, index) => {
                    const googleSheetRowNumber = index + 2;
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xs shrink-0 text-white font-bold text-xs">
                              {app.company.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 tracking-tight truncate">
                                  {app.role}
                                </span>
                                <span className="bg-blue-50/60 text-blue-600 border border-blue-100/40 text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                                  {app.type}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium truncate">
                                {app.company}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-1 text-[11px] text-slate-400 font-medium">
                            <span className="text-slate-600 truncate">{app.location}</span>
                            <span>{app.workplace}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="text-[11px] whitespace-nowrap font-semibold text-slate-700">
                            {app.dateApplied}
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <InteractiveBadge 
                            initialStatus={app.status.text} 
                            applicationId={googleSheetRowNumber} 
                            roleName={app.role}
                            userId={user.id}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      
      
      <GoogleSheetReader userId={user.id} debug={false} onDataLoaded={handleDataLoaded} />
    </div>
  );
}