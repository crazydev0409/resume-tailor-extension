import jsPDF from "jspdf";

export type PDFColorTheme = "forestGreen" | "navy" | "brown" | "blue";
export type PDFTemplate =
  | "modern"
  | "classic"
  | "arial"
  | "timesNewRoman"
  | "calibri"
  | "georgia"

const COLOR_THEMES: Record<
  PDFColorTheme,
  {
    primary: [number, number, number];
    accent: [number, number, number];
    text: [number, number, number];
    light: [number, number, number];
    headerBg: [number, number, number];
    pillBg: [number, number, number];
  }
> = {
  forestGreen: {
    primary: [22, 101, 52],     // #166534
    accent: [21, 94, 43],
    text: [44, 62, 80],
    light: [100, 116, 139],
    headerBg: [22, 101, 52],
    pillBg: [226, 243, 232],
  },
  navy: {
    primary: [30, 58, 95],
    accent: [51, 65, 85],
    text: [30, 41, 59],
    light: [100, 116, 139],
    headerBg: [30, 58, 95],
    pillBg: [224, 231, 243],
  },
  brown: {
    primary: [139, 90, 43],
    accent: [101, 67, 33],
    text: [72, 52, 36],
    light: [140, 120, 90],
    headerBg: [139, 90, 43],
    pillBg: [243, 234, 221],
  },
  blue: {
    primary: [37, 99, 235],
    accent: [59, 130, 246],
    text: [30, 58, 95],
    light: [100, 116, 139],
    headerBg: [37, 99, 235],
    pillBg: [224, 235, 252],
  },
};

export const PDF_COLOR_OPTIONS: { value: PDFColorTheme | "random"; label: string }[] = [
  { value: "brown", label: "Dark Brown (Default)" },
  { value: "random", label: "Random" },
  { value: "forestGreen", label: "Forest Green" },
  { value: "navy", label: "Navy" },
  { value: "blue", label: "Soft Blue" },
];

export const PDF_TEMPLATE_OPTIONS: { value: PDFTemplate | "random"; label: string }[] = [
  { value: "random", label: "Random" },
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic (Serif)" },
  { value: "arial", label: "Arial" },
  { value: "timesNewRoman", label: "Times New Roman" },
  { value: "calibri", label: "Calibri" },
  { value: "georgia", label: "Georgia" },
];

const COLOR_THEME_VALUES: PDFColorTheme[] = ["forestGreen", "navy", "brown", "blue"];
const TEMPLATE_VALUES: PDFTemplate[] = [
  "modern",
  "classic",
  "arial",
  "timesNewRoman",
  "calibri",
  "georgia",
];

// jsPDF built-in fonts: helvetica, times, courier (closest matches to common fonts)
const TEMPLATE_FONT: Record<PDFTemplate, "helvetica" | "times" | "courier"> = {
  modern: "helvetica",
  classic: "times",
  arial: "helvetica",
  timesNewRoman: "times",
  calibri: "helvetica",
  georgia: "times",
};

function randomTheme(): PDFColorTheme {
  return COLOR_THEME_VALUES[Math.floor(Math.random() * COLOR_THEME_VALUES.length)];
}
function randomTemplate(): PDFTemplate {
  return TEMPLATE_VALUES[Math.floor(Math.random() * TEMPLATE_VALUES.length)];
}

export interface PDFOptions {
  content: string;
  filename: string;
  colorTheme?: PDFColorTheme | "random";
  template?: PDFTemplate | "random";
}

interface ParsedContent {
  name: string;
  contactInfo: string[];
  title: string;
  sections: Array<{
    type: "section" | "experience" | "education";
    title: string;
    content: string[];
  }>;
}

/**
 * Internal: builds a jsPDF document from resume markdown content.
 * Returns the jsPDF doc so callers can either .save() or .output("blob").
 */
