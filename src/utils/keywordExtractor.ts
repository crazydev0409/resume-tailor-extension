export interface ExtractedKeywords {
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  certifications: string[];
  technologies: string[];
  industries: string[];
}

export function extractKeywordsFromJobDescription(
  jobDescription: string
): ExtractedKeywords {
  // This function is now deprecated - keywords should be extracted by AI
  // Return empty structure for backward compatibility
  return {
    hardSkills: [],
    softSkills: [],
    tools: [],
    certifications: [],
    technologies: [],
    industries: [],
  };
}

export function getKeywordMatchScore(
  resume: string,
  jobDescription: string,
  aiKeywords?: {
    hardSkillsOnResume: string[];
    hardSkillsOnJD: string[];
    toolsAndTechnologiesOnResume: string[];
    toolsAndTechnologiesOnJD: string[];
  }
): number {
  if (!aiKeywords) {
    return 0;
  }

  const resumeText = resume.toLowerCase();
  let totalKeywords = 0;
  let matchedKeywords = 0;

  // Count matches for hard skills from JD
  aiKeywords.hardSkillsOnJD.forEach((keyword) => {
    totalKeywords++;
    const keywordLower = keyword.toLowerCase();
    if (resumeText.includes(keywordLower)) {
      matchedKeywords++;
    }
  });

  // Count matches for tools and technologies from JD
  aiKeywords.toolsAndTechnologiesOnJD.forEach((keyword) => {
    totalKeywords++;
    const keywordLower = keyword.toLowerCase();
    if (resumeText.includes(keywordLower)) {
      matchedKeywords++;
    }
  });

  return totalKeywords > 0
    ? Math.round((matchedKeywords / totalKeywords) * 100)
    : 0;
}
