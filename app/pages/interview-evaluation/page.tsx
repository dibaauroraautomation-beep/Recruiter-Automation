"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import NavAndSidebar from "@/app/components/navAndSidebar";
import FeatureCard from "@/app/components/FeatureCard";
import globeImg from "./globe.png";
import { useT } from "@/app/contexts/LanguageContext";
import { useJobDescription } from "@/app/contexts/JobDescriptionContext";
import { useGoogleDrivePicker } from "@/app/hooks/useGoogleDrivePicker";
import { useUser } from "@/app/contexts/UserContext";

interface InterviewResult {
  [key: string]: unknown
}

const demoResult: Record<string, unknown> = {
  interview_readiness_overview: {
    summary: "Mehedi Hasan is a Computer Technology Diploma student with experience in technical support, process optimization, and laser cutting operations. He has Python programming skills but lacks significant professional software development experience required for the AI Engineer role.",
    strengths: [
      "Strong problem-solving and communication skills",
      "Experienced in designing and managing practical automation workflows"
    ],
    weaknesses: [
      "Limited hands-on experience with machine learning applications",
      "Lack of professional software development experience beyond Python programming"
    ],
    overall_readiness: "Mehedi Hasan is a strong candidate with relevant technical skills but lacks the necessary depth and breadth of experience required for the AI Engineer role. He should focus on gaining more practical experience in machine learning, cloud technologies, and DevOps tools."
  },
  job_analysis: {
    required_skills: [
      "Strong programming skills in Python",
      "Experience with machine learning applications using TensorFlow or PyTorch",
      "Experience working with Large Language Models such as GPT, Llama, Claude, or Gemini",
      "Familiarity with vector databases like Pinecone, ChromaDB, FAISS"
    ],
    preferred_skills: [
      "Experience deploying AI workloads on AWS, Azure, or Google Cloud Platform",
      "Knowledge of MLOps concepts and tools",
      "Experience with CI/CD pipelines using GitHub Actions or Jenkins"
    ],
    programming_languages: ["Python"],
    frameworks: [] as string[],
    libraries: ["TensorFlow", "PyTorch", "FastAPI", "Flask", "Docker", "Git"],
    databases: ["PostgreSQL", "MongoDB"],
    cloud: ["AWS", "Azure", "Google Cloud Platform"],
    devops: [] as string[],
    testing: [] as string[],
    security: [] as string[],
    soft_skills: [
      "Strong analytical and problem-solving abilities",
      "Excellent communication skills",
      "Ability to work independently and collaboratively",
      "Strong time management skills",
      "Continuous learning mindset",
      "Attention to detail",
      "Ability to explain technical concepts to non-technical stakeholders",
      "Adaptability in a fast-paced environment",
      "Ownership and accountability",
      "Critical thinking and decision-making skills"
    ],
    responsibilities: [
      "Design, develop, and maintain AI and machine learning solutions for production environments",
      "Build and optimize applications powered by Large Language Models (LLMs)",
      "Develop Retrieval-Augmented Generation (RAG) pipelines using vector databases",
      "Integrate AI services with web applications through RESTful APIs",
      "Fine-tune, evaluate, and optimize machine learning and NLP models",
      "Build data preprocessing and feature engineering pipelines",
      "Deploy AI applications using Docker and cloud platforms",
      "Monitor model performance and improve accuracy, latency, and scalability",
      "Collaborate with software engineers, data scientists, and product managers to deliver AI-driven features"
    ],
    qualifications: [
      "Bachelor's or Master's degree in Computer Science, Software Engineering, Artificial Intelligence, Data Science, or a related field",
      "Minimum 2 years of professional software development experience",
      "Experience with Kubernetes and Docker for containerization",
      "Familiarity with Linux development environments"
    ]
  },
  key_topics_to_study: [
    { priority: 1, topic: "Machine Learning Fundamentals", reason: "Lack of significant machine learning experience" },
    { priority: 2, topic: "Large Language Models (LLMs)", reason: "Required for developing applications using LLMs" },
    { priority: 3, topic: "Vector Databases and Retrieval-Augmented Generation (RAG) Pipelines", reason: "Key responsibilities involve working with vector databases and RAG pipelines" }
  ],
  technical_interview_questions: [
    {
      difficulty: "Beginner",
      category: "Python Programming",
      question: "Explain the concept of list comprehension in Python.",
      answer: "List comprehension is a concise way to create lists based on existing iterables. It consists of square brackets containing an expression followed by a for statement, then zero or more if statements. For example:\n```python\nsquares = [x**2 for x in range(10)]\n```\nThis code generates a list of squares from 0 to 9."
    },
    {
      difficulty: "Intermediate",
      category: "Machine Learning Libraries",
      question: "How would you fine-tune a pre-trained model using TensorFlow?",
      answer: "Fine-tuning a pre-trained model involves adjusting the weights of existing layers or adding new layers."
    },
    {
      difficulty: "Advanced",
      category: "Vector Databases",
      question: "Compare Pinecone and ChromaDB in terms of their use cases and functionality.",
      answer: "Pinecone is a vector database specifically designed for large-scale embedding retrieval. ChromaDB is a document store that also supports vector similarity search."
    }
  ],
  behavioral_interview_questions: [
    {
      question: "Can you describe a time when you had to solve a problem using technical knowledge alone?",
      sample_answer: "Sure. During my mobile repair internship, I encountered a situation where the company's inventory management system was down due to an update issue. I quickly diagnosed the problem and fixed it by manually inputting the missing parts into the database, ensuring no downtime for our clients."
    }
  ],
  hr_interview_questions: [
    {
      question: "Why do you want to work at Aurora Automation?",
      sample_answer: "I am excited about the opportunity to contribute my Python programming expertise and Microsoft Office proficiency to your mission of delivering intelligent, easy-to-use AI solutions."
    }
  ],
  viva_questions: [
    {
      question: "Can you explain how a REST API works?",
      answer: "A REST API (Representational State Transfer) allows client-server interactions over HTTP. It uses standard HTTP methods like GET, POST, PUT, DELETE to perform CRUD operations on resources."
    }
  ],
  project_based_questions: [
    {
      project: "Mobile Repair Technician",
      question: "How did you streamline the parts ordering process for your clients?",
      sample_answer: "I implemented a systematic approach where I kept track of frequently used parts and their quantities."
    }
  ],
  coding_preparation: {
    topics: ["Machine Learning", "Natural Language Processing (NLP)", "Large Language Models"],
    algorithms: [] as string[],
    data_structures: [] as string[],
    practice_problems: [
      "Fine-tuning a pre-trained model using TensorFlow or PyTorch.",
      "Building and optimizing an application with vector databases like Pinecone or ChromaDB."
    ]
  },
  missing_skills_preparation: [
    {
      skill: "Experience with machine learning applications",
      importance: "Essential for developing AI-driven solutions",
      how_to_prepare: "Practice building simple ML models, use TensorFlow or PyTorch to develop basic applications"
    }
  ],
  practical_interview_tasks: [
    {
      task: "Develop a basic machine learning model using TensorFlow",
      purpose: "To demonstrate understanding of data preprocessing, model training, and evaluation.",
      preparation: "Practice with datasets like MNIST or CIFAR-10."
    }
  ],
  behavioral_preparation: {
    what_interviewer_evaluates: [
      "Your ability to handle complex technical problems",
      "Communication skills and teamwork"
    ],
    tips: [
      "Use specific examples from your experience",
      "Highlight problem-solving steps",
      "Demonstrate clear communication and explanation of concepts"
    ]
  },
  company_expectation_summary: {
    summary: "Aurora Automation seeks a candidate with strong machine learning skills, practical experience in developing AI applications, and the ability to work collaboratively in an Agile environment."
  },
  final_checklist: [
    "Review core Python concepts",
    "Practice machine learning projects with TensorFlow or PyTorch",
    "Study vector databases like Pinecone and ChromaDB",
    "Prepare examples from the CV for behavioral questions"
  ],
  closing_message: "Best of luck for your interview!"
};

