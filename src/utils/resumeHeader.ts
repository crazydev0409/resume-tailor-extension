const SECTION_TITLES = new Set([
  "summary",
  "professional summary",
  "profile",
  "skills",
  "technical skills",
  "core competencies",
  "experience",
  "professional experience",
  "work experience",
  "education",
  "academic",
  "certifications",
  "certificates",
  "projects",
  "achievements",
  "awards",
]);

export interface ResumeIdentity {
  name: string;
  nameLineIndex: number;
  hasNameHeading: boolean;
  contactLines: string[];
}

function cleanLine(line: string): string {
  return line
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .replace(/^__(.*?)__$/, "$1")
    .replace(/\*\*/g, "")
    .trim();
}

function isSectionTitle(line: string): boolean {
  return SECTION_TITLES.has(cleanLine(line).replace(/:$/, "").toLowerCase());
}

export function isResumeContactLine(line: string): boolean {
  const cleaned = cleanLine(line);
  return (
    /(?:mailto:|tel:|@|linkedin(?:\.com)?|github(?:\.com)?|portfolio|website|https?:\/\/|www\.)/i.test(cleaned) ||
    /(?:email|e-mail|phone|tel|address|location)\s*:/i.test(cleaned) ||
    /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(cleaned) ||
    /\b[A-Za-z][\w .'’-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(cleaned) ||
    /\b\d+\s+[\w .'’-]+\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|lane|ln\.?|drive|dr\.?|court|ct\.?|way|circle|parkway|pkwy\.?)\b/i.test(cleaned)
  );
}

function looksLikeName(line: string): boolean {
  const cleaned = cleanLine(line);
  if (!cleaned || cleaned.length > 80 || isSectionTitle(cleaned) || isResumeContactLine(cleaned)) {
    return false;
  }

  const words = cleaned.split(/\s+/);
  if (words.length < 2 || words.length > 7 || /[|:@]/.test(cleaned)) return false;

  // Allows initials, apostrophes, hyphens and common name suffix punctuation,
  // while rejecting prose that happens to appear at the top of a resume.
  return words.every((word) => /^[\p{L}][\p{L}.'’\-]*,?$/u.test(word));
}

/** Extract a candidate identity from Markdown or common plain-text resume headers. */
export function extractResumeIdentity(resume: string): ResumeIdentity {
  const lines = resume.replace(/^```(?:markdown|md)?\s*/i, "").replace(/\s*```$/, "").split(/\r?\n/);
  let nameLineIndex = -1;
  let name = "";
  let hasNameHeading = false;

  // Prefer an explicit Markdown name heading, regardless of heading level.
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    if (/^\s*#{1,3}\s+\S/.test(lines[i]) && !isSectionTitle(lines[i]) && looksLikeName(lines[i])) {
      nameLineIndex = i;
      name = cleanLine(lines[i]);
      hasNameHeading = true;
      break;
    }
  }

  // Models and pasted source resumes sometimes emit a bold or plain name.
  if (!name) {
    for (let i = 0; i < Math.min(lines.length, 12); i++) {
      const line = lines[i].trim();
      if (!line || /^[-=_]{3,}$/.test(line)) continue;
      if (isSectionTitle(line)) break;
      if (looksLikeName(line)) {
        nameLineIndex = i;
        name = cleanLine(line);
        break;
      }
    }
  }

  const contactLines: string[] = [];
  const scanEnd = lines.findIndex((line, index) => index > nameLineIndex && /^\s*#{1,6}\s+/.test(line) && isSectionTitle(line));
  const lastHeaderLine = scanEnd === -1 ? Math.min(lines.length, 15) : scanEnd;
  for (let i = Math.max(0, nameLineIndex + 1); i < lastHeaderLine; i++) {
    if (isResumeContactLine(lines[i])) contactLines.push(lines[i].trim());
  }

  return { name, nameLineIndex, hasNameHeading, contactLines };
}

/**
 * Ensures generated Markdown has a renderable identity header. The original
 * resume is the source of truth when the model drops the name/contact block.
 */
export function ensureResumeHeader(generated: string, original: string): string {
  const content = generated.trim();
  const generatedIdentity = extractResumeIdentity(content);
  const originalIdentity = extractResumeIdentity(original);
  const name = generatedIdentity.hasNameHeading
    ? generatedIdentity.name
    : originalIdentity.name || generatedIdentity.name;

  // Keep rendering resilient for legacy records whose source text is malformed.
  // Normal generated records should always resolve the real name from one source.
  const resolvedName = name || "Candidate";

  const lines = content.split(/\r?\n/);
  if (generatedIdentity.nameLineIndex >= 0) {
    lines[generatedIdentity.nameLineIndex] = `# ${resolvedName}`;
  } else {
    lines.unshift(`# ${resolvedName}`, "");
  }

  // Restore source contact details only when the generated header omitted them.
  if (generatedIdentity.contactLines.length === 0 && originalIdentity.contactLines.length > 0) {
    const nameIndex = generatedIdentity.nameLineIndex >= 0
      ? generatedIdentity.nameLineIndex
      : 0;
    lines.splice(nameIndex + 1, 0, originalIdentity.contactLines.join(" | "));
  }

  return lines.join("\n").trim();
}

export function candidateResumeFilename(tailoredResume: string, originalResume = ""): string {
  const identity = extractResumeIdentity(tailoredResume);
  const fallbackIdentity = extractResumeIdentity(originalResume);
  const candidateName = identity.hasNameHeading
    ? identity.name
    : fallbackIdentity.name || identity.name || "Candidate";
  const safeName = candidateName
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "Candidate";
  return `${safeName} Resume.pdf`;
}
