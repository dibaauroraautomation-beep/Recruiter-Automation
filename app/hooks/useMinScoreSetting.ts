"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient"; // match your existing client import

const SETTINGS_TABLE = "app_settings";
const MIN_SCORE_KEY = "interview_min_score";
const DEFAULT_MIN_SCORE = "43";

export function useMinScoreSetting() {
  const [minScoreInput, setMinScoreInput] = useState<string>(DEFAULT_MIN_SCORE);
  const [loaded, setLoaded] = useState(false);

  // initial fetch
  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoaded(true);
      return;
    }

    let active = true;

    (async () => {
      const { data, error } = await client
        .from(SETTINGS_TABLE)
        .select("value")
        .eq("key", MIN_SCORE_KEY)
        .maybeSingle();

      if (active && !error && data?.value != null) {
        setMinScoreInput(String(data.value));
      }

      if (active) setLoaded(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  // debounced save — waits for the initial fetch so it never overwrites a saved value with the default
  useEffect(() => {
    if (!loaded) return;

    const client = supabase;
    if (!client) return;

    const timer = setTimeout(() => {
      client
        .from(SETTINGS_TABLE)
        .upsert({ key: MIN_SCORE_KEY, value: minScoreInput }, { onConflict: "key" })
        .then(({ error }) => {
          if (error) console.error("Failed to save min score threshold:", error);
        });
    }, 600);
    return () => clearTimeout(timer);
  }, [minScoreInput, loaded]);

  return { minScoreInput, setMinScoreInput };
}