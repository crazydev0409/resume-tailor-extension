import { useEffect, useMemo, useState } from "react";
import type { ResumeTheme } from "@/types/extension";
import { generateResumePDFBlob } from "@/services/pdfGenerator";
import { loadResumeFonts } from "@/services/resumeFonts";

export function useResumePDF(content: string, savedTheme: ResumeTheme) {
  // A name change should not rebuild the PDF on every keystroke.
  const theme = useMemo<ResumeTheme>(() => ({
    font: savedTheme.font,
    template: savedTheme.template,
    accentColor: savedTheme.accentColor,
    headerAlignment: savedTheme.headerAlignment,
    headerBackground: savedTheme.headerBackground,
    contactSeparator: savedTheme.contactSeparator,
    experienceBullet: savedTheme.experienceBullet,
    sectionOrder: savedTheme.sectionOrder,
  }), [savedTheme.font, savedTheme.template, savedTheme.accentColor, savedTheme.headerAlignment,
    savedTheme.headerBackground, savedTheme.contactSeparator, savedTheme.experienceBullet, savedTheme.sectionOrder]);
  const [pdf, setPdf] = useState<{ blob: Blob; theme: ResumeTheme; content: string } | null>(null);
  const [pdfError, setPdfError] = useState("");
  const pdfBlob = pdf?.theme === theme && pdf.content === content ? pdf.blob : null;
  useEffect(() => {
    let cancelled = false;
    setPdfError("");
    const prepare = async () => {
      await loadResumeFonts(theme.font);
      if (cancelled) return;
      const blob = generateResumePDFBlob({ content, filename: "resume.pdf", template: theme.template ?? "classic", theme });
      setPdf({ blob, theme, content });
    };
    void prepare().catch(() => {
      if (!cancelled) setPdfError("Could not prepare the PDF. Reopen this page to retry.");
    });
    return () => { cancelled = true; };
  }, [content, theme]);
  return { pdfBlob, pdfError };
}
