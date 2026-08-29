"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Btn, C } from "./ui";
import { Download, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export type BulkColumn = { key: string; label: string; example: string };
export type BulkImportResult = { added: number; skipped: number; note?: string };

// Generic "download a template / upload it back filled in" widget. Used for
// bulk-adding Products, Brands, or anything else list-shaped — pass the
// column definitions and a handler that turns parsed rows into real items.
export function BulkImportExcel({
  title,
  columns,
  templateFilename,
  onImport,
  instructions,
}: {
  title: string;
  columns: BulkColumn[];
  templateFilename: string;
  onImport: (rows: Record<string, string>[]) => BulkImportResult;
  instructions?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = () => {
    const headers = columns.map((c) => c.label);
    const exampleRow = columns.map((c) => c.example);
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    ws["!cols"] = columns.map(() => ({ wch: 30 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, templateFilename);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (raw.length === 0) {
        setError("That file has no rows below the header. Fill in at least one row and try again.");
        setBusy(false);
        return;
      }

      const labelToKey = Object.fromEntries(columns.map((c) => [c.label.trim().toLowerCase(), c.key]));
      const rows = raw.map((r) => {
        const row: Record<string, string> = {};
        for (const rawLabel of Object.keys(r)) {
          const key = labelToKey[rawLabel.trim().toLowerCase()] || rawLabel;
          row[key] = String(r[rawLabel] ?? "").trim();
        }
        return row;
      });

      const res = onImport(rows);
      setResult(res);
    } catch (err) {
      setError("Could not read that file. Make sure it's an .xlsx/.csv file with the same column headers as the template.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 rounded-md" style={{ border: `1px dashed ${C.border}`, backgroundColor: "#fff" }}>
      <div className="text-sm font-semibold mb-1" style={{ color: C.primary }}>
        {title}
      </div>
      {instructions && (
        <div className="text-xs mb-3 leading-relaxed" style={{ color: C.muted }}>
          {instructions}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="outline" size="sm" onClick={downloadTemplate}>
          <Download size={13} /> Download Excel template
        </Btn>
        <Btn size="sm" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload filled Excel
        </Btn>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
      </div>
      {result && (
        <div className="flex items-start gap-1.5 text-xs mt-2" style={{ color: C.primary }}>
          <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
          Added {result.added}{result.skipped ? `, skipped ${result.skipped} row(s) missing required fields` : ""}.{" "}
          {result.note}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-1.5 text-xs mt-2" style={{ color: C.danger }}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}
