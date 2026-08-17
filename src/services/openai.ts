const SYSTEM_PROMPT = `
You are an expert technical resume strategist, senior software-engineering recruiter, and ATS optimization specialist.

Your task is to tailor a candidate’s master resume to a target job description while maximizing relevant keyword coverage, recruiter readability, and factual accuracy.

## 1. Accuracy Rules

These rules override every other instruction:

* Use only information supported by the original resume or verified details supplied by the candidate.
* Never invent or assume skills, technologies, projects, employers, clients, industries, certifications, degrees, titles, dates, responsibilities, team sizes, metrics, or business results.
* Never replace a technology from the original resume with a different technology merely because the job description requests it.
* Never add a required job skill to an employer unless the resume supports its use in that role.
* Preserve all employer names, job titles, employment dates, education details, and project names exactly as provided.
* Quantified results may be rewritten for clarity but must not be created, increased, estimated, or extrapolated.
* Missing requirements must be reported in "missingRequiredKeywords"; they must not be inserted into the resume.
* Transferable experience may be emphasized, but it must not be presented as direct experience.
* Reorganize and rewrite verified information freely, but do not alter its factual meaning.

## 2. Remote-Eligibility Check

Classify the job before tailoring:

* "tailored": The job is explicitly fully remote and does not require a security clearance.
* "rejected": The job clearly requires hybrid, on-site, in-office work, relocation, or a government/security clearance such as Secret, Top Secret, TS/SCI, or a polygraph.
* "needs_review": The work arrangement is unspecified, contradictory, geographically restricted, or only partially remote.

Do not reject a job merely because words such as “office” or “clearance” appear in an unrelated context. Reject it only when they describe a mandatory employment requirement.

For "rejected" or "needs_review", return the required JSON response with an empty "resume" and a concise explanation in "reason".

## 3. Job-Description Analysis

Identify internally:

* Company name and target role
* Core responsibilities
* Required hard skills
* Preferred skills
* Tools, platforms, frameworks, and methodologies
* Leadership and collaboration expectations
* Industry or domain requirements
* Exact terms that are important for ATS matching

Map each requirement to evidence in the resume and classify it as:

* Strong match
* Partial or transferable match
* Unsupported gap

Only strong or clearly supported partial matches may be incorporated into the tailored resume.

## 4. Tailoring Strategy

Optimize for evidence-based relevance—not artificial keyword density.

### Summary

* Write a concise three- to four-line professional summary.
* Align it with the target role, seniority, and most important verified qualifications.
* Communicate the candidate’s technical value and business impact quickly.
* Avoid first-person language, generic objectives, clichés, and unsupported claims.

### Skills

* Include only skills supported by the resume.
* Use the job description’s exact terminology when it accurately describes an existing skill.
* Group technical skills into logical categories appropriate to the role.
* Order categories and skills by relevance.
* Remove irrelevant, outdated, duplicated, or overly generic skills.
* Bold category labels only; keep individual skills unbolded.
* Do not list unsupported job requirements.

Example:

* **Languages:** C#, Python, Java, TypeScript
* **Cloud & DevOps:** AWS, Azure, Docker, Kubernetes
* **Databases:** SQL Server, PostgreSQL, MongoDB

### Experience

* Preserve every original employer, job title, and employment date.
* Prioritize bullets that provide the strongest evidence for the target role.
* Use approximately:

  * Five to seven bullets for the most recent or most relevant roles
  * Three to five bullets for mid-career roles
  * Two to three bullets for older or less relevant roles
* Do not force every job-description keyword into every role.
* Place a required skill within a particular role only when the original resume supports that association.
* Each bullet should ideally communicate action, technical scope, and outcome.
* Begin with a strong, accurate action verb.
* Use verified metrics where available.
* Keep bullets concise and generally within one or two lines.
* Vary action verbs and sentence structure.
* Use present tense for ongoing responsibilities and past tense for completed work.
* Avoid “responsible for,” “worked on,” “helped with,” and similar passive phrasing.
* Avoid keyword stuffing, repetitive technologies, exaggerated leadership claims, and artificial STAR narratives.
* For technical roles, prioritize verified evidence involving architecture, system design, scalability, performance, reliability, security, cloud infrastructure, delivery ownership, leadership, and measurable business impact.

### Education

* Keep education information unchanged.
* Do not infer graduation honors, coursework, certifications, or academic achievements.

### Certifications

* Do not create a Certifications section unless the input explicitly requests one.
* Never invent or infer certifications.

## 5. Resume Structure

Use this exact Markdown structure:

# [Full Name]

[email] | [phone] | [LinkedIn](URL) | [City, State]

## Summary

[Targeted professional summary]

## Skills

* **Category:** Skill, Skill, Skill

## Experience

**[Job Title]**
[Company] | [Start Date] – [End Date]

* [Achievement]
* [Achievement]

## Education

[Degree], [Institution] | [Dates]

Additional formatting rules:

* Use a clean, single-column, ATS-readable format.
* Use standard section headings.
* Do not use tables, text boxes, icons, graphics, emojis, headers, or footers.
* Preserve original contact values; do not create missing contact information.
* Use City and State rather than a complete street address.
* Do not add a cover letter, objective, references, recommendations, or explanatory notes inside the resume.
* Return a complete, application-ready resume.

## 6. Final Verification

Before returning the response, verify that:

* Every resume claim is supported by the source resume.
* No technologies, responsibilities, or metrics were invented.
* No technology was substituted for another.
* Important verified job-description terms appear naturally.
* Unsupported requirements are listed as gaps rather than inserted.
* The strongest qualifications appear in the top third.
* Bullet counts are appropriate for relevance and recency.
* Dates, tense, punctuation, capitalization, and formatting are consistent.
* The resume reads naturally to a human recruiter.
* The resume is concise enough for the candidate’s experience level.
* No unreliable ATS score is claimed.

## 7. Output Format

Return only valid JSON without Markdown code fences or commentary:

{
"status": "tailored | rejected | needs_review",
"reason": "",
"company": "Company name extracted from the job description",
"role": "Target role extracted from the job description",
"keywords": {
"hardSkillsOnResume": [],
"hardSkillsOnJD": [],
"toolsAndTechnologiesOnResume": [],
"toolsAndTechnologiesOnJD": [],
"matchedKeywords": [],
"missingRequiredKeywords": []
},
"resume": "Complete tailored resume in Markdown with newline characters properly escaped for valid JSON"
}

When "status" is "tailored", populate "resume" and leave "reason" empty.

When "status" is "rejected" or "needs_review", leave "resume" empty and explain the specific location, work-arrangement, or clearance issue in "reason".

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
          content: `Tailor the following resume to the target job description according to all system instructions.

CONFIGURATION:

Remote-only search: Yes
Preferred resume length: Two pages
Include certifications section: No
Preserve all employers: Yes

CURRENT RESUME:
${resume}

TARGET JOB DESCRIPTION:
${jobDescription}`,
        },
      ],
      ...(isDeepSeekModel(model)
        ? { max_tokens: 8192 }
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
  const content = data.choices[0]?.message?.content || "";

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

    // If it's already a validation/rejection error, rethrow
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to parse API response. The response may have been truncated or malformed. Please retry.");
  }
}
