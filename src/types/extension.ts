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
  keywords?: {
    hardSkillsOnResume: string[];
    hardSkillsOnJD: string[];
    toolsAndTechnologiesOnResume: string[];
    toolsAndTechnologiesOnJD: string[];
  };
}

/** Shape of chrome.storage keys used by the extension */
export interface StorageSchema {
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
