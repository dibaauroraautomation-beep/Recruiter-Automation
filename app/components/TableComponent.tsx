"use client";
import Link from "next/link";
import NavAndSidebar from "@/app/components/navAndSidebar";
import GoogleSheetReader from "@/app/components/GoogleSheetReader";
import InteractiveBadge from "@/app/components/IneractiveBadge";
import { useState, useCallback, useEffect, ReactNode } from "react";
import { useUser } from "@/app/contexts/UserContext";
import Card from "@/app/components/FeatureCard";
import { PiSuitcaseSimpleFill } from "react-icons/pi";
import { FaLocationArrow } from "react-icons/fa";
import { FaClock } from "react-icons/fa6";
import { RiCalendarScheduleFill } from "react-icons/ri";
import { IoGiftSharp } from "react-icons/io5";
import { MdCancel } from "react-icons/md";

const fetchDataFromTable = async (
  userId: string = "",
  baseUrl: string = "https://n8naurora.duckdns.org/webhook/dataFetch",
  // baseUrl: string = "https://n8naurora.duckdns.org/webhook-test/dataFetch",
  dataBaseId: string = "",
): Promise<string> => {
  console.log("geting datas:", userId);

  const targetUrl = `${baseUrl}?userId=${userId}&dataBaseId=${dataBaseId}`;

  const response = await fetch(targetUrl, { method: "GET" });
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return await response.text();
};

interface ScapColumnData {
  [header: string]: string[];
}

export type { ScapColumnData as TableData };

// Module-level cache: one fetch per unique request, shared across every
// page/instance for the whole browser session.
const tableDataCache = new Map<string, ScapColumnData>();
const inflightRequests = new Map<string, Promise<ScapColumnData>>();

function extractRows(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return [];

    // n8n items often wrap payloads as { json: {...} }
    if (
      parsed.every(
        (item) =>
          item !== null &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          "json" in (item as Record<string, unknown>) &&
          typeof (item as Record<string, unknown>).json === "object",
      )
    ) {
      return parsed.map(
        (item) =>
          (item as { json: Record<string, unknown> }).json ?? {},
      );
    }

    return parsed.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
  }

  if (parsed !== null && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    const arrKey = ["data", "rows", "items", "results", "result"].find((key) =>
      Array.isArray(obj[key]),
    );
    if (arrKey) return extractRows(obj[arrKey]);
    return [obj];
  }

  return [];
}

const toCellValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

function TableComponentScapData(text: string = ""): ScapColumnData {
  try {
    if (!text || !text.trim()) return {};

    const parsed = extractRows(JSON.parse(text));

    if (parsed.length === 0) {
      console.warn(
        "TableComponentScapData: no rows found in response:",
        text.slice(0, 300),
      );
      return {};
    }

    const headers = Array.from(
      new Set(parsed.flatMap((row) => Object.keys(row))),
    );

    const result: ScapColumnData = {};

    headers.forEach((header) => {
      result[header] = parsed.map((row) => toCellValue(row[header]));
    });

    return result;
  } catch (error) {
    console.error("Failed to parse table data:", error);
    console.warn("Raw response was:", String(text).slice(0, 300));
    return {};
  }
}

type FormulaToken = {
  type: "number" | "string" | "ident" | "op" | "lparen" | "rparen" | "comma";
  value: string;
};

type FormulaValue = number | string;

const tokenize = (expr: string): FormulaToken[] => {
  const tokens: FormulaToken[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === " " || ch === "\t") {
      i++;
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      let num = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }
    if (ch === '"') {
      let s = "";
      i++;
      while (i < expr.length && expr[i] !== '"') {
        s += expr[i];
        i++;
      }
      i++;
      tokens.push({ type: "string", value: s });
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      let ident = "";
      while (i < expr.length && /[A-Za-z0-9]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      tokens.push({ type: "ident", value: ident });
      continue;
    }
    const two = expr.substr(i, 2);
    if (two === ">=" || two === "<=" || two === "==" || two === "!=") {
      tokens.push({ type: "op", value: two });
      i += 2;
      continue;
    }
    if (
      ch === ">" ||
      ch === "<" ||
      ch === "+" ||
      ch === "-" ||
      ch === "*" ||
      ch === "/" ||
      ch === "%"
    ) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen", value: "(" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen", value: ")" });
      i++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ type: "comma", value: "," });
      i++;
      continue;
    }
    i++;
  }
  return tokens;
};

const toNumber = (v: FormulaValue): number => {
  if (typeof v === "number") return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
};

