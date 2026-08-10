export interface ResumeTab {
  id: string;
  title: string;
  resume: string;
  jobDescription: string;
  result: string;
  extractedCompany: string;
  isLoading: boolean;
  aiKeywords: {
    hardSkillsOnResume: string[];
    hardSkillsOnJD: string[];
    toolsAndTechnologiesOnResume: string[];
    toolsAndTechnologiesOnJD: string[];
  } | null;
}
