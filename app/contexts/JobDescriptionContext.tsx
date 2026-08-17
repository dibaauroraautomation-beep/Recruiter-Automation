"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useUser } from "./UserContext";

type JobDescriptionContextType = {
  resumeJobDescription: string;
  setResumeJobDescription: (value: string) => void;
  interviewJobDescription: string;
  setInterviewJobDescription: (value: string) => void;
  coverLetterJobDescription: string;
  setCoverLetterJobDescription: (value: string) => void;
};

const JobDescriptionContext = createContext<JobDescriptionContextType | undefined>(undefined);

export function JobDescriptionProvider({ children }: { children: ReactNode }) {
  const [resumeJobDescription, setResumeJobDescription] = useState("");
  const [interviewJobDescription, setInterviewJobDescription] = useState("");
  const [coverLetterJobDescription, setCoverLetterJobDescription] = useState("");
  const { user } = useUser();

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        const storedResume = localStorage.getItem(`jobDesc_resume_${userEmail}`);
        const storedInterview = localStorage.getItem(`jobDesc_interview_${userEmail}`);
        const storedCoverLetter = localStorage.getItem(`jobDesc_coverLetter_${userEmail}`);
        
        if (storedResume) setResumeJobDescription(storedResume);
        if (storedInterview) setInterviewJobDescription(storedInterview);
        if (storedCoverLetter) setCoverLetterJobDescription(storedCoverLetter);
      }
    }
  }, []);

  // Save to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        localStorage.setItem(`jobDesc_resume_${userEmail}`, resumeJobDescription);
      }
    }
  }, [resumeJobDescription]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        localStorage.setItem(`jobDesc_interview_${userEmail}`, interviewJobDescription);
      }
    }
  }, [interviewJobDescription]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        localStorage.setItem(`jobDesc_coverLetter_${userEmail}`, coverLetterJobDescription);
      }
    }
  }, [coverLetterJobDescription]);

  // When user changes (logout/login), use the average of all three or the first non-empty one
  const currentDescription = resumeJobDescription || interviewJobDescription || coverLetterJobDescription;

  return (
    <JobDescriptionContext.Provider
      value={{
        resumeJobDescription: currentDescription,
        setResumeJobDescription: (value) => {
          setResumeJobDescription(value);
          setInterviewJobDescription(value);
          setCoverLetterJobDescription(value);
        },
        interviewJobDescription: currentDescription,
        setInterviewJobDescription: (value) => {
          setResumeJobDescription(value);
          setInterviewJobDescription(value);
          setCoverLetterJobDescription(value);
        },
        coverLetterJobDescription: currentDescription,
        setCoverLetterJobDescription: (value) => {
          setResumeJobDescription(value);
          setInterviewJobDescription(value);
          setCoverLetterJobDescription(value);
        },
      }}
    >
      {children}
    </JobDescriptionContext.Provider>
  );
}

export function useJobDescription() {
  const context = useContext(JobDescriptionContext);
  if (context === undefined) {
    throw new Error("useJobDescription must be used within JobDescriptionProvider");
  }
  return context;
}
