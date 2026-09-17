import type { ResumeFont } from "@/types/extension";

export interface ResumeFontOption {
  value: ResumeFont;
  label: string;
  description: string;
}

export const RESUME_FONT_OPTIONS: ResumeFontOption[] = [
  { value: "arial", label: "Arial", description: "Versatile and familiar across industries." },
  { value: "calibri", label: "Calibri", description: "Compact, contemporary business style." },
  { value: "aptos", label: "Aptos", description: "Open shapes with a modern Office feel." },
  { value: "helvetica", label: "Helvetica", description: "Minimal and neutral for a clean presentation." },
  { value: "roboto", label: "Roboto", description: "A clear choice for digital and technical roles." },
  { value: "georgia", label: "Georgia", description: "A warm, readable serif; wider letters may add lines." },
  { value: "garamond", label: "Garamond", description: "A classic, space-efficient serif." },
  { value: "cambria", label: "Cambria", description: "A sturdy serif for formal business documents." },
  { value: "timesNewRoman", label: "Times New Roman", description: "Compact and traditional for conservative fields." },
  { value: "verdana", label: "Verdana", description: "Wide, open letters for concise, readable resumes." },
];

const BUNDLED_FONTS: Record<ResumeFont, { family: string; label: string }> = {
  arial: { family: "Arimo", label: "Arimo" },
  calibri: { family: "Carlito", label: "Carlito" },
  aptos: { family: "Lato", label: "Lato" },
  helvetica: { family: "Arimo", label: "Arimo" },
  roboto: { family: "Roboto", label: "Roboto" },
  georgia: { family: "Gelasio", label: "Gelasio" },
  garamond: { family: "EBGaramond", label: "EB Garamond" },
  cambria: { family: "Caladea", label: "Caladea" },
  timesNewRoman: { family: "Tinos", label: "Tinos" },
  verdana: { family: "OpenSans", label: "Open Sans" },
};

export function resumeFontAsset(font: ResumeFont) {
  const asset = BUNDLED_FONTS[font];
  if (!asset) throw new Error(`Unsupported resume font: ${font}`);
  return asset;
}