function Pill({ label, variant = "slate" }: { label: string; variant?: "slate" | "blue" | "emerald" | "amber" | "red" | "purple" }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-500",
    purple: "bg-purple-50 text-purple-700",
  };
  return <span className={`inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-full ${colors[variant]}`}>{label}</span>;
}

function cleanMd(s: string) {
  return s.replace(/```[\s\S]*?```/g, "").replace(/\*\*/g, "").trim();
}

export default function Interview_Prep_AI() {
   const { user } = useUser();
   const pageWebHookUrl = user.WebHook_Url["Interview_Prep_AI"];
  const t = useT();
  const { interviewJobDescription, setInterviewJobDescription } = useJobDescription();
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState(interviewJobDescription || "")
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const [result, setResult] = useState<InterviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { openDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (f) => {
      if (f.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10 MB.");
        return;
      }
      setCvFile(f);
    },
  });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Sync shared description to local state
  useEffect(() => {
    setJobDescription(interviewJobDescription);
  }, [interviewJobDescription]);

  const data = (result ?? {}) as Record<string, unknown>

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("demo") === "real") {
      setResult(demoResult as unknown as InterviewResult)
      setStatus('completed')
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  function startPolling(id: string) {
    if (pollingRef.current) clearInterval(pollingRef.current)
    const POLL_TIMEOUT = 600_000
    const startTime = Date.now()
    pollingRef.current = setInterval(async () => {
      try {
        if (Date.now() - startTime > POLL_TIMEOUT) {
          setError(t('Interview generation timed out'))
          setStatus('error')
          if (pollingRef.current) clearInterval(pollingRef.current)
          return
        }
        const res = await fetch(`/pages/Interview_Prep_AI/api/job-status/${id}`)
        if (!res.ok) return
        const d = await res.json()
        if (d.status === 'completed') {
          setResult(d.result as InterviewResult)
          setStatus('completed')
          if (pollingRef.current) clearInterval(pollingRef.current)
        } else if (d.status === 'error') {
          setError(d.error ?? t('Unknown error'))
          setStatus('error')
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
      } catch { }
    }, 3000)
  }

  async function handleStartInterview() {
    if (!cvFile || !jobDescription.trim()) return
    setStatus('uploading')
    setError(null)
    setResult(null)
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') ?? '' : ''
    const now = new Date()
    const ts = `${String(now.getDate()).padStart(2, '0')}_${String(now.getMonth() + 1).padStart(2, '0')}_${now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}`
    const uniqueId = `${cvFile.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')}_${ts}`

    const buildFormData = () => {
      const fd = new FormData()
      fd.append('cv', cvFile)
      fd.append('jobDescription', jobDescription)
      fd.append('uniqueId', uniqueId)
      fd.append('email', email)
      return fd
    }

    setStatus('processing')
    try {
      const res = await fetch('/pages/Interview_Prep_AI/api/start-interview', {
        method: 'POST',
        body: buildFormData(),
      })
      if (!res.ok) { setError(t('Failed to start interview')); setStatus('error'); return }
      const { jobId } = await res.json()
      startPolling(jobId)
    } catch { setError(t('Network error')); setStatus('error') }
  }

  const handleLoadDemo = useCallback(() => {
    setResult(demoResult as unknown as InterviewResult)
    setStatus('completed')
    setError(null)
  }, [])

  const handleExportPDF = useCallback(() => {
    window.print()
  }, [])

  const charCount = jobDescription.length

  return (
    <div>
      <NavAndSidebar
        pageInfo={
          [
            t("interview-evaluation_NAME"), 
            "Conducting multi-stage interviews, collecting structured feedback from stakeholders, and extending the final job offer.", 
            "interview-evaluation"
          ]
        }
        user={[
        user.name,
        user.profilePic,
        user.notificationNumber,
        user.purchasePlan,
        pageWebHookUrl
      ]}
      >
        <div className="max-w-[1120px] mx-auto space-y-6">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const allowed = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              ];
              if (!allowed.includes(f.type)) {
                alert(t("Please upload a PDF or DOC file."));
                e.target.value = "";
                return;
              }
              if (f.size > 10 * 1024 * 1024) {
                alert(t("File size must be less than 10 MB."));
                e.target.value = "";
                return;
              }
              setCvFile(f);
            }}
          />
          {topRow3StepCards()}
          {(status !== 'idle' || result) && interviewResults()}
        </div>
      </NavAndSidebar>
    </div>
  );

  function topRow3StepCards() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <FeatureCard
          number={1}
          title={t("Upload Resume")}
          subtitle={t("Upload your resume to help us tailor interview questions.")}
          bodyClassName="flex flex-col"
        >
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 mb-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left"
          >
            <svg className="w-6 h-6 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Zm7 1.5L18.5 9H14a1 1 0 0 1-1-1V3.5Z" />
            </svg>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-slate-700 truncate">
                {cvFile ? cvFile.name : t("Upload from Computer")}
              </span>
              <span className="block text-xs text-slate-400">
                {cvFile ? `${(cvFile.size / 1024).toFixed(0)} KB` : t("PDF, DOCX \u2014 Max 10 MB")}
              </span>
            </span>
            {cvFile && (
              <button
                onClick={(e) => { e.stopPropagation(); setCvFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="shrink-0 text-slate-400 hover:text-red-500 text-base leading-none p-1"
              >
                &times;
              </button>
            )}
          </button>
          <button
            onClick={openDrivePicker}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left"
          >
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path fill="#0066da" d="M4.5 19.5 7 15h10l-2.5 4.5z" />
              <path fill="#00ac47" d="M9.5 4 4.5 12.5 7 17l5-8.5z" />
              <path fill="#ffba00" d="M14.5 4h-5l5 8.5L19.5 17 14.5 4z" />
            </svg>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-700 truncate">{t("Import from Google Drive")}</span>
              <span className="block text-xs text-slate-400 truncate">{t("Select files directly from Drive")}</span>
            </span>
          </button>
          <p className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 0h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5Z" />
            </svg>
            {t("Your files are secure and private.")}
          </p>
        </FeatureCard>

        <FeatureCard
          number={2}
          title={t("Job Description")}
          subtitle={t("Paste the job description to focus your interview practice.")}
          bodyClassName="flex flex-col"
        >
          <div className="relative flex-1">
            <textarea
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                setInterviewJobDescription(e.target.value);
              }}
              placeholder={t("Paste job description here...")}
              maxLength={5000}
              className="w-full h-full min-h-[200px] text-sm text-slate-800 rounded-xl border border-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 placeholder:text-slate-400"
            />
            <span className="absolute bottom-3 right-3 text-[11px] text-slate-400">{charCount} / 5000</span>
          </div>
        </FeatureCard>

        <FeatureCard
          number={3}
          title={t("Start Interview")}
          subtitle={t("Click below to begin your AI-powered mock interview.")}
          bodyClassName="flex flex-col"
        >
          <div className="flex-1 flex items-center justify-center my-4">
            <img
              src={globeImg.src}
              alt={t("AI Interview")}
              className="w-28 h-28 object-contain opacity-30"
            />
          </div>
          <button
            onClick={handleStartInterview}
            disabled={!cvFile || !jobDescription.trim() || status === 'uploading' || status === 'processing'}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl py-3 transition shadow-sm"
          >
            {status === 'uploading' || status === 'processing' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("Processing...")}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                {t("Start Mock Interview")}
              </>
            )}
          </button>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleLoadDemo}
              className="w-full text-xs text-slate-400 hover:text-indigo-600 transition text-center py-1"
            >
              {t("Load Demo Data")}
            </button>
          </div>
        </FeatureCard>
      </div>
    );
  }

  function interviewResults() {
    return (
      <div className="space-y-5" ref={resultsRef}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">{t("Interview Readiness")}</h2>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm no-print"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t("Export PDF")}
          </button>
        </div>

        {status === 'processing' && (
          <FeatureCard icon="✦" title={t("Interview Results")} badge={{ label: t("AI Generated"), color: "emerald" }} divided>
            <div className="flex items-center justify-center h-[250px]">
              <div className="text-center space-y-3">
                <svg className="w-8 h-8 mx-auto animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-slate-500 font-medium">{t("Generating your interview...")}</p>
                <p className="text-xs text-slate-400">{t("This may take a few minutes")}</p>
              </div>
            </div>
          </FeatureCard>
        )}

        {status === 'error' && (
          <FeatureCard icon="✦" title={t("Interview Results")} badge={{ label: t("Error"), color: "red" }} divided>
            <div className="flex items-center justify-center h-[250px]">
              <div className="text-center space-y-2">
                <p className="text-red-500 font-medium">{t("Something went wrong")}</p>
                <p className="text-xs text-slate-400">{error}</p>
              </div>
            </div>
          </FeatureCard>
        )}

        {status === 'completed' && data && Object.keys(data).length > 0 && (
          <div className="space-y-5">
            <ReadinessOverviewSection data={data} />
            <JobAnalysisSection data={data} />
            <KeyTopicsSection data={data} />
            <TechnicalQuestionsSection data={data} />
            <BehavioralQuestionsSection data={data} />
            <HrQuestionsSection data={data} />
            <VivaQuestionsSection data={data} />
            <ProjectQuestionsSection data={data} />
            <CodingPrepSection data={data} />
            <MissingSkillsSection data={data} />
            <PracticalTasksSection data={data} />
            <BehavioralPrepSection data={data} />
            <CompanyExpectationSection data={data} />
            <FinalChecklistSection data={data} />
            <ClosingMessageSection data={data} />
            <RawJsonFallback data={data} />
          </div>
        )}
      </div>
    );
  }
}

