import { useEffect, useState } from "react";
import Papa from "papaparse";

interface ColumnData {
  [headerName: string]: string[];
}

interface GoogleSheetReaderProps {
  userId: string;
  debug?: boolean;
  onDataLoaded?: (rows: any[]) => void;
}

const SPREADSHEET_ID = "1_Uq1xvIv1HkQ-5OabwIjEVSiKcAOvLNqsy-UjAfJqN4";
const MAPPER_SHEET_GID = 744129216;

const parseCsv = (csvText: string): Promise<Record<string, string>[]> =>
  new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as Record<string, string>[]),
      error: (err: any) => reject(new Error(err.message || "CSV parse error")),
    });
  });

const fetchCsvText = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const text = await response.text();
  if (text.trim().startsWith("<!DOCTYPE html>")) {
    throw new Error("Received HTML instead of CSV. Ensure your Google Sheet is shared as 'Anyone with the link can view'.");
  }
  return text;
};

const GoogleSheetReader: React.FC<GoogleSheetReaderProps> = ({ userId, debug = false, onDataLoaded }) => {
  const [columnOrientedData, setColumnOrientedData] = useState<ColumnData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      if (!userId) {
        setError("No userId provided.");
        setLoading(false);
        return;
      }

      try {
        // 1. Read the mapping sheet and find the row whose uniqueId matches the userId
        const mapperUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${MAPPER_SHEET_GID}`;
        const mapperRows = await parseCsv(await fetchCsvText(mapperUrl));

        const matched = mapperRows.find(
          // (row) => (row.uniqueId || "").trim().toLowerCase() === userId.trim().toLowerCase()
          (row) => (row.email || "").trim().toLowerCase() === userId.trim().toLowerCase()
        );
        const sheetName = matched ? (matched["Sheet Name"] || "").trim() : "";

        if (!sheetName) {
          throw new Error(`No sheet found for userId "${userId}".`);
        }

        // 2. Fetch the user's own sheet, selected by its sheet name
        const sheetCsvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        const rows = await parseCsv(await fetchCsvText(sheetCsvUrl));

        if (cancelled) return;

        if (rows.length === 0) {
          setColumnOrientedData({});
          setLoading(false);
          return;
        }

        if (onDataLoaded) {
          onDataLoaded(rows);
        }

        const headers = Object.keys(rows[0]);
        const transformedData: ColumnData = {};
        headers.forEach((header) => {
          transformedData[header] = [];
        });

        rows.forEach((row) => {
          headers.forEach((header) => {
            transformedData[header].push(row[header] || "");
          });
        });

        console.log("Transformed Column Object:", transformedData);

        setColumnOrientedData(transformedData);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching sheet data:", err);
        if (cancelled) return;
        setError(err.message || "Unknown error");
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, onDataLoaded]);

  // IF DEBUG IS FALSE: Don't render anything onto the layout screen
  if (!debug) return null;

  // IF DEBUG IS TRUE: Show normal loading, error, and table visual feedback loops
  if (loading) return <p className="p-4 text-xs text-slate-500">Loading sheet data...</p>;
  if (error) return <p className="p-4 text-xs text-rose-500 font-semibold">Error: {error}</p>;

  const headers = Object.keys(columnOrientedData);
  const rowCount = headers.length > 0 ? columnOrientedData[headers[0]].length : 0;

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 mt-4">
      <h2 className="text-sm font-bold text-slate-800 mb-3">Google Sheet Records (Debug Mode)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              {headers.map((header) => (
                <th key={header} className="py-2 px-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/50">
                {headers.map((header) => (
                  <td key={header} className="py-2 px-3 text-slate-600">
                    {columnOrientedData[header][rowIndex]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GoogleSheetReader;