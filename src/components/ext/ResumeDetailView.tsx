import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Copy,
  Download,
  Building,
  CheckCircle,
  XCircle,
  Target,
} from "lucide-react";
import { DoneItem, ResumeTheme } from "@/types/extension";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { stripCertificationsSection } from "@/lib/utils";
import { candidateResumeFilename, ensureResumeHeader } from "@/utils/resumeHeader";
import { PDFPreview } from "@/components/ext/PDFPreview";
import { useResumePDF } from "@/hooks/useResumePDF";

interface ResumeDetailViewProps {
  item: DoneItem;
  onBack: () => void;
  theme: ResumeTheme;
}

export const ResumeDetailView = ({ item, onBack, theme }: ResumeDetailViewProps) => {
  const resumeContent = stripCertificationsSection(
    ensureResumeHeader(item.tailoredResume, item.originalResume)
  );
  const { pdfBlob, pdfError } = useResumePDF(resumeContent, theme);
  const [activeTab, setActiveTab] = useState<"resume" | "jd" | "keywords">("resume");

  const getFileName = (ext: string) => {
    if (ext === "pdf") {
      return candidateResumeFilename(item.tailoredResume, item.originalResume);
    }
    const name = item.companyName || "resume";
    return `${name.toLowerCase().replace(/\s+/g, "-")}-resume.${ext}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resumeContent);
    toast.success("Copied to clipboard!");
  };

  const handleDownloadPdf = () => {
    try {
      if (!pdfBlob) return;
      downloadBlob(pdfBlob, getFileName("pdf"));
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadMd = () => {
    const blob = new Blob([resumeContent], { type: "text/markdown" });
    downloadBlob(blob, getFileName("md"));
    toast.success("Markdown downloaded!");
  };

  const handleDownloadJd = () => {
    const filename = `${item.companyName}-${item.role}`.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".txt";
    const blob = new Blob([item.jobDescription], { type: "text/plain" });
    downloadBlob(blob, filename);
    toast.success("Job description downloaded!");
  };

  // Keyword analysis from AI keywords if available
  const keywords = item.keywords
    ? [
        ...item.keywords.hardSkillsOnJD.map((k) => ({
          keyword: k,
          matched: item.tailoredResume.toLowerCase().includes(k.toLowerCase()),
        })),
        ...item.keywords.toolsAndTechnologiesOnJD.map((k) => ({
          keyword: k,
          matched: item.tailoredResume.toLowerCase().includes(k.toLowerCase()),
        })),
      ]
    : [];
  const matchedCount = keywords.filter((k) => k.matched).length;
  const matchPct = keywords.length > 0 ? Math.round((matchedCount / keywords.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-7 text-xs gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold truncate">{item.companyName}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">{item.role}</Badge>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-4 py-1.5 border-b shrink-0 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleCopy} className="h-6 text-[10px] gap-1">
          <Copy className="w-3 h-3" />
          Copy
        </Button>
        <Button size="sm" disabled={!pdfBlob} onClick={handleDownloadPdf} className="h-6 text-[10px] gap-1">
          <Download className="w-3 h-3" />
          PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadMd} className="h-6 text-[10px] gap-1">
          <Download className="w-3 h-3" />
          .md
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadJd} className="h-6 text-[10px] gap-1">
          <Download className="w-3 h-3" />
          JD
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b px-4 shrink-0">
        {(["resume", "jd", "keywords"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "resume"
              ? "Tailored Resume"
                : tab === "jd"
                  ? "Job Description"
                  : "Keywords"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {activeTab === "resume" && (
          <div className="mx-auto max-w-[620px]">
            {pdfError ? <p role="alert" className="text-xs text-destructive">{pdfError}</p> : <PDFPreview blob={pdfBlob} />}
          </div>
        )}

        {activeTab === "jd" && (
          <div className="text-xs whitespace-pre-wrap text-foreground leading-relaxed">
            {item.jobDescription}
          </div>
        )}


        {activeTab === "keywords" && (
          <div className="space-y-4">
            {keywords.length > 0 ? (
              <>
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Keyword Match</span>
                      <span className={`font-medium ${matchPct >= 80 ? "text-green-600" : matchPct >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                        {matchPct}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${matchPct}%` }}
                      />
                    </div>
                  </div>
                  <Badge
                    variant={matchPct >= 80 ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {matchedCount}/{keywords.length}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {keywords.map(({ keyword, matched }, i) => (
                    <Badge key={i} variant={matched ? "default" : "outline"} className="text-[10px] gap-1">
                      {matched ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                No keyword data available for this resume.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
