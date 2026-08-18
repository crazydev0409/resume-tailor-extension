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
- **For EVERY POSITION EXCEPT THE SINGLE OLDEST POSITION, use the same JD-alignment rules, bullet structure, bullet count, and level of detail as the two most recent positions.**
- Example: If JD requires Go/Golang, Python, or Kubernetes, incorporate each supported requirement naturally across the applicable non-oldest roles (e.g., "**Developed** microservices in **Go (Golang)**...", "**Built** data pipelines using **Python**...", "**Deployed** to **Kubernetes**...").
- **VERIFICATION**: Before finalizing, confirm that every position except the oldest has the same structural depth and detailed achievement style as the two most recent positions. Do not progressively shorten middle positions.

## IMPORTANT: REMOTE WORK REQUIREMENT
Before processing, check if this job is suitable for remote work:
- REJECT if the job requires: "hybrid", "on-site", "in-office", "security clearance", "government clearance", "TS/SCI", "Secret clearance", "Top Secret", or similar on-site/security requirements
- ONLY process jobs that are explicitly "remote", "work from home", "fully remote", or don't specify location requirements
- If the job is not suitable for remote work, return the required JSON object with status "rejected", an empty resume, and a specific reason

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
- [Continue for 10-12 detailed bullet points for every role except the oldest]

**[Previous Job Title]**
[Previous Company Name] | [Start Date] – [End Date]
- [10-12 achievement bullet points with **bold technical terms**; use only 3-5 bullets if this is the single oldest role]

## Education
[Degree], [Institution], [Start Year]-[End Year]

## Output Format:
Return only one valid JSON object. Do not include Markdown fences or commentary around the JSON.

For a successfully tailored resume, use this shape:
{
  "status": "tailored",
  "reason": "",
  "company": "Company Name extracted from job description",
  "role": "Job Title/Role extracted from job description",
  "keywords": {
    "hardSkillsOnResume": ["skill1", "skill2", "skill3"],
    "hardSkillsOnJD": ["skill1", "skill2", "skill3"],
    "toolsAndTechnologiesOnResume": ["tool1", "tool2", "tool3"],
    "toolsAndTechnologiesOnJD": ["tool1", "tool2", "tool3"]
  },
  "resume": "Complete tailored resume as one Markdown string with JSON-escaped newline characters"
}

For a job rejected by the remote-work or clearance rules, use the same shape but set status to "rejected", explain the exact requirement in reason, and set resume to an empty string. Always include company, role, and keywords even when rejected.

The resume value for a successful response must begin with a level-one Markdown name heading and contain the Summary, Skills, Experience, and Education headings. Do not include a Certifications section or cover letter.

Focus on keyword alignment as the #1 factor for ATS optimization while maintaining natural, professional language that appeals to human recruiters.

ATS Optimization Strategy (Target Score 99+):

 1. Targeted Keyword Matching (Primary Factor - MANDATORY - CREATIVE REWRITING)
- Mirror core terminology: Use exact role-specific terms from the job description—skills, tools, certifications, and soft skills
- **CRITICAL**: Every Experience bullet point MUST explicitly mention at least one skill, tool, technology, or requirement from the job description
- **CRITICAL**: Apply the same JD-alignment standard to EVERY POSITION EXCEPT THE SINGLE OLDEST POSITION. Do not reserve detailed alignment for only the newest roles.
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
- **Generate EXACTLY 10-12 achievement-focused bullet points for EVERY POSITION EXCEPT THE SINGLE OLDEST POSITION. Generate 3-5 bullets for only the oldest position.**
- **MANDATORY ROLE CONSISTENCY**: Every non-oldest position must use the same formatting, achievement depth, technical specificity, approximate bullet length, and JD-alignment standard as the two most recent positions. Never shorten a middle position merely because it is older than the newest two.
- **MANDATORY: EVERY required skill/tool/technology from the JD MUST appear naturally in the Experience section** — listing it only in Skills is not sufficient. Distribute supported requirements across all applicable non-oldest roles rather than concentrating detail in only the newest roles.
- **MANDATORY: EVERY bullet point MUST explicitly mention and incorporate required skills, tools, technologies, methodologies, or key requirements from the job description**
- **DO NOT be constrained by original achievement wording**: You have FULL CREATIVE FREEDOM to completely rewrite, enhance, or restructure achievements
- **DO NOT simply copy or slightly modify original achievements**: If original achievements don't mention JD skills, COMPLETELY REWRITE them to incorporate JD requirements
- **Use original experience as FOUNDATION ONLY**: Extract the core accomplishment/impact, then creatively rewrite it with JD-specific skills, tools, and technologies
- **DO NOT write generic achievements**: Each bullet must demonstrate direct alignment with JD requirements by naming specific JD skills/tools/technologies
- **CHECKLIST**: Confirm that every non-oldest role contains 10-12 substantial bullets and matches the two newest roles in structure and detail. The oldest role alone may be condensed to 3-5 bullets.
- Each bullet point must start with a strong action verb: **Architected**, **Led**, **Developed**, **Implemented**, **Optimized**, **Increased**, **Reduced**, **Streamlined**, **Enhanced**, **Delivered**, **Achieved**
- **Bold ALL hard skills, technical tools, and technologies from the JD** that are mentioned in each bullet point
- Include specific, quantified results and measurable impact
- Use the STAR method (Situation, Task, Action, Result) for compelling achievements
- **REQUIREMENT**: Before writing each bullet, identify which JD skill/tool/technology it demonstrates. If a bullet doesn't reference a JD requirement, COMPLETELY REWRITE it to include one.
- **Example**: Non-oldest roles should use the same detailed pattern as "**Developed** **GraphQL** APIs in **Go (Golang)** using **AWS Lambda**..." whenever the source experience supports those technologies.

 4. Contact Information Formatting (CRITICAL)