const isNumeric = (v: FormulaValue): boolean => !Number.isNaN(toNumber(v));

const arithmetic = (
  a: FormulaValue,
  b: FormulaValue,
  op: string,
): FormulaValue => {
  if (op === "+") {
    if (isNumeric(a) && isNumeric(b)) return toNumber(a) + toNumber(b);
    return String(a) + String(b);
  }
  if (op === "-") return toNumber(a) - toNumber(b);
  if (op === "*") return toNumber(a) * toNumber(b);
  if (op === "/") return toNumber(b) === 0 ? NaN : toNumber(a) / toNumber(b);
  if (op === "%") return toNumber(a) % toNumber(b);
  return NaN;
};

const compareValues = (
  a: FormulaValue,
  b: FormulaValue,
  op: string,
): boolean => {
  if (isNumeric(a) && isNumeric(b)) {
    const x = toNumber(a);
    const y = toNumber(b);
    switch (op) {
      case ">":
        return x > y;
      case "<":
        return x < y;
      case ">=":
        return x >= y;
      case "<=":
        return x <= y;
      case "==":
        return x === y;
      case "!=":
        return x !== y;
    }
  }
  const x = String(a);
  const y = String(b);
  switch (op) {
    case ">":
      return x > y;
    case "<":
      return x < y;
    case ">=":
      return x >= y;
    case "<=":
      return x <= y;
    case "==":
      return x === y;
    case "!=":
      return x !== y;
  }
  return false;
};

const truthy = (v: FormulaValue): boolean => {
  if (typeof v === "number") return v !== 0;
  const s = v.toLowerCase();
  return !(
    s === "" ||
    s === "0" ||
    s === "null" ||
    s === "false" ||
    s === "no" ||
    s === "ney"
  );
};

const normalizeOutput = (v: FormulaValue): string => {
  if (typeof v === "number") return Number.isNaN(v) ? "null" : String(v);
  return v;
};

class FormulaParser {
  tokens: FormulaToken[];
  pos = 0;

  constructor(tokens: FormulaToken[]) {
    this.tokens = tokens;
  }

  peek(): FormulaToken | undefined {
    return this.tokens[this.pos];
  }

  next(): FormulaToken {
    return this.tokens[this.pos++];
  }

  parseExpression(): FormulaValue {
    return this.parseComparison();
  }

  parseComparison(): FormulaValue {
    let left = this.parseAdditive();
    while (
      this.peek()?.type === "op" &&
      [">", "<", ">=", "<=", "==", "!="].includes(this.peek()!.value)
    ) {
      const op = this.next().value;
      const right = this.parseAdditive();
      left = compareValues(left, right, op) ? "true" : "false";
    }
    return left;
  }

  parseAdditive(): FormulaValue {
    let left = this.parseMultiplicative();
    while (
      this.peek()?.type === "op" &&
      ["+", "-"].includes(this.peek()!.value)
    ) {
      const op = this.next().value;
      const right = this.parseMultiplicative();
      left = arithmetic(left, right, op);
    }
    return left;
  }

  parseMultiplicative(): FormulaValue {
    let left = this.parseUnary();
    while (
      this.peek()?.type === "op" &&
      ["*", "/", "%"].includes(this.peek()!.value)
    ) {
      const op = this.next().value;
      const right = this.parseUnary();
      left = arithmetic(left, right, op);
    }
    return left;
  }

  parseUnary(): FormulaValue {
    if (this.peek()?.type === "op" && this.peek()!.value === "-") {
      this.next();
      return -toNumber(this.parseUnary());
    }
    return this.parsePrimary();
  }

  parsePrimary(): FormulaValue {
    const tok = this.next();

    if (tok.type === "number") return parseFloat(tok.value);
    if (tok.type === "string") return tok.value;

    if (tok.type === "lparen") {
      const value = this.parseExpression();
      this.next();
      return value;
    }

    if (tok.type === "ident") {
      const name = tok.value.toUpperCase();

      if (name === "IF") {
        this.next();
        const condition = this.parseExpression();
        this.next();
        const thenValue = this.parseExpression();

        let elseValue: FormulaValue = "null";
        if (this.peek()?.type === "comma") {
          this.next();
          elseValue = this.parseExpression();
        }

        this.next();
        return truthy(condition) ? thenValue : elseValue;
      }

      if (name === "CONTAINS") {
        this.next();
        const haystack = this.parseExpression();
        this.next();
        const needle = this.parseExpression();
        this.next();
        return String(haystack)
          .toLowerCase()
          .includes(String(needle).toLowerCase())
          ? "true"
          : "false";
      }

      return tok.value;
    }

    return "";
  }
}

