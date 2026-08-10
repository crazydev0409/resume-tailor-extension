import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Copy,
  Download,
  Building,
  CheckCircle,
  XCircle,
  Target,
} from "lucide-react";
import { DoneItem } from "@/types/extension";
import { toast } from "sonner";
import {
  generateResumePDF,
  PDF_COLOR_OPTIONS,
  PDF_TEMPLATE_OPTIONS,
  type PDFColorTheme,
  type PDFTemplate,
} from "@/services/pdfGenerator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDistanceToNow } from "date-fns";
import { stripCertificationsSection } from "@/lib/utils";

interface ResumeDetailViewProps {
  item: DoneItem;
  onBack: () => void;
  onUpdateItem: (id: string, updates: Partial<DoneItem>) => void;
}

export const ResumeDetailView = ({ item, onBack, onUpdateItem }: ResumeDetailViewProps) => {
  const [pdfColor, setPdfColor] = useState<string>("brown");
  const [pdfTemplate, setPdfTemplate] = useState<string>("classic");
  const [activeTab, setActiveTab] = useState<"resume" | "jd" | "keywords">("resume");

  const resumeContent = stripCertificationsSection(item.tailoredResume);

  const getFileName = (ext: string) => {
    const name = item.companyName || "resume";
    return `${name.toLowerCase().replace(/\s+/g, "-")}-resume.${ext}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resumeContent);
    toast.success("Copied to clipboard!");
  };

  const handleDownloadPdf = () => {
    try {
      generateResumePDF({
        content: resumeContent,
        filename: getFileName("pdf"),
        colorTheme: pdfColor as PDFColorTheme | "random",
        template: pdfTemplate as PDFTemplate | "random",
      });
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
        <Select value={pdfColor} onValueChange={setPdfColor}>
          <SelectTrigger className="w-[100px] h-6 text-[10px]">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            {PDF_COLOR_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pdfTemplate} onValueChange={setPdfTemplate}>
          <SelectTrigger className="w-[110px] h-6 text-[10px]">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            {PDF_TEMPLATE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleCopy} className="h-6 text-[10px] gap-1">
          <Copy className="w-3 h-3" />
          Copy
        </Button>
        <Button size="sm" onClick={handleDownloadPdf} className="h-6 text-[10px] gap-1">
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
            {tab === "resume" ? "Tailored Resume" : tab === "jd" ? "Job Description" : "Keywords"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "resume" && (
          <div className="prose prose-xs max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumeContent}</ReactMarkdown>
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
  URL.revokeObjectURL(url);
}
