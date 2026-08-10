import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  Building,
  Calendar,
  Archive,
  RefreshCw,
  Download,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { CloudRecord, listGenerationRecords } from "@/services/supabaseHistory";
import { DoneItem } from "@/types/extension";
import { ResumeDetailView } from "@/components/ext/ResumeDetailView";

interface ArchiveViewProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  onBack: () => void;
  onGoToSettings: () => void;
}

// The Archive is a read-only, permanent log — map cloud rows onto the same
// DoneItem shape so we can reuse ResumeDetailView's viewer/copy/download UI
// exactly as the "Done" list does.
function cloudRecordToDoneItem(record: CloudRecord): DoneItem {
  return {
    id: record.id,
    timestamp: new Date(record.created_at).getTime(),
    companyName: record.company_name || "Unknown Company",
    role: record.role || "Unknown Role",
    jobDescription: record.job_description,
    originalResume: record.original_resume,
    tailoredResume: record.tailored_resume,
    model: record.model || "",
    apiUrl: record.api_url || "",
    sourceUrl: record.source_url || "",
    pinned: false,
    keywords: record.keywords || undefined,
  };
}

export const ArchiveView = ({ supabaseUrl, supabaseAnonKey, onBack, onGoToSettings }: ArchiveViewProps) => {
  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  const [records, setRecords] = useState<CloudRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CloudRecord | null>(null);

  const config = { url: supabaseUrl, anonKey: supabaseAnonKey };

  const fetchRecords = useCallback(
    async (search?: string) => {
      if (!isConfigured) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await listGenerationRecords(config, { search });
        setRecords(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load archive");
      } finally {
        setIsLoading(false);
      }
    },
    [supabaseUrl, supabaseAnonKey]
  );

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Debounce search-as-you-type
  useEffect(() => {
    if (!isConfigured) return;
    const t = setTimeout(() => fetchRecords(searchTerm), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleExportJson = async () => {
    if (!isConfigured) return;
    setIsExporting(true);
    try {
      const all = await listGenerationRecords(config, { limit: 10000 });
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
      downloadBlob(blob, `resume-archive-${new Date().toISOString().split("T")[0]}.json`);
      toast.success(`Exported ${all.length} records as JSON`);
    } catch (err: any) {
      toast.error(err?.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!isConfigured) return;
    setIsExporting(true);
    try {
      const all = await listGenerationRecords(config, { limit: 10000 });
      const blob = new Blob([toCsv(all)], { type: "text/csv" });
      downloadBlob(blob, `resume-archive-${new Date().toISOString().split("T")[0]}.csv`);
      toast.success(`Exported ${all.length} records as CSV`);
    } catch (err: any) {
      toast.error(err?.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  if (selectedRecord) {
    return (
      <ResumeDetailView
        item={cloudRecordToDoneItem(selectedRecord)}
        onBack={() => setSelectedRecord(null)}
        onUpdateItem={() => {}}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-7 text-xs gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <Archive className="w-3.5 h-3.5 text-primary" />
          Cloud Archive
        </h2>
        {records.length > 0 && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {records.length}
          </Badge>
        )}
        <div className="flex-1" />
        {isConfigured && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecords(searchTerm)}
              disabled={isLoading}
              className="h-7 text-xs gap-1"
              title="Refresh"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={isExporting || records.length === 0}
              className="h-7 text-xs gap-1"
            >
              <FileJson className="w-3 h-3" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting || records.length === 0}
              className="h-7 text-xs gap-1"
            >
              <FileSpreadsheet className="w-3 h-3" />
              CSV
            </Button>
          </>
        )}
      </div>

      {!isConfigured ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12 px-6 text-center">
          <Archive className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Cloud archive not configured</p>
          <p className="text-xs mt-1 max-w-[280px]">
            Connect a free Supabase database in Settings to permanently save every resume + job
            description you generate.
          </p>
          <Button size="sm" className="mt-3 text-xs h-8 gap-1.5" onClick={onGoToSettings}>
            Open Settings → Database
          </Button>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="px-4 py-1.5 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Search company, role, job description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs h-7 pl-7"
              />
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12 px-6 text-center">
                <AlertCircle className="w-8 h-8 mb-2 text-destructive/70" />
                <p className="text-sm font-medium text-destructive">{error}</p>
                <p className="text-xs mt-1">Check your Supabase URL/key in Settings → Database.</p>
              </div>
            ) : isLoading && records.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <Archive className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  {searchTerm ? "No matching records" : "No archived resumes yet"}
                </p>
                <p className="text-xs mt-1 max-w-[240px] text-center">
                  {searchTerm ? "Try a different search" : "Successful tailoring runs will appear here automatically"}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {records.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="p-2.5 rounded-lg border bg-card border-border/60 hover:bg-muted/40 hover:border-border transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Building className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {item.company_name || "Unknown Company"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[180px]">
                        {item.role || "Unknown Role"}
                      </span>
                      <Calendar className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      {item.model && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {item.model}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Helpers ──

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(records: CloudRecord[]): string {
  const columns: (keyof CloudRecord)[] = [
    "id",
    "created_at",
    "company_name",
    "role",
    "job_description",
    "original_resume",
    "tailored_resume",
    "model",
    "api_url",
    "source_url",
    "keywords",
  ];

  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const header = columns.join(",");
  const rows = records.map((r) => columns.map((c) => escape(r[c])).join(","));
  return [header, ...rows].join("\n");
}
