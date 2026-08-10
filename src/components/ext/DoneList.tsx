import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Trash2,
  Building,
  Pin,
  PinOff,
  Edit3,
  ExternalLink,
  StickyNote,
  Copy,
  FileText,
  Calendar,
  Download,
  FileDown,
  CheckCircle,
} from "lucide-react";
import { DoneItem } from "@/types/extension";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { generateResumePDFBlob } from "@/services/pdfGenerator";
import { stripCertificationsSection } from "@/lib/utils";

interface DoneListProps {
  items: DoneItem[];
  onViewItem: (item: DoneItem) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onUpdateItem: (id: string, updates: Partial<DoneItem>) => void;
  onTogglePin: (id: string) => void;
  hasWorkingItems: boolean;
}

export const DoneList = ({
  items,
  onViewItem,
  onRemoveItem,
  onClearAll,
  onUpdateItem,
  onTogglePin,
  hasWorkingItems,
}: DoneListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<DoneItem | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editLink, setEditLink] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const filtered = items
    .filter(
      (item) =>
        item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jobDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestamp - a.timestamp;
    });

  const handleEditItem = (item: DoneItem) => {
    setEditingItem(item);
    setEditNote(item.note || "");
    setEditLink(item.link || "");
  };

  const handleSaveEdit = () => {
    if (editingItem) {
      onUpdateItem(editingItem.id, {
        note: editNote.trim() || undefined,
        link: editLink.trim() || undefined,
      });
      setEditingItem(null);
      toast.success("Updated!");
    }
  };

  // ── Download all resumes, each into its own folder (named the generated
  //    resume name) containing a single PDF named after the candidate ──
  const handleDownloadAllResumes = async () => {
    if (items.length === 0) return;
    setIsDownloading(true);
    toast.success(`Downloading ${items.length} PDF resumes...`);
    try {
      // Download earliest first
      const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        const folderName = sanitizeForPath(`${item.companyName} - ${item.role}`);
        const candidateName = extractCandidateName(item.tailoredResume);
        const fileName = `${candidateName} Resume.pdf`;
        const pdfBlob = generateResumePDFBlob({
          content: item.tailoredResume,
          filename: fileName,
          colorTheme: "brown",
          template: "classic",
        });
        // Forward slash tells Chrome to place the file inside a subfolder.
        await downloadBlobToPath(pdfBlob, `${folderName}/${fileName}`);
        if (i < sorted.length - 1) {
          await delay(300);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to download PDFs");
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Download all JDs as individual .txt files ──
  const handleDownloadAllJDs = async () => {
    if (items.length === 0) return;
    setIsDownloading(true);
    toast.success(`Downloading ${items.length} job descriptions...`);
    try {
      const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        const name = `${item.companyName}-${item.role}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const blob = new Blob([item.jobDescription], { type: "text/plain" });
        downloadBlob(blob, `${name}.txt`);
        if (i < sorted.length - 1) {
          await delay(300);
        }
      }
    } catch {
      toast.error("Failed to download JDs");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <h2 className="text-xs font-semibold">Done</h2>
          {items.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {items.length}
            </Badge>
          )}
        </div>

        <div className="flex-1" />

        {items.length > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAllResumes}
              disabled={isDownloading}
              className="h-7 text-xs gap-1"
            >
              <FileDown className="w-3 h-3" />
              {isDownloading ? "..." : `All PDFs (${items.length})`}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAllJDs}
              disabled={isDownloading}
              className="h-7 text-xs gap-1"
            >
              <Download className="w-3 h-3" />
              {isDownloading ? "..." : `All JDs (${items.length})`}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Done</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete all {items.length} completed resumes? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearAll}>Clear All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      {/* Search */}
      {items.length > 3 && (
        <div className="px-4 py-1.5 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search company, role, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs h-7 pl-7"
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
            <FileText className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {searchTerm ? "No matching resumes" : "No completed resumes yet"}
            </p>
            <p className="text-xs mt-1 max-w-[240px] text-center">
              {searchTerm
                ? "Try a different search"
                : "Select text on any job posting, right-click → 'Tailor My Resume'"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`group p-2.5 rounded-lg border transition-all cursor-pointer ${
                  item.pinned
                    ? "bg-primary/5 border-primary/30 hover:bg-primary/10"
                    : "bg-card border-border/60 hover:bg-muted/40 hover:border-border"
                }`}
                onClick={() => onViewItem(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Building className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{item.companyName}</span>
                      {item.pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[180px]">
                        {item.role}
                      </span>
                      <Calendar className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                        {item.model}
                      </Badge>
                    </div>
                    {(item.note || item.link) && (
                      <div className="flex items-center gap-2 mt-1">
                        {item.note && (
                          <div className="flex items-center gap-1">
                            <StickyNote className="w-2.5 h-2.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {item.note}
                            </span>
                          </div>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Link
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost" size="sm" className="h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(stripCertificationsSection(item.tailoredResume)); toast.success("Copied!"); }}
                      title="Copy resume"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className={`h-6 w-6 p-0 ${item.pinned ? "text-primary" : ""}`}
                      onClick={(e) => { e.stopPropagation(); onTogglePin(item.id); }}
                      title={item.pinned ? "Unpin" : "Pin"}
                    >
                      {item.pinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}
                      title="Edit notes"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost" size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                          <AlertDialogDescription>
                            Delete {item.companyName} — {item.role}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onRemoveItem(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <AlertDialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Notes</AlertDialogTitle>
            <AlertDialogDescription>
              {editingItem?.companyName} — {editingItem?.role}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Note</Label>
              <Textarea
                placeholder="Add a note..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Link</Label>
              <Input
                placeholder="https://..."
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

// Download a blob to a path that may include subfolders (relative to Downloads).
// The plain anchor `download` attribute flattens "/" into "_", so real
// subfolders require the chrome.downloads API.
function downloadBlobToPath(blob: Blob, path: string): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const chromeDownloads =
      typeof chrome !== "undefined" ? chrome.downloads : undefined;

    if (chromeDownloads?.download) {
      chromeDownloads.download(
        { url, filename: path, saveAs: false, conflictAction: "uniquify" },
        () => {
          // Keep the blob alive long enough for Chrome to read it.
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          resolve();
        }
      );
    } else {
      // Fallback: cannot create folders, so use the file name only.
      const a = document.createElement("a");
      a.href = url;
      a.download = path.split("/").pop() || path;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Strip characters that are invalid in file/folder names while keeping it readable.
function sanitizeForPath(name: string): string {
  return (
    name
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "Resume"
  );
}

// Pull the candidate's name from the resume markdown (first "# " heading).
function extractCandidateName(resume: string): string {
  const match = resume.match(/^#\s+(.+)$/m);
  const cleaned = (match ? match[1] : "")
    .replace(/\*\*/g, "")
    .replace(/#/g, "")
    .trim();
  if (!cleaned) return "Resume";
  return sanitizeForPath(
    cleaned
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
  );
}
