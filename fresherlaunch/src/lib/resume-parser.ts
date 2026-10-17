import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { ParsedResumeData } from './types';
import { TECH_KEYWORDS_DICTIONARY } from './scoring';

export async function parseResumeBuffer(buffer: Buffer, filename: string): Promise<ParsedResumeData> {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  let rawText = '';
  let isScannedPdf = false;

  try {
    if (extension === 'pdf') {
      const pdfData = await pdfParse(buffer);
      rawText = pdfData.text || '';
      // Also extract embedded PDF hyperlink annotations (/URI (https://...)) that pdf-parse omits
      const rawLatin1 = buffer.toString('latin1');
      const uriMatches = Array.from(rawLatin1.matchAll(/\/URI\s*\((https?:\/\/[^)\\]+)\)/gi), m => m[1]);
      if (uriMatches.length > 0) {
        const uniqueUris = Array.from(new Set(uriMatches));
        rawText = `${rawText}\n${uniqueUris.join('\n')}`;
      }
      // Check if text is suspiciously empty or contains almost no alphabetic characters
      const alphaChars = (rawText.match(/[a-zA-Z]/g) || []).length;
      if (alphaChars < 60) {
        isScannedPdf = true;
      }
    } else if (extension === 'docx') {
      const docxResult = await mammoth.extractRawText({ buffer });
      rawText = docxResult.value || '';
      try {
        const htmlResult = await mammoth.convertToHtml({ buffer });
        const hrefMatches = Array.from(
          (htmlResult.value || '').matchAll(/href=["'](https?:\/\/[^"']+)["']/gi),
          m => m[1]
        );
        if (hrefMatches.length > 0) {
          const uniqueHrefs = Array.from(new Set(hrefMatches));
          rawText = `${rawText}\n${uniqueHrefs.join('\n')}`;
        }
      } catch {
        // Ignore HTML hyperlink extraction errors if raw text succeeded
      }
    } else {
      // Plain text or fallback
      rawText = buffer.toString('utf-8');
    }
  } catch (err) {
    console.warn(`Extraction error for ${filename}:`, err);
    if (['pdf', 'docx'].includes(extension)) {
      rawText = '';
    } else {
      rawText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    }
  }

  // Clean rawText and rejoin emails wrapped across lines in narrow PDF columns
  rawText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/([\w.+-]+@[\w.-]+\.)\s*\n\s*([a-zA-Z]{2,})/g, '$1$2');

  // Candidate Name extraction heuristic
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let candidateName = 'Candidate';
  const nonNameRegex = /\b(?:resume|curriculum|vitae|profile|objective|summary|email|phone|contact|linkedin|github|http|www|engineer|developer|analyst|student|intern|specialist|cybersecurity|security|software|b\.?\s*tech|institute|institution|technology|technologies|university|college|school|private|ltd|limited|solutions|services|systems|corp|corporation|experience|education|skills|projects|certifications|achievements|language|languages|computer|work|technical|personal|academic|hyderabad|bangalore|bengaluru|chennai|mumbai|delhi|pune|india|khammam|telangana|english|hindi|telugu|python|java|mysql|sql)\b|@/i;
  let singleWordFallback = '';
  for (let idx = 0; idx < Math.min(lines.length, 35); idx++) {
    const cleaned = lines[idx].replace(/[#*_\-|:]/g, ' ').trim();
    if (nonNameRegex.test(cleaned)) {
      continue;
    }
    const words = cleaned.split(/\s+/);
    if (
      words.length >= 1 &&
      words.length <= 4 &&
      words.every(w => /^[A-Z][a-zA-Z.'-]*$/.test(w))
    ) {
      if (words.length >= 2 || words[0].includes('.')) {
        candidateName = cleaned;
        break;
      } else if (!singleWordFallback && idx < 8) {
        singleWordFallback = cleaned;
      }
    }
  }
  if (candidateName === 'Candidate' && singleWordFallback) {
    candidateName = singleWordFallback;
  }

  // Email extraction
  const emailMatch = rawText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  // Phone extraction (handles Indian +91 / 10-digit and international 3-3-4 formats)
  const phoneMatch = rawText
    .replace(/\s+/g, ' ')
    .match(/(?:\+?\d{1,3}[\s.-]?)?(?:[6-9]\d{4}[\s.-]?\d{5}|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  // Links (support standard github.com/user and user.github.io)
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[\w-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?(?:github\.com\/[\w-]+|[\w-]+\.github\.io(?:\/[\w-]+)?)/i);

  const normalizeUrl = (rawUrl: string) =>
    /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  const lowerText = rawText.toLowerCase();
  const escapeRegex = (str: string) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const matchesKeyword = (textToSearch: string, kw: string) => {
    if (kw === 'c++') return /(?:^|[^\w])c\+\+(?![\w])/i.test(textToSearch);
    if (kw === 'c') return /(?:^|[^\w])c(?![\w+#])/i.test(textToSearch);
    const escaped = escapeRegex(kw);
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(textToSearch);
  };
  const matchedSkills = TECH_KEYWORDS_DICTIONARY.filter(kw => matchesKeyword(lowerText, kw));

  // Section headers found
  const sectionsChecklist = ['education', 'skills', 'projects', 'experience', 'summary', 'certifications'];
  const sectionsFound = sectionsChecklist.filter(sec => lowerText.includes(sec));

  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  // Dynamic Education Extraction from rawText
  const degreeMatch = rawText.match(/(?:B\.?\s*Tech|B\.?\s*E\.?|Bachelor[^,\n|—–]*|M\.?\s*Tech|MCA|BCA|B\.?\s*Sc|Master[^,\n|—–]*)[^,\n|—–]*/i);
  const instMatch = rawText.match(/(?:[A-Z][A-Za-z&.\s]+(?:Institute|University|College|School)[A-Za-z\s,()]*)/);
  const cgpaMatch = rawText.match(/(?:CGPA|GPA|Percentage|Score)\s*[:\-]?\s*(\d+(?:\.\d+)?%?)|\b(\d{2}(?:\.\d+)?%|\d\.\d+\s*CGPA)\b/i);
  const yearMatch = rawText.match(/\b(202[0-9])\b/);

  const cleanedDegree = degreeMatch
    ? degreeMatch[0]
        .split(/\b(?:graduate|student|with|from|at|cgpa|gpa|20\d{2})\b/i)[0]
        .trim()
        .slice(0, 80)
    : '';

  const parsedEducation =
    cleanedDegree || instMatch
      ? [
          {
            degree: cleanedDegree || 'Degree not specified',
            institution: instMatch ? instMatch[0].trim().slice(0, 90) : 'Institution not specified',
            year: yearMatch ? yearMatch[1] : undefined,
            score: cgpaMatch ? (cgpaMatch[1] || cgpaMatch[2]) : undefined,
          },
        ]
      : [];

  // Dynamic Projects & Experience extraction from rawText
  const parsedProjects: ParsedResumeData['projects'] = [];
  const parsedExperience: ParsedResumeData['experience'] = [];

  const bulletLines = lines.filter(l => /^[-•*▪]/.test(l));
  for (const bLine of bulletLines) {
    const cleanBullet = bLine.replace(/^[-•*▪]\s*/, '').trim();
    if (/intern|trainee|engineer|developer|analyst|lead/i.test(cleanBullet) && /—|-|\(/.test(cleanBullet)) {
      const [head, ...rest] = cleanBullet.split(':');
      const parts = head.split(/—|-/);
      const durMatch = head.match(/\(([^)]+)\)/);
      parsedExperience.push({
        role: (parts[0] || 'Role').replace(/\([^)]*\)/g, '').trim(),
        company: (parts[1] || 'Organization').replace(/\([^)]*\)/g, '').trim(),
        duration: durMatch ? durMatch[1] : 'Recent',
        description: [rest.join(':').trim() || cleanBullet],
      });
    } else if (cleanBullet.includes(':')) {
      const [titlePart, ...descParts] = cleanBullet.split(':');
      const desc = descParts.join(':').trim();
      const combinedLower = cleanBullet.toLowerCase();
      const detectedStack = TECH_KEYWORDS_DICTIONARY.filter(kw =>
        matchesKeyword(combinedLower, kw)
      ).slice(0, 5);
      parsedProjects.push({
        title: titlePart.trim().slice(0, 60),
        techStack: detectedStack.length > 0 ? detectedStack : matchedSkills.slice(0, 3),
        description: [desc],
      });
    }
  }

  // If no colon-formatted bullet projects were found, look inside the PROJECTS section
  if (parsedProjects.length === 0) {
    const projHeaderIdx = lines.findIndex(l => /^(?:key\s+|technical\s+|academic\s+|personal\s+)?projects\b/i.test(l));
    if (projHeaderIdx !== -1) {
      for (let i = projHeaderIdx + 1; i < Math.min(lines.length, projHeaderIdx + 8); i++) {
        const line = lines[i];
        if (/^(?:experience|work\s+experience|education|skills|certifications|achievements)\b/i.test(line)) {
          break;
        }
        const cleanedLine = line.replace(/^[-•*▪]\s*/, '').trim();
        if (cleanedLine.length > 12) {
          const lineSkills = TECH_KEYWORDS_DICTIONARY.filter(kw =>
            matchesKeyword(cleanedLine.toLowerCase(), kw)
          ).slice(0, 5);
          parsedProjects.push({
            title: cleanedLine.split(/[:|—-]/)[0].trim().slice(0, 60),
            techStack: lineSkills.length > 0 ? lineSkills : matchedSkills.slice(0, 3),
            description: [cleanedLine],
          });
        }
      }
    }
  }

  return {
    rawText,
    candidateName,
    email: email || 'Not found',
    phone: phone || 'Not found',
    links: {
      linkedin: linkedinMatch
        ? normalizeUrl(linkedinMatch[0])
        : /\blinkedin\b/i.test(rawText)
          ? 'LinkedIn (Detected in Resume)'
          : 'Not found',
      github: githubMatch
        ? normalizeUrl(githubMatch[0])
        : /\bgithub\b/i.test(rawText)
          ? 'GitHub (Detected in Resume)'
          : 'Not found',
    },
    education: parsedEducation,
    skills: matchedSkills,
    projects: parsedProjects,
    experience: parsedExperience,
    sectionsFound,
    wordCount,
    isScannedPdf,
  };
}
