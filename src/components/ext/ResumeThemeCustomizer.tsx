import { PDFPreview } from "./PDFPreview";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HeaderAlignment, ResumeFont, ResumeTheme } from "@/types/extension";
import { RESUME_FONT_OPTIONS, resumeFontAsset } from "@/utils/resumeFontCatalog";
import {
  orderResumeSections,
  parseResumeDocument,
  type ResumeSection,
} from "@/utils/resumeTheme";

interface ResumeThemeCustomizerProps {
  content: string;
  theme: ResumeTheme;
  onChange: (theme: ResumeTheme) => void;
  pdfBlob: Blob | null;
  pdfError: string;
  onReset: () => void;
  sections?: ResumeSection[];
}

const COLOR_PRESETS = ["#8b5a2b", "#1e3a5f", "#166534", "#7c3aed", "#be123c"];

export function ResumeThemeCustomizer({
  content,
  theme,
  onChange,
  pdfBlob,
  pdfError,
  onReset,
  sections,
}: ResumeThemeCustomizerProps) {
  const document = parseResumeDocument(content);
  const effectiveOrder = theme.sectionOrder;
  const orderedSections = orderResumeSections(sections ?? document.sections, effectiveOrder);

  const update = <K extends keyof ResumeTheme>(key: K, value: ResumeTheme[K]) => {
    onChange({ ...theme, [key]: value });
  };

  const moveSection = (id: string, direction: -1 | 1) => {
    const current = orderedSections.map((section) => section.id);
    const index = current.indexOf(id);
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    update("sectionOrder", [...current, ...theme.sectionOrder.filter((key) => !current.includes(key))]);
  };

  const alignments: Array<{ value: HeaderAlignment; icon: typeof AlignLeft; label: string }> = [
    { value: "left", icon: AlignLeft, label: "Left" },
    { value: "center", icon: AlignCenter, label: "Center" },
    { value: "right", icon: AlignRight, label: "Right" },
  ];

  return (
    <div className="grid h-full min-h-0 grid-cols-[230px_1fr] bg-muted/30">
      <aside className="overflow-y-auto border-r bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold">Theme</h3>
            <p className="text-[10px] text-muted-foreground">Changes appear instantly</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Reset theme"
            aria-label="Reset theme"
            onClick={onReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Accent color
        </label>
        <div className="mb-4 flex items-center gap-1.5">
          <input
            type="color"
            value={theme.accentColor}
            onChange={(event) => update("accentColor", event.target.value)}
            className="h-7 w-8 cursor-pointer rounded border bg-transparent p-0.5"
            aria-label="Choose accent color"
          />
          <Input
            value={theme.accentColor}
            onChange={(event) => {
              if (/^#[0-9a-f]{6}$/i.test(event.target.value)) update("accentColor", event.target.value);
            }}
            className="h-7 flex-1 px-2 font-mono text-[10px]"
            aria-label="Accent color hex value"
          />
        </div>
        <div className="mb-4 flex gap-1.5">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
                theme.accentColor.toLowerCase() === color ? "border-foreground" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => update("accentColor", color)}
              aria-label={`Use ${color}`}
            />
          ))}
        </div>

        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Layout
        </label>
        <select
          aria-label="Layout"
          value={theme.template ?? "classic"}
          onChange={(event) => update("template", event.target.value as "classic" | "modern")}
          className="mb-4 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
        >
          <option value="classic">Classic</option>
          <option value="modern">Modern</option>
        </select>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Font
        </label>
        <select
          aria-label="Font"
          value={theme.font}
          onChange={(event) => update("font", event.target.value as ResumeFont)}
          className="mb-4 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
        >
            {RESUME_FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}{font.value === "roboto" ? "" : ` (${resumeFontAsset(font.value).label})`}
              </option>
            ))}
        </select>

        <p className="-mt-2 mb-4 text-[10px] text-muted-foreground">
          {RESUME_FONT_OPTIONS.find((font) => font.value === theme.font)?.description}
          <span className="mt-1 block">{theme.font === "roboto" ? "Embeds Roboto" : `Embeds ${resumeFontAsset(theme.font).label}, a bundled alternative`} in preview and PDF.</span>
        </p>

        <label className="mb-4 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={theme.headerBackground !== false}
            onChange={(event) => update("headerBackground", event.target.checked)} className="accent-primary" />
          Header background
        </label>

        <label htmlFor="contact-separator" className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Contact separator
        </label>
        <select id="contact-separator" value={theme.contactSeparator ?? "dot"}
          onChange={(event) => update("contactSeparator", event.target.value as "dot" | "bar")}
          className="mb-4 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground">
          <option value="dot">● Filled circle</option>
          <option value="bar">| Vertical bar</option>
        </select>

        <label htmlFor="experience-bullet" className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Experience bullets
        </label>
        <select id="experience-bullet" value={theme.experienceBullet ?? "dot"}
          onChange={(event) => update("experienceBullet", event.target.value as "dot" | "dash")}
          className="mb-4 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground">
          <option value="dot">● Filled circle</option>
          <option value="dash">- Dash</option>
        </select>

        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Header alignment
        </label>
        <div className="mb-4 grid grid-cols-3 gap-1">
          {alignments.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              type="button"
              variant={theme.headerAlignment === value ? "default" : "outline"}
              size="sm"
              className="h-8 px-0"
              title={label}
              aria-label={`${label} align header`}
              onClick={() => update("headerAlignment", value)}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>

        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Section order
        </label>
        <div className="space-y-1.5">
          {orderedSections.map((section, index) => (
            <div key={section.id} className="flex items-center gap-1 rounded border bg-background px-2 py-1.5">
              <span className="min-w-0 flex-1 truncate text-[10px] font-medium">{section.title}</span>
              <button
                type="button"
                className="text-muted-foreground disabled:opacity-25"
                disabled={index === 0}
                onClick={() => moveSection(section.id, -1)}
                aria-label={`Move ${section.title} up`}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="text-muted-foreground disabled:opacity-25"
                disabled={index === orderedSections.length - 1}
                onClick={() => moveSection(section.id, 1)}
                aria-label={`Move ${section.title} down`}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

      </aside>

      <section className="min-h-0 overflow-y-auto p-4" aria-label="Resume theme preview">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Live preview
        </div>
        {pdfError ? <p role="alert" className="text-xs text-destructive">{pdfError}</p> : <PDFPreview blob={pdfBlob} />}
      </section>
    </div>
  );
}
