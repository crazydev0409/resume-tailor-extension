import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Remove Certifications / Certificates section from resume markdown. */
export function stripCertificationsSection(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const result: string[] = [];
  let skipping = false;

  for (const line of lines) {
    if (/^#{1,3}\s*certificat(?:ion|e)s?\s*$/i.test(line.trim())) {
      skipping = true;
      continue;
    }
    if (skipping && /^#{1,3}\s/.test(line)) {
      skipping = false;
    }
    if (!skipping) result.push(line);
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
