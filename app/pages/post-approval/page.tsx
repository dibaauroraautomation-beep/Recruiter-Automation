"use client";
import { useState, Fragment } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import Card from "@/app/components/Card";
import { useUser } from "@/app/contexts/UserContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import TableComponent, { type TableData }  from "@/app/components/TableComponent";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

type JobPost = {
  id: number;
  name: string;
  title: string;
  description: string;
  date: string;
  status: "published" | "pending";
};

const sampleJobs: JobPost[] = [
  {
    id: 1,
    name: "Ayesha Rahman",
    title: "Senior Software Engineer",
    description: "Building scalable backend services with Node.js and TypeScript...",
    date: "2026-08-18",
    status: "published",
  },
  {
    id: 2,
    name: "Daniel Kim",
    title: "Product Designer",
    description: "Own end-to-end design for our candidate-facing web and mobile experiences...",
    date: "2026-08-19",
    status: "pending",
  },
  {
    id: 3,
    name: "Maria Gomez",
    title: "DevOps Engineer",
    description: "Automate cloud infrastructure, CI/CD pipelines, and monitor production...",
    date: "2026-08-20",
    status: "pending",
  },
  {
    id: 4,
    name: "Omar Farooq",
    title: "Data Scientist",
    description: "Build ML models to improve candidate-job matching and hiring insights...",
    date: "2026-08-20",
    status: "pending",
  },
  {
    id: 5,
    name: "Priya Sharma",
    title: "Frontend Developer",
    description: "Craft pixel-perfect, accessible React UIs with a focus on performance...",
    date: "2026-08-17",
    status: "published",
  },
  {
    id: 6,
    name: "Liam O'Connor",
    title: "QA Automation Engineer",
    description: "Design and maintain end-to-end test suites across web and mobile...",
    date: "2026-08-16",
    status: "published",
  },
  {
    id: 7,
    name: "Sofia Rossi",
    title: "HR Business Partner",
    description: "Align talent strategy with business goals and support people operations...",
    date: "2026-08-21",
    status: "pending",
  },
  {
    id: 8,
    name: "Ethan Walker",
    title: "Technical Writer",
    description: "Write clear documentation, onboarding guides, and API references...",
    date: "2026-08-21",
    status: "pending",
  },
  {
    id: 9,
    name: "Nadia Hossain",
    title: "Backend Engineer",
    description: "Design REST APIs and event-driven services in Go and PostgreSQL...",
    date: "2026-08-15",
    status: "published",
  },
  {
    id: 10,
    name: "James Carter",
    title: "UX Researcher",
    description: "Run user interviews, usability tests, and synthesize actionable insights...",
    date: "2026-08-22",
    status: "pending",
  },
];

export default function PostApproval() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>(sampleJobs);
  const [datas, setDatas] = useState<TableData | null>(null);

  const toggleExpand = (id: number) =>
    setExpandedId((cur) => (cur === id ? null : id));

  const approveJob = (id: number) =>
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: "published" as const } : job
      )
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
                rows={[
                  { JobTitle: "A" },
                  { DateApplied: "I" },
                  { Status: "G" },
                  
                ]}
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
              <th className="py-3.5 px-5 rounded-tl-xl">Job Title</th>
              <th className="py-3.5 px-5">applied role</th>
              <th className="py-3.5 px-5">date applied</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right rounded-tr-xl">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const isExpanded = expandedId === job.id;
              const isPublished = job.status === "published";
              return (
                <Fragment key={job.id}>
                  <tr className="group transition-colors hover:bg-slate-50/60">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm shadow-indigo-200">
                          {job.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-bold text-slate-800 tracking-tight truncate">
                            {job.name}
                          </span>
                          <span className="text-xs text-slate-400 font-medium truncate">
                            {job.description}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100/80 rounded-lg px-3 py-1.5 whitespace-nowrap">
                        {job.title}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-[11px] whitespace-nowrap font-semibold text-slate-700">
                        {job.date}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {isPublished ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                          <FaCheckCircle className="w-3.5 h-3.5" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                          <FaHourglassHalf className="w-3.5 h-3.5" />
                          Waiting for Approval
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        {!isPublished && (
                          <button
                            onClick={() => approveJob(job.id)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition shadow-sm shadow-emerald-200 whitespace-nowrap"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpand(job.id)}
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center shrink-0"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <FaChevronUp className="w-3 h-3" />
                          ) : (
                            <FaChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="py-4 px-5">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                            Description
                          </p>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {job.description}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </TableComponent>
    </NavAndSidebar>
  );
}