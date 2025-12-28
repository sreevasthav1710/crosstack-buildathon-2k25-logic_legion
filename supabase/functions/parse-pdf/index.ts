import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ZipReader, BlobReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received document parse request');

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = file.name.toLowerCase();
    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    let extractedText = '';

    // Handle DOCX files
    if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedText = await parseDocx(file);
    }
    // Handle PDF files
    else if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
      extractedText = await parsePdf(file);
    }
    else {
      return new Response(
        JSON.stringify({ success: false, error: 'Unsupported file type. Please upload a PDF or DOCX file.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Extracted ${extractedText.length} characters`);
    console.log('First 300 chars:', extractedText.substring(0, 300));

    if (extractedText.length < 30) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract enough text. Please copy and paste your resume text instead.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        text: extractedText,
        charCount: extractedText.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing document:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse document' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Parse DOCX files (ZIP containing XML)
async function parseDocx(file: File): Promise<string> {
  try {
    const zipReader = new ZipReader(new BlobReader(file));
    const entries = await zipReader.getEntries();
    
    // Find document.xml (main content)
    const documentEntry = entries.find(e => e.filename === 'word/document.xml');
    
    if (!documentEntry) {
      throw new Error('Invalid DOCX file: document.xml not found');
    }

    const xmlContent = await documentEntry.getData!(new TextWriter());
    await zipReader.close();

    // Extract text from XML
    let text = '';
    
    // Extract text from <w:t> tags (Word text elements)
    const textMatches = xmlContent.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    const textParts: string[] = [];
    
    for (const match of textMatches) {
      if (match[1]) {
        textParts.push(match[1]);
      }
    }

    // Join with appropriate spacing
    text = textParts.join('');
    
    // Add paragraph breaks where <w:p> ends
    text = xmlContent
      .replace(/<w:p[^>]*>/g, '\n')
      .replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    return text;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

// Parse PDF files
async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Check PDF magic number
  const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (!isPDF) {
    throw new Error('File is not a valid PDF');
  }

  const pdfContent = new TextDecoder('latin1').decode(bytes);
  const textFragments: string[] = [];

  // Strategy 1: Extract from BT...ET text blocks
  const textBlockRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let blockMatch;
  while ((blockMatch = textBlockRegex.exec(pdfContent)) !== null) {
    const block = blockMatch[1];
    
    const tjMatches = block.matchAll(/\(([^)]*)\)\s*Tj/g);
    for (const m of tjMatches) {
      const decoded = decodePdfString(m[1]);
      if (decoded.trim()) textFragments.push(decoded);
    }
    
    const tjArrayMatches = block.matchAll(/\[((?:[^[\]]*|\([^)]*\))*)\]\s*TJ/gi);
    for (const m of tjArrayMatches) {
      const arrayContent = m[1];
      const stringMatches = arrayContent.matchAll(/\(([^)]*)\)/g);
      for (const sm of stringMatches) {
        const decoded = decodePdfString(sm[1]);
        if (decoded.trim()) textFragments.push(decoded);
      }
    }
  }

  // Strategy 2: Direct Tj matches
  const directTjMatches = pdfContent.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g);
  for (const m of directTjMatches) {
    const decoded = decodePdfString(m[1]);
    if (decoded.length >= 1 && /[a-zA-Z]/.test(decoded)) {
      textFragments.push(decoded);
    }
  }

  // Strategy 3: ASCII sequences
  const asciiMatches = pdfContent.matchAll(/\(([A-Za-z][A-Za-z0-9\s.,@\-+:;'"/()]{2,})\)/g);
  for (const m of asciiMatches) {
    const text = m[1].trim();
    if (text.length >= 2 && /[a-zA-Z]{2,}/.test(text)) {
      textFragments.push(text);
    }
  }

  // Strategy 4: Hex strings
  const hexMatches = pdfContent.matchAll(/<([0-9A-Fa-f\s]+)>/g);
  for (const m of hexMatches) {
    const hexStr = m[1].replace(/\s/g, '');
    if (hexStr.length >= 4 && hexStr.length % 2 === 0 && hexStr.length <= 500) {
      let decoded = '';
      for (let i = 0; i < hexStr.length; i += 2) {
        const charCode = parseInt(hexStr.substring(i, i + 2), 16);
        if (charCode >= 32 && charCode < 127) {
          decoded += String.fromCharCode(charCode);
        }
      }
      if (decoded.length >= 2 && /[a-zA-Z]{2,}/.test(decoded)) {
        textFragments.push(decoded);
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniqueFragments: string[] = [];
  for (const fragment of textFragments) {
    const normalized = fragment.trim();
    const key = normalized.toLowerCase();
    if (normalized.length > 0 && !seen.has(key)) {
      seen.add(key);
      uniqueFragments.push(normalized);
    }
  }

  let extractedText = uniqueFragments.join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\0/g, '')
    .trim();

  // Filter garbage
  const garbagePatterns = [
    /ReportLab Generated PDF document/gi,
    /www\.reportlab\.com/gi,
    /\bstream\b/gi,
    /\bendobj\b/gi,
  ];
  for (const pattern of garbagePatterns) {
    extractedText = extractedText.replace(pattern, '');
  }

  // Add section breaks
  const sectionHeaders = [
    'SUMMARY', 'OBJECTIVE', 'EXPERIENCE', 'EDUCATION', 'SKILLS',
    'PROJECTS', 'ACHIEVEMENTS', 'CERTIFICATIONS', 'CONTACT',
    'PROFILE', 'ABOUT'
  ];
  for (const header of sectionHeaders) {
    const regex = new RegExp(`\\s+(${header}:?)\\s+`, 'gi');
    extractedText = extractedText.replace(regex, `\n\n$1\n`);
  }

  extractedText = extractedText.replace(/\n{3,}/g, '\n\n').replace(/\s+/g, ' ').trim();

  // Check quality
  const specialCount = (extractedText.match(/[^\w\s@.,:;()\-+/%'"!?&]/g) || []).length;
  if (specialCount / Math.max(1, extractedText.length) > 0.35) {
    throw new Error('PDF text appears corrupted. Please copy and paste your resume text instead.');
  }

  return extractedText;
}

function decodePdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\(.)/g, '$1')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .trim();
}