function buildResumePDFDoc(
  content: string,
  resolvedColor: PDFColorTheme,
  resolvedTemplate: PDFTemplate
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const theme = COLOR_THEMES[resolvedColor];
  const primaryColor = theme.primary;
  const accentColor = theme.accent;
  const textColor = theme.text;
  const lightTextColor = theme.light;
  const headerBgColor = theme.headerBg;

  // Page settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const sectionBarWidth = 4;
  const sectionBarGap = 4;
  const isClassic = resolvedTemplate === "classic"; // classic = underline layout; others = accent bar
  const fontFamily = TEMPLATE_FONT[resolvedTemplate];
  // Helper function to check if we need a new page
  const checkNewPage = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 15) {
      // Reduced bottom padding (was margin + 10)
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper to strip markdown formatting
  const stripMarkdown = (text: string): string => {
    return text
      .replace(/\*\*/g, "") // Remove bold markers
      .replace(/\#{1,6}\s*/g, "") // Remove all heading markers (including in middle of text)
      .replace(/^[-*+]\s+/g, "") // Remove bullet markers at start
      .trim();
  };

  // Proper capitalization for name: "KEITH JOHNSON" -> "Keith Johnson"
  const toTitleCase = (text: string): string => {
    return text
      .trim()
      .split(/\s+/)
      .map((word) =>
        word.length === 0
          ? word
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");
  };

  // Helper to check if line is a skills category (e.g., "Programming & Development: Python, Java...")
  // Handles bullet prefixes and markdown bold around the category label
  const isSkillsCategory = (text: string): boolean => {
    const cleaned = text
      .replace(/^[-•*]\s+/, "")
      .replace(/\*\*/g, "")
      .trim();
    return /^[A-Za-z0-9\s&/+\-]+:\s+/.test(cleaned);
  };

  // Helper to detect if a line is actual contact information
  const isContactInfoLine = (line: string, lineNumber: number): boolean => {
    const lower = line.toLowerCase();
    const trimmed = line.trim();

    // Must contain contact-related keywords OR look like email/phone/URL/address
    const hasContactKeywords =
      lower.includes("email") ||
      lower.includes("phone") ||
      lower.includes("tel") ||
      lower.includes("linkedin") ||
      lower.includes("github") ||
      lower.includes("portfolio") ||
      lower.includes("website") ||
      lower.includes("www.") ||
      lower.includes("http") ||
      lower.includes("address") ||
      lower.includes("location") ||
      /@/.test(line) || // Email pattern
      /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(line) || // Phone pattern
      /\[\w+\]\(http/.test(line) || // Markdown links
      /^\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|circle|cir|parkway|pkwy)/i.test(trimmed) || // Address pattern
      /^[\w\s]+,\s*[A-Z]{2}\s+\d{5}/i.test(trimmed); // City, State ZIP pattern

    // Only accept as contact info if:
    // 1. It has contact keywords/patterns, AND
    // 2. It's within the first 10 lines of the document (should be near top, increased from 5)
    return hasContactKeywords && lineNumber < 10;
  };

  // Parse content into structured sections
  const parseContent = (text: string): ParsedContent => {
    const lines = text.split("\n");
    const parsed: ParsedContent = {
      name: "",
      contactInfo: [],
      title: "",
      sections: [],
    };

    let currentSection: any = null;
    let inHeader = true;
    let foundFirstSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      // Extract name (first # heading)
      if (line.startsWith("# ") && !parsed.name) {
        parsed.name = stripMarkdown(line.substring(2));
        continue;
      }

      // Contact info line - ONLY if in header AND looks like contact info
      // Collect multiple lines of contact info (email, phone, address, LinkedIn, etc.)
      if (
        inHeader &&
        !foundFirstSection &&
        parsed.name &&
        isContactInfoLine(line, i)
      ) {
        parsed.contactInfo.push(line);
        continue;
      }

      // Horizontal rule
      if (line.match(/^[-=]{3,}$/)) {
        inHeader = false;
        continue;
      }

      // Section headers (## or ###) - this marks end of header
      if (line.startsWith("## ") || line.startsWith("### ")) {
        foundFirstSection = true;
        inHeader = false;
      }

      // Job title or professional summary (after name, before sections)
      if (inHeader && line.startsWith("### ")) {
        parsed.title = stripMarkdown(line.substring(4));
        inHeader = false;
        continue;
      }

      // Section headers (### or ##) - but NOT if they contain ** (which indicates it's a job title)
      if ((line.startsWith("### ") || line.startsWith("## ")) && !inHeader) {
        const headerText = line.startsWith("### ")
          ? line.substring(4)
          : line.substring(3);

        // If header contains **, it's likely a job title, not a section header
        // Also check if it's a known section name
        const knownSections = [
          "experience",
          "professional experience",
          "work experience",
          "skills",
          "technical skills",
          "core competencies",
          "summary",
          "professional summary",
          "profile",
          "education",
          "academic",
          "certifications",
          "certificates",
          "projects",
          "achievements",
          "awards",
        ];

        const isRealSection = knownSections.some((s) =>
          stripMarkdown(headerText).toLowerCase().includes(s)
        );

        // If it's not a known section OR contains **, treat it as content
        if (!isRealSection || headerText.includes("**")) {
          if (currentSection) {
            currentSection.content.push(lines[i]);
          }
          continue;
        }

        // It's a real section header
        if (currentSection) {
          parsed.sections.push(currentSection);
        }
        currentSection = {
          type: "section",
          title: stripMarkdown(headerText),
          content: [],
        };
        continue;
      }

      // Add content to current section
      if (currentSection) {
        currentSection.content.push(lines[i]); // Keep original indentation
      } else if (!inHeader) {
        // Content before any section (like professional summary)
        if (!parsed.sections.length || parsed.sections[0].title !== "Summary") {
          parsed.sections.unshift({
            type: "section",
            title: "",
            content: [],
          });
        }
        parsed.sections[0].content.push(lines[i]);
      }
    }

    if (currentSection) {
      parsed.sections.push(currentSection);
    }

    // If no sections were found, create one section with all remaining content
    if (parsed.sections.length === 0 && lines.length > 0) {
      const remainingContent: string[] = [];
      let foundName = false;
      let foundContact = false;

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("# ") && !foundName) {
          foundName = true;
          continue;
        }

        if (foundName && !foundContact && isContactInfoLine(trimmed, idx)) {
          foundContact = true;
          continue;
        }

        if (foundName) {
          remainingContent.push(line);
        }
      }

      if (remainingContent.length > 0) {
        parsed.sections.push({
          type: "section",
          title: "",
          content: remainingContent,
        });
      }
    }

    // Reorder sections: Summary → Skills → Experience → Education
    const sectionOrder = [
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
    ];

    // Drop certifications — not shown in resume output
    parsed.sections = parsed.sections.filter(
      (s) => !/certificat/i.test(s.title)
    );

    parsed.sections.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      let aIndex = sectionOrder.findIndex(
        (s) => aTitle.includes(s) || s.includes(aTitle)
      );
      let bIndex = sectionOrder.findIndex(
        (s) => bTitle.includes(s) || s.includes(bTitle)
      );

      // If not found in order list, put at end
      if (aIndex === -1) aIndex = 999;
      if (bIndex === -1) bIndex = 999;

      return aIndex - bIndex;
    });

    return parsed;
  };

  const parsed = parseContent(content);

  // Render header with name and contact info (colored band)
  if (parsed.name) {
    const nameText = toTitleCase(parsed.name);

    // ── Parse contact parts first (needed for band height) ──
    interface ContactPart {
      text: string;
      url?: string;
      kind: "address" | "other";
    }
    const cleanedParts: ContactPart[] = [];

    const isAddressText = (text: string): boolean => {
      const t = text.trim();
      if (/\d+\s+[\w.\s]+(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|lane|ln\.?|drive|dr\.?|court|ct\.?|way|circle|cir\.?|parkway|pkwy\.?)\b/i.test(t)) {
        return true;
      }
      // City, ST 12345  OR  City, State 12345
      if (/^[A-Za-z][\w\s.'-]+,\s*(?:[A-Z]{2}|[A-Za-z]+)\s+\d{5}(?:-\d{4})?$/.test(t)) {
        return true;
      }
      return false;
    };

    if (parsed.contactInfo.length > 0) {
      let contactLine = parsed.contactInfo.join(" ");

      // Pull full street addresses out before comma-splitting destroys them
      const fullAddressRe =
        /\d+\s+[\w.\s]+?(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?|Court|Ct\.?|Way|Circle|Cir\.?|Parkway|Pkwy\.?)\s*,\s*[A-Za-z][\w\s.'-]+,\s*(?:[A-Z]{2}|[A-Za-z]+)\s+\d{5}(?:-\d{4})?/gi;
      const extractedAddresses: string[] = [];
      contactLine = contactLine.replace(fullAddressRe, (match) => {
        extractedAddresses.push(match.trim());
        return " | ";
      });

      const contactParts = contactLine
        .split(/\s*\|\s*|\s*[•·⋅]\s*/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const seenEmails = new Set<string>();
      const seenPhones = new Set<string>();
      const seenAddresses = new Set<string>();
      const seenLinkedIn = new Set<string>();

      for (const addr of extractedAddresses) {
        if (!seenAddresses.has(addr.toLowerCase())) {
          cleanedParts.push({ text: addr, kind: "address" });
          seenAddresses.add(addr.toLowerCase());
        }
      }

      for (const part of contactParts) {
        let cleaned = part
          .replace(/\*\*/g, "")
          .replace(
            /^(Georgia Location|Location|Phone|Tel|Email|E-mail|LinkedIn|GitHub|Portfolio|Website|Address):\s*/i,
            ""
          )
          .trim();

        if (!cleaned) continue;

        const emailMatch = cleaned.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (emailMatch) {
          const email = emailMatch[1];
          if (!seenEmails.has(email.toLowerCase())) {
            cleanedParts.push({ text: email, kind: "other" });
            seenEmails.add(email.toLowerCase());
          }
          continue;
        }

        const phoneMatch = cleaned.match(/(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
        if (phoneMatch) {
          const phone = phoneMatch[1];
          if (!seenPhones.has(phone.replace(/[-.\s()]/g, ""))) {
            cleanedParts.push({ text: phone, kind: "other" });
            seenPhones.add(phone.replace(/[-.\s()]/g, ""));
          }
          continue;
        }

        if (isAddressText(cleaned)) {
          if (!seenAddresses.has(cleaned.toLowerCase())) {
            cleanedParts.push({ text: cleaned, kind: "address" });
            seenAddresses.add(cleaned.toLowerCase());
          }
          continue;
        }

        const linkMatch = cleaned.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const url = linkMatch[2];
          const linkText = linkMatch[1];
          if (url.includes("linkedin.com")) {
            const linkedinUrl = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
            if (!seenLinkedIn.has(linkedinUrl.toLowerCase())) {
              cleanedParts.push({ text: linkedinUrl, url: url, kind: "other" });
              seenLinkedIn.add(linkedinUrl.toLowerCase());
            }
          } else {
            cleanedParts.push({ text: linkText, url: url, kind: "other" });
          }
          continue;
        }

        if (cleaned.match(/^https?:\/\//)) {
          const urlMatch = cleaned.match(/https?:\/\/(?:www\.)?([^\s]+)/);
          if (urlMatch) {
            const domain = urlMatch[1].replace(/\/$/, "");
            if (domain.includes("linkedin.com")) {
              if (!seenLinkedIn.has(domain.toLowerCase())) {
                cleanedParts.push({ text: domain, url: cleaned, kind: "other" });
                seenLinkedIn.add(domain.toLowerCase());
              }
            } else {
              cleanedParts.push({ text: domain, url: cleaned, kind: "other" });
            }
          }
          continue;
        }

        if (!cleaned.match(/^(email|phone|tel|linkedin|github|portfolio|website|address|location):$/i)) {
          cleanedParts.push({
            text: cleaned,
            kind: isAddressText(cleaned) ? "address" : "other",
          });
        }
      }
    }

    const separator = " \u2022 ";
    const contactFontSize = 10;
    const contactMaxWidth = pageWidth - 2 * margin;
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(contactFontSize);

    // Line(s): email / phone / links (wrap if needed); address always on its own line below
    const otherParts = cleanedParts.filter((p) => p.kind === "other");
    const addressParts = cleanedParts.filter((p) => p.kind === "address");
    type ContactLine = ContactPart[];
    const contactLines: ContactLine[] = [];

    if (otherParts.length > 0) {
      let currentLine: ContactPart[] = [];
      let currentWidth = 0;
      for (const part of otherParts) {
        const sepW = currentLine.length > 0 ? doc.getTextWidth(separator) : 0;
        const partW = doc.getTextWidth(part.text);
        if (currentLine.length > 0 && currentWidth + sepW + partW > contactMaxWidth) {
          contactLines.push(currentLine);
          currentLine = [part];
          currentWidth = partW;
        } else {
          currentLine.push(part);
          currentWidth += sepW + partW;
        }
      }
      if (currentLine.length > 0) contactLines.push(currentLine);
    }
    for (const addr of addressParts) {
      contactLines.push([addr]);
    }

    // Pre-calculate header band height with room for all contact lines
    const nameLineHeight = 13;
    const contactLineGap = 4.5;
    const contactBlockHeight =
      contactLines.length > 0 ? contactLines.length * contactLineGap + 2 : 0;
    const bandTopPad = 10;
    const bandBottomPad = 8;
    const headerBandHeight =
      bandTopPad + nameLineHeight + contactBlockHeight + bandBottomPad;

    // Draw full-width colored header band (edge to edge)
    doc.setFillColor(...headerBgColor);
    doc.rect(0, 0, pageWidth, headerBandHeight, "F");

    // Name - white text on colored band
    yPosition = bandTopPad + nameLineHeight - 2;
    doc.setFontSize(33);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(255, 255, 255);
    const nameWidth = doc.getTextWidth(nameText);
    const nameX = isClassic
      ? Math.max(margin, pageWidth - margin - nameWidth)
      : (pageWidth - nameWidth) / 2;
    doc.text(nameText, nameX, yPosition);
    yPosition += 7;

    // Contact info — fixed size, right-aligned lines (classic) / centered (modern)
    if (contactLines.length > 0) {
      doc.setFontSize(contactFontSize);
      doc.setFont(fontFamily, "normal");
      doc.setTextColor(230, 237, 243);

      const links: Array<{
        text: string;
        url: string;
        x: number;
        y: number;
        width: number;
      }> = [];

      for (const lineParts of contactLines) {
        let lineText = "";
        for (let i = 0; i < lineParts.length; i++) {
          if (i > 0) lineText += separator;
          lineText += lineParts[i].text;
        }
        const lineWidth = doc.getTextWidth(lineText);
        // Both contact lines right-aligned for classic; centered for modern
        let startX = isClassic
          ? pageWidth - margin - lineWidth
          : (pageWidth - lineWidth) / 2;
        startX = Math.max(margin, startX);

        let currentX = startX;
        for (let i = 0; i < lineParts.length; i++) {
          if (i > 0) {
            doc.text(separator, currentX, yPosition);
            currentX += doc.getTextWidth(separator);
          }
          const partWidth = doc.getTextWidth(lineParts[i].text);
          if (lineParts[i].url) {
            links.push({
              text: lineParts[i].text,
              url: lineParts[i].url!,
              x: currentX,
              y: yPosition,
              width: partWidth,
            });
          }
          doc.text(lineParts[i].text, currentX, yPosition);
          currentX += partWidth;
        }
        yPosition += contactLineGap;
      }

      for (const link of links) {
        doc.link(link.x, link.y - 3, link.width, 4, { url: link.url });
      }
    }

    // Position after the header band with breathing room
    yPosition = headerBandHeight + 6;
  }

  // Professional title
  if (parsed.title) {
    doc.setFontSize(14);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(...accentColor);
    doc.text(parsed.title, margin, yPosition);
    yPosition += 10;
  }

  // Render sections
  for (const section of parsed.sections) {
    // Skip empty sections and sections with only placeholder/note text
    const meaningfulContent =
      section.content &&
      section.content.filter((line: string) => {
        // Strip bullet markers and whitespace, then lowercase
        const stripped = line.trim()
          .replace(/^[-•*]\s+/, "")
          .toLowerCase();
        if (!stripped) return false;
        // Filter out AI-generated placeholder notes
        if (/^(no\s+|none|n\/a|not applicable)/.test(stripped)) return false;
        if (/not (listed|provided|available|included|specified|mentioned)/.test(stripped)) return false;
        if (/from (the )?original resume/.test(stripped)) return false;
        return true;
      });
    if (!meaningfulContent || meaningfulContent.length === 0) {
      continue;
    }

    checkNewPage(15);

    // Section title: modern = left accent bar, classic = underline only
    if (section.title) {
      const cleanTitle = stripMarkdown(section.title);
      const titleText = cleanTitle.toUpperCase();
      const titleY = yPosition + 4;

      if (isClassic) {
        // Classic: section title + primary-color full-width rule
        doc.setFontSize(14);
        doc.setFont(fontFamily, "bold");
        doc.setTextColor(...primaryColor);
        doc.text(titleText, margin, titleY);
        yPosition += 7.5;
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 7;
      } else {
        // Modern: left accent bar + title
        doc.setFillColor(...primaryColor);
        doc.rect(margin, yPosition, sectionBarWidth, 8, "F");
        doc.setFontSize(14);
        doc.setFont(fontFamily, "bold");
        doc.setTextColor(...primaryColor);
        doc.text(titleText, margin + sectionBarWidth + sectionBarGap, titleY);
        yPosition += 12;
      }
    }

    // Check if this is a skills section or summary section
    const isSkillsSection = section.title.toLowerCase().includes("skill");
    const isSummarySection =
      section.title.toLowerCase().includes("summary") ||
      section.title.toLowerCase().includes("profile");

    // Section content
    for (let i = 0; i < section.content.length; i++) {
      const line = section.content[i];
      let trimmed = line.trim();

      // Skip lines that are just section headers (shouldn't be here but just in case)
      if (trimmed.match(/^#{2,6}\s+/)) {
        continue;
      }

      if (!trimmed) {
        yPosition += 2;
        continue;
      }

      checkNewPage(10);

      // PRIORITY #1: Summary/Profile section paragraphs (process FIRST to avoid wrong matching)
      if (
        isSummarySection &&
        !trimmed.startsWith("**") &&
        !trimmed.startsWith("- ") &&
        !trimmed.startsWith("• ") &&
        !trimmed.startsWith("*   ") &&
        !isSkillsCategory(trimmed)
      ) {
        // Reset font completely
        doc.setFont(fontFamily, "normal");
        doc.setFontSize(11);
        doc.setTextColor(...textColor);

        // Keep bold markers for rendering
        let cleanedText = trimmed.replace(/^#{1,6}\s*/g, "");

        // Wrap text WITHOUT bold markers for accurate width calculation
        const textWithoutBold = cleanedText.replace(/\*\*/g, "");
        const wrappedLines = doc.splitTextToSize(
          textWithoutBold,
          contentWidth - 5
        );

        // Now render each line, preserving bold from original text
        let charPosition = 0; // Track position in text WITHOUT markers

        for (const wrappedLine of wrappedLines) {
          checkNewPage(5);

          // Find where this line starts and ends in the original text (with markers)
          let sourceText = "";
          let charsCollected = 0;
          let sourceIdx = 0;
          let sourceCharCount = 0;

          // Navigate to our current position in the marked-up text
          while (
            sourceCharCount < charPosition &&
            sourceIdx < cleanedText.length
          ) {
            if (cleanedText.substring(sourceIdx, sourceIdx + 2) === "**") {
              sourceIdx += 2;
            } else {
              sourceCharCount++;
              sourceIdx++;
            }
          }

          // Collect characters for this line (including bold markers)
          while (
            charsCollected < wrappedLine.length &&
            sourceIdx < cleanedText.length
          ) {
            if (cleanedText.substring(sourceIdx, sourceIdx + 2) === "**") {
              sourceText += "**";
              sourceIdx += 2;
            } else {
              sourceText += cleanedText[sourceIdx];
              charsCollected++;
              sourceIdx++;
            }
          }

          charPosition += wrappedLine.length;

          // Skip one space between lines (jsPDF adds spaces when wrapping)
          if (
            charPosition < textWithoutBold.length &&
            textWithoutBold[charPosition] === " "
          ) {
            charPosition++;
          }

          // Render this line with bold support
          if (sourceText.includes("**")) {
            let xPos = margin;
            const parts = sourceText.split("**");

            for (let k = 0; k < parts.length; k++) {
              if (parts[k]) {
                doc.setFont(fontFamily, k % 2 === 1 ? "bold" : "normal");
                const partWidth = doc.getTextWidth(parts[k]);

                // Safety: only render if within bounds
                if (xPos + partWidth <= pageWidth - margin) {
                  doc.text(parts[k], xPos, yPosition);
                  xPos += partWidth;
                }
              }
            }
          } else {
            doc.setFont(fontFamily, "normal");
            doc.text(wrappedLine, margin, yPosition);
          }

          yPosition += 6;
        }

        yPosition += 3;
        continue;
      }

      // Skills category line — bold category label, plain skills, no pill backgrounds
      if (isSkillsSection && isSkillsCategory(trimmed)) {
        const categoryLine = stripMarkdown(trimmed);
        const match = categoryLine.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const [, category, skills] = match;
          const cleanCategory = category.trim() + ": ";
          const skillsText = skills.trim();

          doc.setFontSize(11);
          doc.setTextColor(...textColor);

          doc.setFont(fontFamily, "bold");
          const categoryWidth = doc.getTextWidth(cleanCategory);

          checkNewPage(6);
          doc.text(cleanCategory, margin, yPosition);

          doc.setFont(fontFamily, "normal");
          const firstLineWidth = Math.max(contentWidth - categoryWidth, 20);
          const firstPass = doc.splitTextToSize(skillsText, firstLineWidth);
          if (firstPass[0]) {
            doc.text(firstPass[0], margin + categoryWidth, yPosition);
          }
          yPosition += 5.5;

          if (firstPass.length > 1) {
            const rest = firstPass.slice(1).join(" ");
            const restLines = doc.splitTextToSize(rest, contentWidth);
            for (const line of restLines) {
              checkNewPage(6);
              doc.text(line, margin, yPosition);
              yPosition += 5.5;
            }
          }
          yPosition += 1.5;
        }
        continue;
      }

      // Job title or degree/role (bold lines that aren't bullets)
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        const text = stripMarkdown(trimmed);

        // Check if next line has company/institution | date format
        let isJobTitle = false;
        if (i + 1 < section.content.length) {
          const nextLine = section.content[i + 1].trim();
          if (nextLine.match(/^[^-•*].+\|\s*.+$/) || nextLine.match(/^\w+/)) {
            isJobTitle = true;
          }
        }

        if (isJobTitle) {
          yPosition += 3;
          doc.setFontSize(11.5);
          doc.setFont(fontFamily, "bold");
          doc.setTextColor(...accentColor);
          doc.text(text, margin, yPosition);
          yPosition += 6;
        } else {
          doc.setFontSize(10.5);
          doc.setFont(fontFamily, "bold");
          doc.setTextColor(...textColor);
          doc.text(text, margin, yPosition);
          yPosition += 6;
        }
        continue;
      }

      // Company | Date or University Name or plain date line
      if (trimmed.match(/^[^-•*].+\|\s*.+$/)) {
        const parts = trimmed.split("|").map((p) => stripMarkdown(p));
        doc.setFontSize(10);
        doc.setTextColor(...lightTextColor);
        doc.setFont(fontFamily, "italic");

        doc.text(parts[0], margin, yPosition);

        // Always show the last part (duration/date) on the right, skipping location/type
        const durationPart = parts[parts.length - 1];
        if (durationPart && parts.length > 1) {
          const dateWidth = doc.getTextWidth(durationPart);
          doc.text(durationPart, pageWidth - margin - dateWidth, yPosition);
        }
        yPosition += 5;

        // Accent dash under job entry
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, margin + 25, yPosition);
        yPosition += 5;
        continue;
      }

      // Certification line (e.g., "AWS Solutions Architect – 07/2022")
      if (
        !trimmed.startsWith("**") &&
        !trimmed.startsWith("#") &&
        trimmed.match(/^[\w\s\(\)]+\s*[–-]\s*\d{2}\/\d{4}$/)
      ) {
        doc.setFontSize(10);
        doc.setTextColor(...textColor);

        const parts = trimmed.split(/\s*[–-]\s*(?=\d{2}\/\d{4}$)/);
        if (parts.length === 2) {
          doc.setFont(fontFamily, "bold");
          doc.text(stripMarkdown(parts[0]), margin, yPosition);

          doc.setFont(fontFamily, "normal");
          doc.setTextColor(...lightTextColor);
          const dateWidth = doc.getTextWidth(parts[1]);
          doc.text(parts[1], pageWidth - margin - dateWidth, yPosition);
        } else {
          doc.setFont(fontFamily, "normal");
          doc.text(stripMarkdown(trimmed), margin, yPosition);
        }

        yPosition += 6;
        continue;
      }

      // Institution/Company name or date without pipe (italic gray text)
      if (
        !trimmed.startsWith("**") &&
        !trimmed.startsWith("#") &&
        (trimmed.match(
          /^\w+[\w\s]+(?:University|College|Institute|Ltd|Inc|Corp|Technologies|Systems)/i
        ) ||
          trimmed.match(/^\d{4}\s*[-–]\s*\d{4}$/) ||
          trimmed.match(/^\d{2}\/\d{4}\s*[-–]\s*\d{2}\/\d{4}$/))
      ) {
        doc.setFontSize(10);
        doc.setTextColor(...lightTextColor);
        doc.setFont(fontFamily, "italic");

        const cleanText = stripMarkdown(trimmed);

        // Check if it's a date range
        if (
          trimmed.match(/^\d{4}\s*[-–]\s*\d{4}$/) ||
          trimmed.match(/^\d{2}\/\d{4}/)
        ) {
          const dateWidth = doc.getTextWidth(cleanText);
          doc.text(cleanText, pageWidth - margin - dateWidth, yPosition);
        } else {
          doc.text(cleanText, margin, yPosition);
        }

        yPosition += 7;
        continue;
      }

      // Bullet points
      if (
        trimmed.startsWith("*   ") ||
        trimmed.startsWith("- ") ||
        trimmed.startsWith("• ")
      ) {
        let bulletText = trimmed
          .replace(/^\*\s+/, "")
          .replace(/^-\s+/, "")
          .replace(/^•\s+/, "")
          .replace(/^#{1,6}\s*/g, ""); // Remove any stray # symbols

        doc.setFontSize(11);
        doc.setFont(fontFamily, "normal");
        doc.setTextColor(...textColor);

        // Bullet shape: square for classic, larger circle for modern
        doc.setFillColor(...primaryColor);
        if (isClassic) {
          doc.rect(margin + 1.6, yPosition - 2.1, 1.8, 1.8, "F");
        } else {
          doc.circle(margin + 2.5, yPosition - 1.2, 0.9, "F");
        }

        // Parse and render text with accurate mixed bold/normal width wrapping
        // Tokenize into words/spaces with bold tracking
        const bulletSegments = bulletText.split("**");
        const bulletTokens: { text: string; bold: boolean }[] = [];
        for (let si = 0; si < bulletSegments.length; si++) {
          if (!bulletSegments[si]) continue;
          const bold = si % 2 === 1;
          const words = bulletSegments[si].split(/(\s+)/);
          for (const w of words) {
            if (w) bulletTokens.push({ text: w, bold });
          }
        }

        // Build lines measuring each token in its actual font weight
        const availWidth = contentWidth - 8;
        const renderLines: { text: string; bold: boolean }[][] = [];
        let curLine: { text: string; bold: boolean }[] = [];
        let curWidth = 0;

        for (const token of bulletTokens) {
          doc.setFont(fontFamily, token.bold ? "bold" : "normal");
          const tw = doc.getTextWidth(token.text);
          const isSpace = /^\s+$/.test(token.text);

          if (!isSpace && curWidth + tw > availWidth && curLine.length > 0) {
            // Strip trailing whitespace tokens before pushing the line
            while (curLine.length > 0 && /^\s+$/.test(curLine[curLine.length - 1].text)) {
              curLine.pop();
            }
            renderLines.push(curLine);
            curLine = [token];
            curWidth = tw;
          } else {
            curLine.push(token);
            curWidth += tw;
          }
        }

        if (curLine.length > 0) {
          while (curLine.length > 0 && /^\s+$/.test(curLine[curLine.length - 1].text)) {
            curLine.pop();
          }
          if (curLine.length > 0) renderLines.push(curLine);
        }

        // Render lines
        for (const rLine of renderLines) {
          checkNewPage(5);
          let xPos = margin + 8;
          for (const seg of rLine) {
            doc.setFont(fontFamily, seg.bold ? "bold" : "normal");
            doc.setTextColor(...textColor);
            doc.text(seg.text, xPos, yPosition);
            xPos += doc.getTextWidth(seg.text);
          }
          yPosition += 5.5;
        }
        yPosition += 1.5;
        continue;
      }

      // Regular paragraph text (for other sections like Education description, etc.)
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(11);
      doc.setTextColor(...textColor);

      // Remove any stray markdown symbols - strip bold markers for reliability
      const cleanedText = trimmed
        .replace(/^#{1,6}\s*/g, "")
        .replace(/\*\*/g, "");

      // Use jsPDF's reliable text wrapping
      const wrappedText = doc.splitTextToSize(cleanedText, contentWidth - 5);

      for (const line of wrappedText) {
        checkNewPage(5);
        doc.setFont(fontFamily, "normal");
        doc.text(line, margin, yPosition);
        yPosition += 5.5;
      }

      yPosition += 2;
    }

    yPosition += 7;
  }

  // Footer: page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...lightTextColor);
    doc.setFont(fontFamily, "normal");
    doc.text(
      `${i} / ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc;
}

/**
 * Generate a resume PDF and trigger a browser download.
 */
export function generateResumePDF({
  content,
  filename,
  colorTheme = "brown",
  template = "classic",
}: PDFOptions) {
  const resolvedColor: PDFColorTheme = colorTheme === "random" ? randomTheme() : colorTheme;
  const resolvedTemplate: PDFTemplate = template === "random" ? randomTemplate() : template;
  const doc = buildResumePDFDoc(content, resolvedColor, resolvedTemplate);
  doc.save(filename);
}

/**
 * Generate a resume PDF and return it as a Blob (for bulk downloads).
 */
export function generateResumePDFBlob({
  content,
  filename,
  colorTheme = "brown",
  template = "classic",
}: PDFOptions): Blob {
  const resolvedColor: PDFColorTheme = colorTheme === "random" ? randomTheme() : colorTheme;
  const resolvedTemplate: PDFTemplate = template === "random" ? randomTemplate() : template;
  const doc = buildResumePDFDoc(content, resolvedColor, resolvedTemplate);
  return doc.output("blob") as unknown as Blob;
}

// Initialize PDF download listener (optional: event.detail can include colorTheme, template)
if (typeof window !== "undefined") {
  window.addEventListener("download-pdf", ((event: CustomEvent) => {
    const { content, filename, colorTheme, template } = event.detail ?? {};
    generateResumePDF({ content, filename, colorTheme, template });
  }) as EventListener);
}