function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <FeatureCard title={title} divided className={className}>
      {children}
    </FeatureCard>
  );
}

function ReadinessOverviewSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const r = data.interview_readiness_overview as Record<string, unknown> | undefined;
  if (!r) return null;
  return (
    <SectionCard title={t("Interview Readiness Overview")}>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{r.summary as string}</p>
      {Array.isArray(r.strengths) && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">{t("Strengths")}</h4>
          <ul className="space-y-1">
            {(r.strengths as string[]).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(r.weaknesses) && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">{t("Weaknesses")}</h4>
          <ul className="space-y-1">
            {(r.weaknesses as string[]).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!(r.overall_readiness as string) && (
        <div className="bg-indigo-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-indigo-700 mb-1">{t("Overall Readiness")}</p>
          <p className="text-sm text-indigo-600 leading-relaxed">{r.overall_readiness as string}</p>
        </div>
      )}
    </SectionCard>
  );
}

function JobAnalysisSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const j = data.job_analysis as Record<string, unknown> | undefined;
  if (!j) return null;
  const sections = [
    { key: "required_skills", label: t("Required Skills"), color: "bg-red-50 text-red-600 border-red-200" },
    { key: "preferred_skills", label: t("Preferred Skills"), color: "bg-amber-50 text-amber-600 border-amber-200" },
    { key: "programming_languages", label: t("Programming Languages"), color: "bg-blue-50 text-blue-600 border-blue-200" },
    { key: "libraries", label: t("Libraries"), color: "bg-purple-50 text-purple-700 border-purple-200" },
    { key: "frameworks", label: t("Frameworks"), color: "bg-slate-100 text-slate-600 border-slate-200" },
    { key: "databases", label: t("Databases"), color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { key: "cloud", label: t("Cloud Platforms"), color: "bg-orange-50 text-orange-600 border-orange-200" },
    { key: "devops", label: t("DevOps"), color: "bg-cyan-50 text-cyan-600 border-cyan-200" },
    { key: "testing", label: t("Testing"), color: "bg-pink-50 text-pink-600 border-pink-200" },
    { key: "security", label: t("Security"), color: "bg-rose-50 text-rose-600 border-rose-200" },
    { key: "soft_skills", label: t("Soft Skills"), color: "bg-teal-50 text-teal-600 border-teal-200" },
  ];
  return (
    <SectionCard title={t("Job Analysis")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(({ key, label, color }) => {
          const items = j[key] as string[] | undefined;
          if (!items || items.length === 0) return null;
          return (
            <div key={key} className={`rounded-lg border px-3 py-2.5 ${color}`}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-1.5">{label}</h4>
              <ul className="space-y-0.5">
                {items.map((item, i) => (
                  <li key={i} className="text-xs leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {Array.isArray(j.responsibilities) && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">{t("Responsibilities")}</h4>
          <ul className="space-y-1">
            {(j.responsibilities as string[]).map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(j.qualifications) && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">{t("Qualifications")}</h4>
          <ul className="space-y-1">
            {(j.qualifications as string[]).map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

function KeyTopicsSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const topics = data.key_topics_to_study as Array<Record<string, unknown>> | undefined;
  if (!topics || topics.length === 0) return null;
  return (
    <SectionCard title={t("Key Topics to Study")}>
      <div className="space-y-3">
        {topics.map((topic, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${topic.priority === 1 ? "bg-red-500" : topic.priority === 2 ? "bg-amber-500" : "bg-blue-500"}`}>
              {topic.priority as number}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">{topic.topic as string}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{topic.reason as string}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function TechnicalQuestionsSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const questions = data.technical_interview_questions as Array<Record<string, unknown>> | undefined;
  if (!questions || questions.length === 0) return null;
  const diffColor: Record<string, string> = { Beginner: "emerald", Intermediate: "amber", Advanced: "red" };
  return (
    <SectionCard title={t("Technical Interview Questions")}>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Pill label={q.difficulty as string} variant={(diffColor[q.difficulty as string] ?? "slate") as "emerald" | "amber" | "red" | "slate"} />
              <span className="text-[11px] text-slate-400">{q.category as string}</span>
            </div>
            <p className="text-sm font-medium text-slate-800 mb-1">{q.question as string}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{cleanMd(q.answer as string)}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function BehavioralQuestionsSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const questions = data.behavioral_interview_questions as Array<Record<string, unknown>> | undefined;
  if (!questions || questions.length === 0) return null;
  return (
    <SectionCard title={t("Behavioral Interview Questions")}>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-800 mb-2">{q.question as string}</p>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1">{t("Sample Answer")}</p>
              <p className="text-xs text-blue-700 leading-relaxed">{q.sample_answer as string}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function HrQuestionsSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const questions = data.hr_interview_questions as Array<Record<string, unknown>> | undefined;
  if (!questions || questions.length === 0) return null;
  return (
    <SectionCard title={t("HR Interview Questions")}>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-800 mb-2">{q.question as string}</p>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider mb-1">{t("Sample Answer")}</p>
              <p className="text-xs text-purple-700 leading-relaxed">{q.sample_answer as string}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function VivaQuestionsSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const questions = data.viva_questions as Array<Record<string, unknown>> | undefined;
  if (!questions || questions.length === 0) return null;
  return (
    <SectionCard title={t("Viva Questions")}>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-800 mb-2">{q.question as string}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{q.answer as string}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ProjectQuestionsSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const questions = data.project_based_questions as Array<Record<string, unknown>> | undefined;
  if (!questions || questions.length === 0) return null;
  return (
    <SectionCard title={t("Project-Based Questions")}>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-medium text-slate-500">{t("Project:")}</span>
              <Pill label={q.project as string} variant="blue" />
            </div>
            <p className="text-sm font-medium text-slate-800 mb-2">{q.question as string}</p>
            <div className="bg-teal-50 rounded-lg p-3">
              <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider mb-1">{t("Sample Answer")}</p>
              <p className="text-xs text-teal-700 leading-relaxed">{q.sample_answer as string}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CodingPrepSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const c = data.coding_preparation as Record<string, unknown> | undefined;
  if (!c) return null;
  return (
    <SectionCard title={t("Coding Preparation")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.isArray(c.topics) && c.topics.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">{t("Topics")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {(c.topics as string[]).map((topic, i) => (
                <Pill key={i} label={topic} variant="purple" />
              ))}
            </div>
          </div>
        )}
        {Array.isArray(c.algorithms) && c.algorithms.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">{t("Algorithms")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {(c.algorithms as string[]).map((a, i) => (
                <Pill key={i} label={a} variant="blue" />
              ))}
            </div>
          </div>
        )}
        {Array.isArray(c.data_structures) && c.data_structures.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">{t("Data Structures")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {(c.data_structures as string[]).map((d, i) => (
                <Pill key={i} label={d} variant="emerald" />
              ))}
            </div>
          </div>
        )}
      </div>
      {Array.isArray(c.practice_problems) && c.practice_problems.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">{t("Practice Problems")}</h4>
          <ul className="space-y-1">
            {(c.practice_problems as string[]).map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

function MissingSkillsSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const skills = data.missing_skills_preparation as Array<Record<string, unknown>> | undefined;
  if (!skills || skills.length === 0) return null;
  return (
    <SectionCard title={t("Missing Skills Preparation")}>
      <div className="space-y-3">
        {skills.map((s, i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-200">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold text-slate-800">{s.skill as string}</h4>
              <Pill label={s.importance as string} variant="amber" />
            </div>
            <p className="text-xs text-slate-600">{s.how_to_prepare as string}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function PracticalTasksSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const tasks = data.practical_interview_tasks as Array<Record<string, unknown>> | undefined;
  if (!tasks || tasks.length === 0) return null;
  return (
    <SectionCard title={t("Practical Interview Tasks")}>
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-800 mb-1">{task.task as string}</h4>
            <p className="text-xs text-slate-500 mb-2"><span className="font-medium text-slate-600">{t("Purpose:")}</span> {task.purpose as string}</p>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{t("Preparation")}</p>
              <p className="text-xs text-slate-600">{task.preparation as string}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function BehavioralPrepSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const b = data.behavioral_preparation as Record<string, unknown> | undefined;
  if (!b) return null;
  return (
    <SectionCard title={t("Behavioral Preparation")}>
      {Array.isArray(b.what_interviewer_evaluates) && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">{t("What Interviewer Evaluates")}</h4>
          <ul className="space-y-1">
            {(b.what_interviewer_evaluates as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(b.tips) && (
        <div>
          <h4 className="text-xs font-semibold text-slate-700 mb-2">{t("Tips")}</h4>
          <ul className="space-y-1">
            {(b.tips as string[]).map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

function CompanyExpectationSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const c = data.company_expectation_summary as Record<string, unknown> | undefined;
  if (!c) return null;
  return (
    <SectionCard title={t("Company Expectation Summary")}>
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
        <p className="text-sm text-indigo-700 leading-relaxed">{c.summary as string}</p>
      </div>
    </SectionCard>
  );
}

function FinalChecklistSection({ data }: { data: Record<string, unknown> }) {
  const t = useT();
  const list = data.final_checklist as string[] | undefined;
  if (!list || list.length === 0) return null;
  return (
    <SectionCard title={t("Final Checklist")}>
      <div className="space-y-2">
        {list.map((item, i) => (
          <label key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-slate-700">{item}</span>
          </label>
        ))}
      </div>
    </SectionCard>
  );
}

function ClosingMessageSection({ data }: { data: Record<string, unknown> }) {
  const msg = data.closing_message as string | undefined;
  if (!msg) return null;
  return (
    <div className="text-center py-6">
      <p className="text-lg font-semibold text-indigo-600">{msg}</p>
    </div>
  );
}

const EXPECTED_KEYS = new Set([
  'interview_readiness_overview',
  'job_analysis',
  'key_topics_to_study',
  'technical_interview_questions',
  'behavioral_interview_questions',
  'hr_interview_questions',
  'viva_questions',
  'project_based_questions',
  'coding_preparation',
  'missing_skills_preparation',
  'practical_interview_tasks',
  'behavioral_preparation',
  'company_expectation_summary',
  'final_checklist',
  'closing_message',
])

function RawJsonFallback({ data }: { data: Record<string, unknown> }) {
  const hasAnyKey = Object.keys(data).some(k => EXPECTED_KEYS.has(k))
  if (hasAnyKey) return null
  return (
    <FeatureCard title="Raw Response" divided>
      <pre className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-auto bg-slate-50 rounded-lg p-4">
        {JSON.stringify(data, null, 2)}
      </pre>
    </FeatureCard>
  )
}