// Identifiers that must never be treated as column references
const FORMULA_RESERVED_WORDS = new Set(["IF", "CONTAINS", "TRUE", "FALSE", "RANK"]);

const escapeFormulaValue = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const evaluateFormula = (
  formula: string,
  resolveHeader: (key: string) => string | undefined,
  columnData: ScapColumnData,
  rowIndex: number,
): string => {
  const resolveRefValue = (ref: string): string => {
    const m = /^([A-Za-z]+)([0-9]*)$/.exec(ref.trim());
    if (!m) return "null";
    const header = resolveHeader(m[1]);
    if (!header) return "null";
    const targetRow = m[2] ? parseInt(m[2], 10) - 1 : rowIndex;
    return String(columnData[header]?.[targetRow] ?? "null");
  };

  // RANK(cellRef[, rangeRef[, order]]) — competition ranking of the current
  // row's value within a column. Non-numeric cells ("null") are ignored.
  // order omitted/0 = highest value gets rank 1; order 1 = lowest gets rank 1.
  const withRanks = formula.replace(
    /\bRANK\s*\(\s*([A-Za-z]+[0-9]*)\s*(?:,\s*([A-Za-z]+[0-9]*)\s*)?(?:,\s*([0-9]+)\s*)?\)/g,
    (_match, cellRef: string, rangeRef?: string, orderArg?: string) => {
      const current = parseFloat(resolveRefValue(cellRef));
      if (!Number.isFinite(current)) return '"null"';
      const header = resolveHeader(
        (rangeRef ?? cellRef).trim().replace(/[0-9]+$/, ""),
      );
      const pool = (header ? (columnData[header] ?? []) : [])
        .map((v) => parseFloat(v))
        .filter((v) => Number.isFinite(v));
      const ascending = orderArg !== undefined && orderArg !== "0";
      let rank = 1;
      for (const v of pool) {
        if (ascending ? v < current : v > current) rank++;
      }
      return `"${rank}"`;
    },
  );

  // Supports "A1" (explicit row), "A"/"a" (current row), case-insensitive.
  // Quoted string literals are left untouched.
  const withValues = withRanks.replace(
    /"(?:[^"]*)"|([A-Za-z]+)([0-9]*)/g,
    (match, letters?: string, digits?: string) => {
      if (letters === undefined) return match;

      const key = letters.toUpperCase();
      if (!digits && FORMULA_RESERVED_WORDS.has(key)) return match;

      return `"${escapeFormulaValue(resolveRefValue(match))}"`;
    },
  );

  try {
    const parser = new FormulaParser(tokenize(withValues));
    return normalizeOutput(parser.parseExpression());
  } catch (error) {
    console.error("Formula parse error:", formula, error);
    return "null";
  }
};

async function TableComponentScapDatabackEndModify(
  cols: Record<string, string>[] = [],
  userId: string = "",
  baseUrl: string = "",
  dataBaseId: string = "",
): Promise<ScapColumnData> {
  const text = await fetchDataFromTable(userId, baseUrl,dataBaseId);
  const columnData = TableComponentScapData(text);

  if (cols.length === 0) return columnData;

  // No non-empty value provided in any col -> return the actual data object as-is
  const hasFormulaEntry = cols.some(
    (obj) => String(Object.values(obj)[0] ?? "").trim() !== "",
  );
  if (!hasFormulaEntry) return columnData;

  const headers = Object.keys(columnData);
  const rowCount = headers.length > 0 ? columnData[headers[0]].length : 0;

  const result: ScapColumnData = {};

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normHeaderMap = new Map<string, string>();
  headers.forEach((header) => normHeaderMap.set(norm(header), header));

  // Friendly names -> possible real sheet headers
  const ALIASES: Record<string, string[]> = {
    candidatename: ["applicantname", "candidate", "name"],
    currentrole: ["role", "position", "jobtitle", "appliedrole"],
    score: ["atsscore", "candidatescrore", "candidatescore"],
    skills: ["skillsneeded", "skill", "skillset"],
    interviewinvitation: ["interviewstatus", "invitationstatus", "status"],
    rank: ["rank", "sno", "slno", "serialnumber"],
    email: ["candidateemail", "applicantemail", "contactemail", "emailaddress", "mail"],
  };

  const resolveHeader = (key: string): string | undefined => {
    const n = norm(key);
    if (normHeaderMap.has(n)) return normHeaderMap.get(n);
    for (const alias of ALIASES[n] ?? []) {
      const hit = normHeaderMap.get(alias);
      if (hit) return hit;
    }
    // Fallback: substring match, so compound headers like "Candidate Email
    // Address" still resolve for a friendly name like "email".
    const partial = headers.find((h) => {
      const hn = norm(h);
      return hn.includes(n) || n.includes(hn);
    });
    if (partial) return partial;
    return undefined;
  };

  cols.forEach((obj) => {
    const name = Object.keys(obj)[0];
    if (name === undefined) return;
    const formula = (obj[name] ?? "").trim();

    // Empty formula = select the raw column from the fetched data as-is
    // (resolved through aliases + case/space-insensitive matching)
    if (!formula) {
      const resolved = resolveHeader(name);
      if (resolved) {
        result[name] = columnData[resolved];
        return;
      }

      // Rank has no source column -> generate sequential numbers
      if (norm(name) === "rank") {
        result[name] = Array.from({ length: rowCount }, (_, i) =>
          String(i + 1),
        );
        return;
      }

      console.warn(
        `[TableComponent] Column "${name}" not found in fetched data. Available:`,
        headers,
      );
      return;
    }

    result[name] = Array.from({ length: rowCount }, (_, rowIndex) =>
      evaluateFormula(formula, resolveHeader, columnData, rowIndex),
    );
  });

  // Nothing matched or was produced -> fall back to the actual data
  if (Object.keys(result).length === 0) return columnData;

  return result;
}

