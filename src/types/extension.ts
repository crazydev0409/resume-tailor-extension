/** An item currently being tailored (in-flight) */
export interface WorkingItem {
  id: string;
  timestamp: number;
  jobDescription: string;
  sourceUrl: string;
  sourceTitle: string;
  status: "tailoring" | "failed";
  error?: string;
}

/** A completed tailored resume */
export interface DoneItem {
  id: string;
  timestamp: number;
  companyName: string;
  role: string;
  jobDescription: string;
  originalResume: string;
  tailoredResume: string;
  model: string;
  apiUrl: string;
  sourceUrl: string;
  note?: string;
  link?: string;
  pinned: boolean;
  theme?: ResumeTheme;
  keywords?: {
    hardSkillsOnResume: string[];
    hardSkillsOnJD: string[];
    toolsAndTechnologiesOnResume: string[];
    toolsAndTechnologiesOnJD: string[];
  };
}

export type ResumeFont = "arial" | "calibri" | "aptos" | "helvetica" | "roboto" | "georgia" | "garamond" | "cambria" | "timesNewRoman" | "verdana";
export type HeaderAlignment = "left" | "center" | "right";

/** One saved appearance shared by all resume previews and downloads. */
export interface ResumeTheme {
  name?: string;
  template?: "classic" | "modern";
  accentColor: string;
  font: ResumeFont;
  headerAlignment: HeaderAlignment;
  headerBackground?: boolean;
  contactSeparator?: "dot" | "bar";
  experienceBullet?: "dot" | "dash";
  sectionOrder: string[];
}

export interface SavedResumeTheme {
  id: string;
  theme: ResumeTheme;
}

export interface ResumeThemeLibrary {
  activeId: string;
  themes: SavedResumeTheme[];
}

/** Shape of chrome.storage keys used by the extension */
export interface StorageSchema {
  resumeThemeLibrary: ResumeThemeLibrary;
  resumeTheme: ResumeTheme;
  openaiApiKey: string;
  openaiApiUrl: string;
  openaiModel: string;
  baseResume: string;
  isDarkMode: boolean;
  workingItems: WorkingItem[];
  doneItems: DoneItem[];
  supabaseUrl: string;
  supabaseAnonKey: string;
}
