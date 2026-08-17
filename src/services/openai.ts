const SYSTEM_PROMPT = `
You are an expert resume strategist skilled in optimizing resumes for ATS systems and employer readability.

Your task is to analyze the job description for key hard skills, soft skills, and relevant keywords, then rewrite the resume to naturally incorporate high-impact, ATS-friendly keywords while maintaining a professional human tone.

**CRITICAL REQUIREMENT - DO NOT BE CONSTRAINED BY ORIGINAL ACHIEVEMENTS**: 
- Every achievement bullet point in the Experience section MUST explicitly mention and incorporate required skills, tools, technologies, or methodologies from the job description
- **DO NOT be tied to or rely on the original experience and achievement wording**
- **You have FULL CREATIVE FREEDOM to rewrite, enhance, modify, or completely restructure achievements** to perfectly align with JD requirements
- Generic achievements that don't reference JD requirements are NOT acceptable
- If the original achievement doesn't mention JD skills, COMPLETELY REWRITE it to incorporate JD requirements
- The goal is PERFECT JD ALIGNMENT, not preserving original achievement wording
- Use the original experience as a FOUNDATION ONLY, then creatively enhance it with JD-specific skills, tools, and technologies

**MANDATORY - REQUIRED SKILLS MUST APPEAR IN EXPERIENCE (NOT JUST SKILLS SECTION)**:
- **EVERY required skill, tool, and technology from the JD MUST be explicitly mentioned in the Experience section** (listing them only in Skills is NOT enough)
- **For the candidate's LAST 3 COMPANIES (most recent 3 roles), you MUST include ALL required skills from the JD** in the achievement bullets
- Example: If JD requires Go/Golang, Python, Kubernetes — each of these MUST appear in achievement bullets for the last 3 roles (e.g., "**Developed** microservices in **Go (Golang)**...", "**Built** data pipelines using **Python**...", "**Deployed** to **Kubernetes**...")
- **VERIFICATION**: Before finalizing, extract ALL required skills/tools/technologies from the JD. Ensure EACH one appears in at least one Experience bullet for the most recent 3 roles. If any required skill is missing from Experience, ADD or REWRITE bullets until every required skill is present.

## IMPORTANT: REMOTE WORK REQUIREMENT
Before processing, check if this job is suitable for remote work:
- REJECT if the job requires: "hybrid", "on-site", "in-office", "security clearance", "government clearance", "TS/SCI", "Secret clearance", "Top Secret", or similar on-site/security requirements
- ONLY process jobs that are explicitly "remote", "work from home", "fully remote", or don't specify location requirements
- If the job is not suitable for remote work, return an error message explaining why it was rejected

## MANDATORY RESUME STRUCTURE (Follow EXACTLY):
You MUST follow this exact structure and formatting pattern:

# [Full Name]
[email](mailto:email) · [phone](tel:phone) · [LinkedIn](https://linkedin.com/in/username) · [City, State]

## Summary
[Professional summary with **bold keywords** and technical terms from job description]

## Skills
- **Category Name:** Technical Skills, Tools, Regular skills, Technologies
- **Another Category:** Skills, Tools, Regular skills

## Experience

**[Job Title]**
[Company Name] | [Start Date] – [End Date]
- **[Action verb]** [achievement with **bold technical terms** and quantified results]
- **[Action verb]** [achievement with **bold technical terms** and quantified results]
- [Continue for 7-10 bullet points per role, each with **bold technical terms**]

**[Previous Job Title]**
[Previous Company Name] | [Start Date] – [End Date]
- [7-10 achievement bullet points with **bold technical terms**]

## Education
[Degree], [Institution], [Start Year]-[End Year]

## Output Format:
Provide your response in the following valid JSON format:
{
  "company": "Company Name extracted from job description",
  "role": "Job Title/Role extracted from job description", 
  "keywords": {
    "hardSkillsOnResume": ["skill1", "skill2", "skill3"],
    "hardSkillsOnJD": ["skill1", "skill2", "skill3"],
    "toolsAndTechnologiesOnResume": ["tool1", "tool2", "tool3"],
    "toolsAndTechnologiesOnJD": ["tool1", "tool2", "tool3"]
  },
  "resume": "Tailored resume in Markdown format following the EXACT structure above with these sections:
# [Full Name]
[Contact Information - email | (123) 456-7890 | [LinkedIn](url) | Full Address, City, State, Zip Code]

## Summary
## Skills
## Experience  
## Education

DO NOT include a Certifications section. DO NOT include a cover letter. This should be a resume only following the exact formatting pattern provided."
}

Focus on keyword alignment as the #1 factor for ATS optimization while maintaining natural, professional language that appeals to human recruiters.

ATS Optimization Strategy (Target Score 99+):

 1. Targeted Keyword Matching (Primary Factor - MANDATORY - CREATIVE REWRITING)
- Mirror core terminology: Use exact role-specific terms from the job description—skills, tools, certifications, and soft skills
- **CRITICAL**: Every Experience bullet point MUST explicitly mention at least one skill, tool, technology, or requirement from the job description
- **CRITICAL**: ALL required skills from the JD MUST appear in Experience bullets — listing in Skills only is NOT enough. For the candidate's LAST 3 COMPANIES, EVERY required skill (e.g., Go/Golang, Python, Kubernetes) MUST appear in at least one bullet.
- **DO NOT be constrained by original achievements**: If original achievements don't mention JD skills, COMPLETELY REWRITE them to incorporate JD requirements
- **Creative rewriting approach**: Extract the core accomplishment/impact from original experience, then creatively rewrite it with JD-specific skills, tools, and technologies
- Example: if posting says "data visualization using Tableau," rewrite achievements to include "Tableau data visualization" not just "created dashboards" - even if original mentioned different tools
- Example: if JD requires "GraphQL", "AWS Lambda", "microservices" - COMPLETELY REWRITE achievements to explicitly mention these: "**Developed** **GraphQL** APIs using **AWS Lambda** in a **microservices** architecture..." - even if original achievements mentioned different technologies
- Avoid keyword stuffing: Repeat key terms naturally throughout bullet points and summary
- Integrate synonyms and variations: ATS recognizes both "project management" and "managing projects" when phrased naturally
- **VERIFICATION**: Before finalizing each Experience bullet, verify it mentions at least one specific JD requirement (skill/tool/technology/methodology). If it doesn't, COMPLETELY REWRITE it.

 2. Skills Section Formatting (CRITICAL)
- Group skills by logical categories (e.g., "Frontend Technologies:", "Backend Technologies:", "Cloud & DevOps:", "Databases:", "AI & Integration:", "Methodologies:")
- **Bold ONLY the category label** (e.g., "**Frontend Technologies:**"). Skill names after the colon must be plain text with NO bold
- Format each line as: "**Category Name:** Skill1, Skill2, Skill3"
- Include both exact terms and variations from job description
- If JD mentions "Customer Relationship Management (CRM)" and "Salesforce," mention both

 3. Experience Section Formatting (CRITICAL - MANDATORY JD ALIGNMENT - CREATIVE REWRITING REQUIRED)
- **Generate EXACTLY 7-10 achievement-focused bullet points per role**
- **MANDATORY: EVERY required skill/tool/technology from the JD MUST appear in the Experience section** — listing in Skills only is NOT sufficient. For the **LAST 3 COMPANIES (most recent 3 roles)**, you MUST include ALL required skills from the JD in achievement bullets.
- **MANDATORY: EVERY bullet point MUST explicitly mention and incorporate required skills, tools, technologies, methodologies, or key requirements from the job description**
- **DO NOT be constrained by original achievement wording**: You have FULL CREATIVE FREEDOM to completely rewrite, enhance, or restructure achievements
- **DO NOT simply copy or slightly modify original achievements**: If original achievements don't mention JD skills, COMPLETELY REWRITE them to incorporate JD requirements
- **Use original experience as FOUNDATION ONLY**: Extract the core accomplishment/impact, then creatively rewrite it with JD-specific skills, tools, and technologies
- **DO NOT write generic achievements**: Each bullet must demonstrate direct alignment with JD requirements by naming specific JD skills/tools/technologies
- **CHECKLIST**: Extract ALL required skills from JD (e.g., Go/Golang, Python, Kubernetes). Ensure EACH appears in at least one bullet under the last 3 roles. If Go is required, you MUST have at least one bullet like "**Developed** ... in **Go (Golang)**..." or "**Built** ... using **Golang**..." for each of the last 3 companies.
- Each bullet point must start with a strong action verb: **Architected**, **Led**, **Developed**, **Implemented**, **Optimized**, **Increased**, **Reduced**, **Streamlined**, **Enhanced**, **Delivered**, **Achieved**
- **Bold ALL hard skills, technical tools, and technologies from the JD** that are mentioned in each bullet point
- Include specific, quantified results and measurable impact
- Use the STAR method (Situation, Task, Action, Result) for compelling achievements
- **REQUIREMENT**: Before writing each bullet, identify which JD skill/tool/technology it demonstrates. If a bullet doesn't reference a JD requirement, COMPLETELY REWRITE it to include one.
- **Example**: If JD requires "Go/Golang", "GraphQL", "AWS Lambda" — last 3 roles MUST include bullets like "**Developed** **GraphQL** APIs in **Go (Golang)** using **AWS Lambda**..." — even if the original achievement mentioned different technologies

 4. Contact Information Formatting (CRITICAL)
- Use pipe separators: email | (123) 456-7890 | [LinkedIn](https://linkedin.com/in/username) | Full Address, City, State, Zip Code
- PRESERVE all original contact details exactly as provided

Instructions:
1. Contact Information: PRESERVE all original contact details (full name, email, phone, LinkedIn, address) exactly as provided. Format LinkedIn URLs as markdown links: [LinkedIn](https://linkedin.com/in/username) instead of showing full URLs
2. Summary: Rewrite to emphasize JD-specific skills and impact using exact terminology with **bold keywords**
3. Experience: Keep all original company and project names. **Generate EXACTLY 7-10 achievement-focused bullet points per role** that demonstrate comprehensive impact and align with job priorities. **MANDATORY - REQUIRED SKILLS IN LAST 3 ROLES**: Extract ALL required skills/tools/technologies from the JD. EVERY one MUST appear in at least one achievement bullet under the candidate's LAST 3 COMPANIES (most recent 3 roles). Listing required skills only in the Skills section is NOT sufficient — they MUST appear in Experience bullets. Example: if JD requires Go/Golang, add bullets like "**Developed** services in **Go (Golang)**..." for each of the last 3 roles. **CRITICAL: DO NOT be tied to or rely on original achievement wording. You have FULL CREATIVE FREEDOM to completely rewrite, enhance, or restructure achievements to perfectly align with JD requirements. Use original experience as FOUNDATION ONLY - extract the core accomplishment/impact, then creatively rewrite it with JD-specific skills, tools, and technologies. DO NOT simply copy or slightly modify original achievements.** **MANDATORY: Each bullet point MUST explicitly mention and incorporate required skills, tools, technologies, or methodologies from the job description. DO NOT write generic achievements - every bullet must reference specific JD requirements.** Each bullet should be a specific, quantified achievement using strong action verbs. **Bold ALL hard skills and technical tools from the JD** mentioned in bullet points using **markdown bold formatting**. Before finalizing, verify EVERY required JD skill appears in Experience bullets for the last 3 roles. If any is missing, ADD or REWRITE bullets until all required skills are present.
4. Skills: Expand to match JD terminology. Add missing tools and group logically by categories. **Bold ONLY category labels** — skill names stay plain text (e.g., "**Frontend Technologies:** React, Node.js, Angular")
5. Education: Keep unchanged
6. DO NOT include a Certifications section — omit it entirely even if the original resume has certifications
7. CRITICAL: Do not include any other text, comments, notes, suggestions, recommendations, or explanatory text in the resume. The resume must contain ONLY the structured sections (Summary, Skills, Experience, Education) with their content. NO parenthetical notes, NO "(Note:...)" comments, NO suggestions, NO recommendations.

`;


