import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";

interface TailorViewProps {
  onTailor: (jobDescription: string) => void;
  onCancel: () => void;
  hasApiKey: boolean;
  hasResume: boolean;
}

export const TailorView = ({
  onTailor,
  onCancel,
  hasApiKey,
  hasResume,
}: TailorViewProps) => {
  const [jobDescription, setJobDescription] = useState("");

  const missingItems: string[] = [];
  if (!hasApiKey) missingItems.push("API Key");
  if (!hasResume) missingItems.push("Base Resume");

  const handleSubmit = () => {
    if (!jobDescription.trim() || missingItems.length > 0) return;
    onTailor(jobDescription.trim());
    setJobDescription("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
        <h2 className="text-sm font-semibold">Manual Tailor</h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        {missingItems.length > 0 && (
          <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Missing: <strong>{missingItems.join(", ")}</strong>. Configure in Settings first.
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Paste a job description below. Tailoring starts immediately and appears in the Working list.
          You can also select text on any page and right-click → "Tailor My Resume".
        </p>

        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-xs font-medium mb-1.5">Job Description</label>
          <Textarea
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="flex-1 text-xs resize-none min-h-0"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!jobDescription.trim() || missingItems.length > 0}
          className="w-full gap-2 h-9"
          size="sm"
        >
          <Sparkles className="w-4 h-4" />
          Start Tailoring
        </Button>
      </div>
    </div>
  );
};
