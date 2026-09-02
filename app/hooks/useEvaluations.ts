"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";

export interface EvaluationRow {
  candidate_key: string;
  candidate_name?: string | null;
  job_title?: string | null;
  interview_score?: number | null;
  status?: string | null;
  feedback?: string | null;
  mail_sent?: boolean | null;
  breakdown?: unknown;
}

export function useEvaluations() {
  const [rows, setRows] = useState<Record<string, EvaluationRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // load everything once on mount
  useEffect(() => {
    if (!supabase) {
      console.error("[supabase] client is null — env vars missing at runtime");
      setError("Supabase is not configured. Check .env.local.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase!.from("evaluations").select("*");
      if (cancelled) return;

      if (error) {
        console.error("[supabase load]", error);
        setError(error.message);
      } else if (data) {
        const map: Record<string, EvaluationRow> = {};
        for (const row of data as EvaluationRow[]) {
          map[row.candidate_key] = row;
        }
        setRows(map);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // upsert one candidate's evaluation
  const saveEvaluation = useCallback(
    async (key: string, patch: Partial<EvaluationRow>) => {
      // optimistic local update so the UI never waits
      setRows((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? { candidate_key: key }), ...patch },
      }));

      if (!supabase) {
        console.error("[supabase] client is null — env vars missing at runtime");
        setError("Supabase is not configured.");
        return false;
      }

      const { error } = await supabase
        .from("evaluations")
        .upsert(
          { candidate_key: key, ...patch, updated_at: new Date().toISOString() },
          { onConflict: "candidate_key" }
        );

      if (error) {
        console.error("[supabase upsert]", error);
        setError(error.message);
      }
      return !error;
    },
    []
  );

  return { rows, loading, error, saveEvaluation };
}