export default function TableComponent({
  children,
  title,
  cols = [],
  userId,
  baseUrl,
  onData,
  debug = false,
  dataBaseId ,
}: {
  children?: ReactNode | ((data: ScapColumnData | null) => ReactNode);
  title: string;
  cols: Record<string, string>[];
  userId: string;
  baseUrl: string;
  onData?: (data: ScapColumnData) => void;
  debug?: boolean;
  dataBaseId: string;
}) {
  const { user } = useUser();

  const colsKey = JSON.stringify(cols);
  const [datas, setDatas] = useState<ScapColumnData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Shared across all instances/pages: identical requests are fetched once
    const cacheKey = `${baseUrl}|${userId}|${dataBaseId}|${colsKey}`;

    const cached = tableDataCache.get(cacheKey);
    if (cached) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setDatas(cached);
          onData?.(cached);
        }
      });
      return;
    }

    let request = inflightRequests.get(cacheKey);
    if (!request) {
      request = TableComponentScapDatabackEndModify(
        cols,
        userId,
        baseUrl,
        dataBaseId
      ).finally(() => {
        inflightRequests.delete(cacheKey);
      });
      inflightRequests.set(cacheKey, request);
    }

    request
      .then((data) => {
        tableDataCache.set(cacheKey, data);
        if (!cancelled) {
          setError(null);
          setDatas(data);
          console.log("hmm", data);
          onData?.(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load table data:", error);
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : String(error),
          );
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colsKey, userId, baseUrl]);

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
    console.log("Actual Scraped Table Data:", rows);
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
          current:
            variant === "applied"
              ? 1
              : variant === "review"
                ? 2
                : variant === "interview"
                  ? 3
                  : variant === "offer"
                    ? 5
                    : null,
          total: 5,
          color:
            variant === "applied"
              ? "bg-blue-500"
              : variant === "review"
                ? "bg-amber-500"
                : variant === "interview"
                  ? "bg-purple-500"
                  : variant === "offer"
                    ? "bg-emerald-500"
                    : "bg-slate-200",
        },
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
            <h2 className="text-sm font-bold text-slate-800 tracking-tight whitespace-nowrap">
              {title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-[280px] shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <svg
                  className="w-4 h-4 text-slate-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.603 10.601z"
                  />
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
              <span className="font-medium text-slate-600">
                {applications.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-600">
                {metrics.totalApplications}
              </span>{" "}
              applications
            </span>
          </div>
        }
      >
        <div className="w-full bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {typeof children === "function" ? (
              <>{children(datas)}</>
            ) : children ? (
              <>{children}</>
            ) : (
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
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/40 transition-colors group"
                      >
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
                            <span className="text-slate-600 truncate">
                              {app.location}
                            </span>
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
            )}
          </div>
        </div>
      </Card>

      {debug && error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold text-red-700">
            Table data error ({title})
          </p>
          <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-red-600 font-mono">
            {error}
          </pre>
        </div>
      )}

      <GoogleSheetReader
        userId={user.id}
        debug={false}
        onDataLoaded={handleDataLoaded}
      />
    </div>
  );
}