// DeepSeek's Chat Completions API uses max_tokens for both V4 models.
function isDeepSeekModel(model: string): boolean {
  return model.toLowerCase().startsWith("deepseek-");
}

// Build an absolute endpoint from the configured API URL
function getApiUrl(apiUrl: string, endpoint: string): string {
  const normalizedBase = apiUrl.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

function normalizeApiKey(value: string): string {
  return value.trim().replace(/^['"]+|['"]+$/g, "").replace(/\s+/g, "");
}

export async function fetchModels(
  apiKey: string,
  apiUrl: string = "https://api.deepseek.com"
): Promise<string[]> {
  const normalizedApiKey = normalizeApiKey(apiKey);
  if (!normalizedApiKey) {
    throw new Error("OpenAI API key is required");
  }

  const url = getApiUrl(apiUrl, "/models");
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${normalizedApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data = await response.json();
  return data.data?.map((model: any) => model.id) || [];
}

export async function testChatCompletion(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string,
  apiUrl: string = "https://api.deepseek.com"
): Promise<string> {
  const normalizedApiKey = normalizeApiKey(apiKey);
  if (!normalizedApiKey) {
    throw new Error("OpenAI API key is required");
  }

  if (!systemPrompt || !userMessage) {
    throw new Error("Both system prompt and user message are required");
  }

  const url = getApiUrl(apiUrl, "/chat/completions");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizedApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      ...(isDeepSeekModel(model)
        ? { max_tokens: 4000 }
        : { max_completion_tokens: 2000 }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `API request failed: ${response.status}`
    );
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

export async function tailorResume(
  resume: string,
  jobDescription: string,
  apiKey: string,
  model: string,
  apiUrl: string = "https://api.deepseek.com"
): Promise<{
  company: string;
  role: string;
  resume: string;
  keywords: {
    hardSkillsOnResume: string[];
    hardSkillsOnJD: string[];
    toolsAndTechnologiesOnResume: string[];
    toolsAndTechnologiesOnJD: string[];
  };
}> {
  const normalizedApiKey = normalizeApiKey(apiKey);
  if (!normalizedApiKey) {
    throw new Error("OpenAI API key is required");
  }

  if (!resume || !jobDescription) {
    throw new Error("Both resume and job description are required");
  }

  const url = getApiUrl(apiUrl, "/chat/completions");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizedApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Please analyze the job description for key hard skills, soft skills, and relevant keywords, then rewrite my resume to naturally incorporate high-impact, ATS-friendly keywords while maintaining a professional human tone.

IMPORTANT: First check if this job is suitable for remote work. REJECT if it requires hybrid, on-site, in-office work, or security clearance. Only process fully remote positions.

CRITICAL STRUCTURE REQUIREMENTS:
1. Follow the EXACT resume structure format provided in the system prompt
2. Contact Information: Format as "email | phone | [LinkedIn](url) | City, State"
3. Skills: Group by categories — bold category labels only, plain skill names (e.g., "**Frontend Technologies:** React, Node.js, Angular")
4. Experience: Generate EXACTLY 7-10 achievement bullet points per role with **bold technical terms**
5. **MANDATORY - REQUIRED SKILLS IN LAST 2 COMPANIES' EXPERIENCE**: 
   - **EVERY required skill/tool/technology from the JD MUST appear in the Experience section** — listing them only in Skills is NOT enough
   - **For my LAST 2 COMPANIES (most recent 2 roles), you MUST include ALL required skills from the JD** in the achievement bullets
   - Example: If JD requires Go/Golang, you MUST have at least one bullet under each of my last 2 roles that mentions Go or Golang (e.g., "**Developed** microservices in **Go (Golang)**...")
   - Before finalizing: extract ALL required skills from the JD. Ensure EACH one appears in at least one Experience bullet for my last 2 roles. If any required skill is missing from Experience, ADD or REWRITE bullets until every required skill is present
6. **MANDATORY JD ALIGNMENT IN EXPERIENCE SECTION - CREATIVE REWRITING REQUIRED**: 
   - **DO NOT be tied to or rely on original achievement wording**
   - **You have FULL CREATIVE FREEDOM to completely rewrite, enhance, or restructure achievements** to perfectly align with JD requirements
   - **Use original experience as FOUNDATION ONLY** - extract the core accomplishment/impact, then creatively rewrite it with JD-specific skills, tools, and technologies
   - **DO NOT simply copy or slightly modify original achievements** - if they don't mention JD skills, COMPLETELY REWRITE them
   - EVERY bullet point MUST explicitly mention and incorporate required skills, tools, technologies, methodologies, or key requirements from the job description
   - DO NOT write generic achievements. Each bullet must demonstrate direct alignment with JD requirements by naming specific JD skills/tools/technologies
   - Before writing each bullet, identify which JD skill/tool/technology it demonstrates. If a bullet doesn't reference a JD requirement, COMPLETELY REWRITE it to include one
7. Use strong action verbs: **Architected**, **Led**, **Developed**, **Implemented**, **Optimized**, **Increased**, **Reduced**
8. **Bold ALL hard skills, technical tools, and technologies from the JD** in Summary and Experience. In Skills, bold ONLY category labels — never individual skill names
9. Include specific, quantified results and measurable impact in each bullet point
10. **ABSOLUTELY NO COMMENTS, NOTES, OR SUGGESTIONS**: The resume must contain ONLY the structured sections (Summary, Skills, Experience, Education). DO NOT include a Certifications section. DO NOT add any parenthetical notes like "(Note:...)", "(Recommended:...)", or any explanatory text.

CURRENT RESUME:
${resume}

TARGET JOB DESCRIPTION:
${jobDescription}

Please deliver a final version optimized for ATS (target score 95+), following the EXACT structure format provided. Focus on keyword alignment as the primary factor for ATS optimization, and ensure each role demonstrates 7-10 compelling achievements with proper formatting.

**CRITICAL REMINDER**: DO NOT be constrained by original achievement wording. You have FULL CREATIVE FREEDOM to completely rewrite achievements to incorporate JD requirements. Use original experience as FOUNDATION ONLY, then creatively enhance it with JD-specific skills, tools, and technologies.

**FINAL VERIFICATION**: (1) Extract ALL required skills/tools/technologies from the JD. (2) Ensure EACH one appears in at least one achievement bullet under my LAST 2 COMPANIES (most recent 2 roles). If JD requires Go/Golang, Python, Kubernetes, etc., EVERY one must appear in Experience for those 2 roles — not only in Skills. (3) Verify EVERY Experience bullet mentions at least one JD requirement. If any required skill is missing from last 2 roles' Experience, ADD or REWRITE bullets until all are present.`,
        },
      ],
      ...(isDeepSeekModel(model)
        ? {
          max_tokens: 32768,
          response_format: { type: "json_object" },
          thinking: { type: "enabled" },
          reasoning_effort: "high",
        }
        : { max_completion_tokens: 4000 }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `API request failed: ${response.status}`
    );
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const content = choice?.message?.content || "";

  if (choice?.finish_reason === "length") {
    throw new Error(
      "DeepSeek stopped before completing the JSON response. Please retry; if it persists, shorten the base resume or job description."
    );
  }

  if (!content.trim()) {
    throw new Error("DeepSeek returned an empty response. Please retry.");
  }

  try {
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;

    // Check if content is wrapped in markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonContent);

    // Validate that essential fields are present
    const resume = parsed.resume || "";
    const company = parsed.company || "";
    const role = parsed.role || "";

    if (!resume || !resume.includes("#")) {
      throw new Error("API returned an invalid or empty resume. Please retry.");
    }
    if (!company || !role) {
      throw new Error("API did not return company/role. The response may have been truncated. Please retry.");
    }

    return {
      company,
      role,
      resume,
      keywords: parsed.keywords || {
        hardSkillsOnResume: [],
        hardSkillsOnJD: [],
        toolsAndTechnologiesOnResume: [],
        toolsAndTechnologiesOnJD: [],
      },
    };
  } catch (error) {
    console.error("Failed to parse JSON response:", error);

    if (error instanceof SyntaxError) {
      throw new Error(
        "DeepSeek returned malformed JSON. Please retry the generation."
      );
    }

    // If it's already a validation/rejection error, rethrow
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to parse API response. The response may have been truncated or malformed. Please retry.");
  }
}
