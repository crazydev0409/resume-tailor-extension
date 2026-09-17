import { useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResumeThemeCustomizer } from "./ResumeThemeCustomizer";
import { useResumePDF } from "@/hooks/useResumePDF";
import type { DoneItem, ResumeTheme, ResumeThemeLibrary } from "@/types/extension";
import { DEFAULT_RESUME_THEME, parseResumeDocument, type ResumeSection } from "@/utils/resumeTheme";
import { ensureResumeHeader } from "@/utils/resumeHeader";
import { stripCertificationsSection } from "@/lib/utils";

const SAMPLE = `# Alex Morgan
alex@example.com | github.com/alex

## Summary
Software engineer building accessible, reliable applications.

## Skills
**Languages:** TypeScript, Python, SQL
**Tools:** React, Node.js, Git

## Experience
**Software Engineer**
Example Company | 2022 - Present
- Built reliable applications and improved the developer experience.

## Education
**B.S. Computer Science**
Example University | 2022

## Projects
**Developer Dashboard**
- Created a dashboard for monitoring application performance.`;

interface ThemeViewProps {
  theme: ResumeTheme;
  library: ResumeThemeLibrary;
  onApply: (theme: ResumeTheme, existingId?: string) => Promise<string>;
  onBack: () => void;
  items: DoneItem[];
  baseResume: string;
}

export function ThemeView({ theme, library, onApply, onBack, items, baseResume }: ThemeViewProps) {
  const [draft, setDraft] = useState(theme);
  const [editingId, setEditingId] = useState<string | undefined>(library.activeId);
  const [saving, setSaving] = useState(false);
  const selectedTheme = library.themes.find((entry) => entry.id === editingId)?.theme;
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(selectedTheme);
  const [previewIndex, setPreviewIndex] = useState("0");
  const sources = useMemo(() => {
    const choices = items.map((item) => ({
      label: `${item.companyName} — ${item.role}`,
      content: stripCertificationsSection(ensureResumeHeader(item.tailoredResume, item.originalResume)),
    }));
    if (baseResume.trim()) choices.push({ label: "Base resume", content: stripCertificationsSection(ensureResumeHeader(baseResume, baseResume)) });
    if (!choices.length) choices.push({ label: "Sample resume", content: SAMPLE });
    return choices;
  }, [items, baseResume]);
  const source = sources[Number(previewIndex)] ?? sources[0];
  const sections = useMemo(() => {
    const all = new Map<string, ResumeSection>();
    for (const choice of sources) {
      for (const section of parseResumeDocument(choice.content).sections) {
        if (!all.has(section.id)) all.set(section.id, section);
      }
    }
    return [...all.values()];
  }, [sources]);
  const { pdfBlob, pdfError } = useResumePDF(source.content, draft);

  return <div className="flex h-full flex-col">
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <Button variant="ghost" size="sm" onClick={onBack} className="h-7 gap-1 text-xs"><ArrowLeft className="h-3 w-3" />Back</Button>
      <div>
        <h2 className="text-sm font-semibold">Customize & Preview</h2>
        <p className="text-[10px] text-muted-foreground">Active theme: {theme.name}. Used automatically for every resume.</p>
      </div>
    </div>
    <div className="flex items-center gap-2 border-b px-3 py-2 text-xs">
      <label htmlFor="saved-resume-theme" className="shrink-0">Saved themes</label>
      <select id="saved-resume-theme" disabled={saving} value={editingId ?? ""}
        className="h-8 min-w-0 flex-1 rounded border bg-background px-2" onChange={(event) => {
          const entry = library.themes.find((saved) => saved.id === event.target.value);
          if (entry) { setEditingId(entry.id); setDraft(entry.theme); }
        }}>
        {!editingId && <option value="">New theme (not saved)</option>}
        {library.themes.map((entry) => <option key={entry.id} value={entry.id}>{entry.theme.name}{entry.id === library.activeId ? " (active)" : ""}</option>)}
      </select>
      <Button variant="outline" className="h-8 text-xs" disabled={saving} onClick={() => {
        setEditingId(undefined);
        setDraft({ ...draft, name: "" });
      }}>New theme</Button>
    </div>
    <div className="flex items-center gap-2 border-b px-3 py-2 text-xs">
      <label htmlFor="resume-theme-name" className="shrink-0">Theme name</label>
      <Input id="resume-theme-name" maxLength={60} className="h-8 min-w-0 flex-1 text-xs" value={draft.name ?? ""}
        placeholder="e.g. My professional resume" disabled={saving}
        onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      <span className="text-[10px] text-muted-foreground">{hasChanges ? "Unsaved changes" : "Saved"}</span>
      <Button className="h-8 text-xs" disabled={saving || !draft.name?.trim() || !pdfBlob || !!pdfError} onClick={async () => {
        if (library.themes.some((entry) => entry.id !== editingId && entry.theme.name?.toLowerCase() === draft.name?.trim().toLowerCase())) {
          toast.error("A theme already has this name. Choose a different name.");
          return;
        }
        setSaving(true);
        const next = { ...draft, name: draft.name!.trim() };
        try {
          const id = await onApply(next, editingId);
          setEditingId(id);
          setDraft(next);
          toast.success(`"${next.name}" saved and applied to all resumes`);
        } catch {
          toast.error("Could not save theme. Your previous theme is still active. Please retry.");
        } finally { setSaving(false); }
      }}>{saving ? "Saving…" : "Save & apply"}</Button>
    </div>
    <div className="flex items-center gap-2 border-b px-3 py-2 text-xs">
      <label htmlFor="theme-preview-resume">Preview</label>
      <select id="theme-preview-resume" className="h-7 min-w-0 flex-1 rounded border bg-background px-2" value={previewIndex} onChange={(event) => setPreviewIndex(event.target.value)}>
        {sources.map((choice, index) => <option key={index} value={String(index)}>{choice.label}</option>)}
      </select>
      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={!pdfBlob} onClick={() => {
        if (!pdfBlob) return;
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Resume preview.pdf";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}><Download className="h-3 w-3" />PDF</Button>
    </div>
    <fieldset disabled={saving} className="min-h-0 min-w-0 flex-1">
      <ResumeThemeCustomizer content={source.content} sections={sections} theme={draft} onChange={setDraft}
        pdfBlob={pdfBlob} pdfError={pdfError} onReset={() => setDraft({ ...DEFAULT_RESUME_THEME })} />
    </fieldset>
  </div>;
}
