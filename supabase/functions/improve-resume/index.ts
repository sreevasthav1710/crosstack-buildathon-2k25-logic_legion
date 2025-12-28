import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeRequest {
  resume: string;
  jobRole: string;
  experienceLevel: string;
  industry: string;
  tool: string;
}

// Lenient validation - only reject truly corrupted/binary text
function isValidResumeText(text: string): { valid: boolean; reason?: string } {
  if (!text || text.trim().length < 30) {
    return { valid: false, reason: "Resume text is too short or empty" };
  }

  // Check for PDF binary/metadata indicators (reject only if multiple appear)
  const pdfBinaryPatterns = [
    /ReportLab/i,
    /%PDF-/,
    /\/Type\s*\/\w+/,
    /stream\s*\n/,
    /endstream/,
    /endobj/,
    /xref/,
    /trailer/,
    /\/Filter\s*\//,
    /\/Length\s*\d+/,
    /obj\s*<</,
    /\/FontDescriptor/,
    /\/BaseFont/,
  ];

  const pdfPatternMatches = pdfBinaryPatterns.filter(p => p.test(text)).length;
  if (pdfPatternMatches >= 3) {
    return { valid: false, reason: "Text contains PDF binary data or metadata" };
  }

  // Check for excessive special characters (corrupted text) - more lenient threshold
  const specialCharCount = (text.match(/[^\w\s@.,:;()\-+/%#'"!?&]/g) || []).length;
  const totalChars = text.length;
  if (specialCharCount / totalChars > 0.4) {
    return { valid: false, reason: "Text contains too many special characters" };
  }

  // Lenient content check - require AT LEAST 2 of these resume indicators
  const resumeIndicators = [
    // Name patterns (common name-like words or capitalized words at start)
    /^[A-Z][a-z]+\s+[A-Z][a-z]+/m,
    // Contact info
    /\b[\w.-]+@[\w.-]+\.\w{2,}\b/i, // email
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // phone
    /\b(linkedin|github|portfolio)\b/i,
    // Education
    /\b(education|university|college|degree|bachelor|master|phd|b\.?tech|m\.?tech|bsc|msc|mba)\b/i,
    // Skills
    /\b(skills?|technologies|tools|languages|frameworks)\b/i,
    // Projects
    /\b(projects?|portfolio)\b/i,
    // Experience
    /\b(experience|work|intern|internship|employment|job|position|role|company)\b/i,
    // Certifications
    /\b(certification|certificate|certified|achievement|award|accomplishment)\b/i,
    // Summary
    /\b(summary|objective|profile|about)\b/i,
  ];

  const indicatorMatches = resumeIndicators.filter(p => p.test(text)).length;
  if (indicatorMatches < 2) {
    return { valid: false, reason: "Text lacks identifiable resume sections" };
  }

  // Check for meaningful words vs gibberish - more lenient
  const words = text.split(/\s+/).filter(w => w.length > 1);
  const meaningfulWords = words.filter(w => /^[a-zA-Z]/.test(w) || /^[a-zA-Z0-9@.\-+]+$/.test(w));
  if (words.length > 10 && meaningfulWords.length / words.length < 0.4) {
    return { valid: false, reason: "Text appears to be corrupted or unreadable" };
  }

  return { valid: true };
}

const INVALID_RESUME_MESSAGE = `Resume text could not be extracted correctly from the uploaded PDF.

Please upload a different PDF, a DOCX file, or paste the resume text manually.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resume, jobRole, experienceLevel, industry, tool } = await req.json() as ResumeRequest;

    // Validate resume text before processing
    const validation = isValidResumeText(resume);
    if (!validation.valid) {
      console.log(`Resume validation failed: ${validation.reason}`);
      return new Response(JSON.stringify({ 
        error: INVALID_RESUME_MESSAGE,
        validationError: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log(`Processing resume improvement - Tool: ${tool}, Role: ${jobRole}, Level: ${experienceLevel}`);

    const plainTextRules = `
CRITICAL OUTPUT RULES:
1. Output ONLY plain text - NO markdown formatting whatsoever
2. REMOVE these symbols: *, **, _, __, #, ###, ~~, •, ◦, ▪, ▫, →, ⇒, ←, —
3. Use simple line breaks between sections (no decorative dividers)
4. Use line-separated sentences instead of bullet points
5. Format must be clean and professional, suitable for direct PDF generation
6. ALWAYS output the ENTIRE resume, not just modified sections`;

    let systemPrompt = "";
    let userPrompt = "";

    switch (tool) {
      case "wording":
        systemPrompt = `You are an expert resume writer. Rewrite resume content to be more impactful and professional.
${plainTextRules}

Guidelines:
- Use strong action verbs (Led, Developed, Implemented, Achieved, Delivered)
- Quantify achievements with numbers and metrics where possible
- Keep all information truthful - only enhance wording, never invent experience
- Optimize for ATS with role-relevant keywords
- Tailor language for ${jobRole} in ${industry}
- Adjust tone for ${experienceLevel} level
- Do NOT modify contact details, education dates, or institution names

Resume Structure to follow:
Name
Contact Information
Professional Summary
Education
Skills
Projects
Experience / Internships
Achievements / Certifications (if present)`;
        userPrompt = `Rewrite and improve this resume. Return the FULL, FINAL, CORRECTED VERSION in clean plain text format:\n\n${resume}`;
        break;

      case "ats":
        systemPrompt = `You are an ATS (Applicant Tracking System) expert. Analyze resumes for ATS compatibility.
${plainTextRules}`;
        userPrompt = `Analyze this resume for ATS compatibility for a ${jobRole} position in ${industry}. 

Format your response as:

ATS READINESS SCORE: [X]%

STRENGTHS
[List 3-5 strengths, one per line]

AREAS FOR IMPROVEMENT
[List 3-5 areas, one per line]

MISSING KEYWORDS
[List important keywords for ${jobRole} that are missing, one per line]

RECOMMENDATIONS
[List 3-5 specific recommendations, one per line]

Resume to analyze:
${resume}`;
        break;

      case "keywords":
        systemPrompt = `You are a keyword optimization expert for resumes.
${plainTextRules}`;
        userPrompt = `Analyze this resume for a ${jobRole} position in ${industry} at ${experienceLevel} level.

Format your response as:

KEYWORDS PRESENT
[List keywords found, one per line]

MISSING KEYWORDS
[List missing important keywords, one per line]

HOW TO INCORPORATE
[Provide suggestions in plain sentences, one per line]

Resume:
${resume}`;
        break;

      case "grammar":
        systemPrompt = `You are a professional editor specializing in resume writing. Fix grammar and improve clarity.
${plainTextRules}`;
        userPrompt = `Review and enhance the grammar and clarity of this resume. Return the FULL corrected resume in clean plain text:\n\n${resume}`;
        break;

      case "bullets":
        systemPrompt = `You are an expert at crafting powerful resume content. Transform weak statements into compelling achievements.
${plainTextRules}`;
        userPrompt = `Transform this resume content to be more impactful for a ${jobRole} in ${industry}. Use strong action verbs and the STAR method where applicable. Return the FULL improved resume in clean plain text:\n\n${resume}`;
        break;

      case "summary":
        systemPrompt = `You are a career branding expert. Create compelling professional summaries.
${plainTextRules}`;
        userPrompt = `Create 2-3 powerful professional summary variations for a ${experienceLevel} level ${jobRole} in ${industry}.

Format as:

SUMMARY OPTION 1
[3-4 sentences]

SUMMARY OPTION 2
[3-4 sentences]

SUMMARY OPTION 3
[3-4 sentences]

Base it on this resume:
${resume}`;
        break;

      case "skills":
        systemPrompt = `You are a career advisor who understands industry skills and trends.
${plainTextRules}`;
        userPrompt = `Based on this resume for a ${jobRole} in ${industry} at ${experienceLevel} level, suggest skills to add.

Format your response as:

TECHNICAL SKILLS TO ADD
[Skills mentioned or implied but not listed, one per line]

SOFT SKILLS TO HIGHLIGHT
[Based on experience described, one per line]

TRENDING SKILLS FOR THIS ROLE
[Current in-demand skills, one per line]

CERTIFICATIONS TO CONSIDER
[Relevant certifications, one per line]

Resume:
${resume}`;
        break;

      case "matching":
        systemPrompt = `You are a job matching analyst. Evaluate resume fit for specific roles.
${plainTextRules}`;
        userPrompt = `Analyze how well this resume matches a ${jobRole} position in ${industry}.

Format your response as:

MATCH SCORE: [X]%

STRONG MATCHES
[List matching qualifications, one per line]

GAPS TO ADDRESS
[List missing qualifications, one per line]

RECOMMENDATIONS
[Specific suggestions to improve match, one per line]

Resume:
${resume}`;
        break;

      default:
        throw new Error("Invalid tool specified");
    }

    console.log(`Calling AI gateway with tool: ${tool}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    console.log("Streaming response back to client");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in improve-resume function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