- Use pipe separators: email | (123) 456-7890 | [LinkedIn](https://linkedin.com/in/username) | Full Address, City, State, Zip Code
- PRESERVE all original contact details exactly as provided

Instructions:
1. Contact Information: PRESERVE all original contact details (full name, email, phone, LinkedIn, address) exactly as provided. Format LinkedIn URLs as markdown links: [LinkedIn](https://linkedin.com/in/username) instead of showing full URLs
2. Summary: Rewrite to emphasize JD-specific skills and impact using exact terminology with **bold keywords**
3. Experience: Keep all original company and project names. **Generate EXACTLY 10-12 achievement-focused bullet points for every position except the single oldest position; use 3-5 bullets only for the oldest position.** Every non-oldest role must match the two most recent roles in structure, technical depth, approximate bullet length, and JD alignment. Do not progressively shorten middle roles. Distribute supported JD requirements naturally across applicable non-oldest roles rather than concentrating them in only the newest roles. Each bullet should be a specific, quantified achievement using strong action verbs, with supported hard skills and technical tools bolded.
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
4. Experience: Generate EXACTLY 10-12 detailed achievement bullet points for every role except the single oldest role, which must have 3-5 bullets. All non-oldest roles must match the last two roles in structure, content depth, and approximate bullet length.
5. **MANDATORY - CONSISTENT EXPERIENCE DETAIL**:
   - **EVERY required skill/tool/technology from the JD MUST appear in the Experience section** — listing them only in Skills is NOT enough
   - Apply the same formatting, technical specificity, achievement depth, and JD-alignment rules to EVERY POSITION EXCEPT THE SINGLE OLDEST POSITION
   - Do not give middle positions fewer, shorter, or more generic bullets than the last two positions
   - Before finalizing, verify that every non-oldest position has 10-12 substantial bullets and that only the oldest position is condensed
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

Please deliver a final version optimized for ATS (target score 95+), following the EXACT structure format provided. Ensure every position except the single oldest position demonstrates 10-12 compelling achievements with the same structure and detail as the two most recent positions; use 3-5 bullets only for the oldest position.

**CRITICAL REMINDER**: DO NOT be constrained by original achievement wording. You have FULL CREATIVE FREEDOM to completely rewrite achievements to incorporate JD requirements. Use original experience as FOUNDATION ONLY, then creatively enhance it with JD-specific skills, tools, and technologies.

**FINAL VERIFICATION**: (1) Verify that every position except the single oldest position has exactly 10-12 achievement bullets. (2) Verify that all non-oldest positions match the two most recent positions in structure, technical specificity, approximate bullet length, and JD alignment. (3) Verify that only the oldest position is condensed to 3-5 bullets. (4) Do not shorten any middle position.`,
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

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("DeepSeek returned an unexpected response shape. Please retry.");
    }

    // Validate that essential fields are present
    const status = typeof parsed.status === "string" ? parsed.status : "tailored";
    const reason = typeof parsed.reason === "string" ? parsed.reason.trim() : "";
    const tailoredResume = typeof parsed.resume === "string" ? parsed.resume.trim() : "";
    const company = typeof parsed.company === "string" ? parsed.company.trim() : "";
    const role = typeof parsed.role === "string" ? parsed.role.trim() : "";

    if (status === "rejected") {
      throw new Error(
        reason
          ? `Job rejected: ${reason}`
          : "Job rejected because it does not meet the remote-work or clearance requirements."
      );
    }
    if (status !== "tailored") {
      throw new Error(reason || `DeepSeek returned unsupported status: ${status}`);
    }
    if (!tailoredResume) {
      throw new Error(
        "DeepSeek returned a successful status without resume content. Please retry."
      );
    }
    if (!tailoredResume.includes("#")) {
      throw new Error(
        "DeepSeek returned resume content without the required Markdown headings. Please retry."
      );
    }
    if (!company || !role) {
      throw new Error("API did not return company/role. The response may have been truncated. Please retry.");
    }

    return {
      company,
      role,
      resume: tailoredResume,
      keywords: parsed.keywords || {
        hardSkillsOnResume: [],
        hardSkillsOnJD: [],
        toolsAndTechnologiesOnResume: [],
        toolsAndTechnologiesOnJD: [],
      },
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Failed to parse JSON response:", error);
      throw new Error(
        "DeepSeek returned malformed JSON. Please retry the generation."
      );
    }

    // If it's already a validation/rejection error, rethrow
    if (error instanceof Error) {
      console.error("DeepSeek response validation failed:", error.message);
      throw error;
    }

    throw new Error("Failed to parse API response. The response may have been truncated or malformed. Please retry.");
  }
}
