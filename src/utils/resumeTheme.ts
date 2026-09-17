import type { ResumeTheme } from "@/types/extension";
import { RESUME_FONT_OPTIONS } from "@/utils/resumeFontCatalog";

export interface ResumeSection {
  id: string;
  title: string;
  markdown: string;
}

export interface ResumeDocument {
  headerMarkdown: string;
  sections: ResumeSection[];
}

const SECTION_NAMES = /summary|profile|skill|experience|employment|education|project|award|achievement|certificat|publication|volunteer|language|interest/i;

export const DEFAULT_RESUME_THEME: ResumeTheme = {
  name: "Classic",
  template: "classic",
  accentColor: "#8b5a2b",
  font: "timesNewRoman",
  headerAlignment: "right",
  headerBackground: true,
  contactSeparator: "dot",
  experienceBullet: "dot",
  sectionOrder: [],
};

// Models use different labels for the same section across tailored resumes.
export function sectionKey(title: string): string {
  const normalized = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (/^(professional-|career-)?(summary|profile)$/.test(normalized)) return "summary";
  if (/^(technical-|professional-|core-)?skills$|^core-competencies$/.test(normalized)) return "skills";
  if (/^(professional-|work-|relevant-)?experience$|^employment(-history)?$/.test(normalized)) return "experience";
  if (/^(academic-)?education$|^academic(-background)?$/.test(normalized)) return "education";
  return normalized || "section";
}

export const sectionId = (title: string, occurrence: number) => `${sectionKey(title)}-${occurrence}`;

/** Split resume markdown without changing any of its content. */
export function parseResumeDocument(markdown: string): ResumeDocument {
  const lines = markdown.split("\n");
  const headings: Array<{ index: number; title: string }> = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!match) return;
    const title = match[2].replace(/\*\*/g, "").trim();
    // Level-two headings are resume sections by convention. Level-three
    // headings are accepted only for familiar section names so job titles stay put.
    if (match[1] === "##" || SECTION_NAMES.test(title)) headings.push({ index, title });
  });

  if (!headings.length) {
    return { headerMarkdown: markdown, sections: [] };
  }

  const counts = new Map<string, number>();
  const sections = headings.map((heading, index) => {
    const normalized = sectionKey(heading.title);
    const occurrence = (counts.get(normalized) ?? 0) + 1;
    counts.set(normalized, occurrence);
    const end = headings[index + 1]?.index ?? lines.length;
    return {
      id: sectionId(heading.title, occurrence),
      title: heading.title,
      markdown: lines.slice(heading.index, end).join("\n").trim(),
    };
  });

  return {
    headerMarkdown: lines.slice(0, headings[0].index).join("\n").trim(),
    sections,
  };
}

export function orderResumeSections(sections: ResumeSection[], order: string[]): ResumeSection[] {
  if (!order.length) {
    const priority = (title: string) => {
      if (/summary|profile/i.test(title)) return 0;
      if (/skill|core competencies/i.test(title)) return 1;
      if (/experience/i.test(title)) return 2;
      if (/education|academic/i.test(title)) return 3;
      return 4;
    };
    return [...sections].sort((a, b) => priority(a.title) - priority(b.title));
  }
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...sections].sort((a, b) => {
    const aPosition = positions.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bPosition = positions.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aPosition - bPosition;
  });
}

export function mergeResumeTheme(theme?: Partial<ResumeTheme>): ResumeTheme {
  return {
    ...DEFAULT_RESUME_THEME,
    ...theme,
    name: theme?.name?.trim() || (theme ? "My theme" : DEFAULT_RESUME_THEME.name),
    font: RESUME_FONT_OPTIONS.some((option) => option.value === theme?.font) ? theme!.font! : DEFAULT_RESUME_THEME.font,
    sectionOrder: theme?.sectionOrder ?? [],
  };
}
