import { ATSScoreBreakdown, ParsedResumeData, ResumeAnnotation } from './types';

// Deterministic Keywords Taxonomy for Fresher Tech Roles
export const TECH_KEYWORDS_DICTIONARY = [
  'python', 'javascript', 'typescript', 'java', 'c', 'c++', 'sql', 'bash', 'html', 'css',
  'react', 'next.js', 'vue', 'node.js', 'express', 'flask', 'django', 'fastapi', 'spring boot',
  'rest api', 'restful', 'graphql', 'microservices', 'crud',
  'mysql', 'postgresql', 'mongodb', 'sqlite', 'redis', 'firebase',
  'git', 'github', 'linux', 'ubuntu', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd',
  'data structures', 'algorithms', 'oop', 'oops', 'dbms', 'operating systems', 'computer networks',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'opencv', 'yolo', 'lstm',
  'pandas', 'numpy', 'scikit-learn', 'matplotlib',
  'cyber security', 'network security', 'cryptography', 'penetration testing', 'soc',
  'unit testing', 'jest', 'pytest', 'postman'
];

export const STRONG_ACTION_VERBS = [
  'engineered', 'developed', 'architected', 'implemented', 'automated',
  'optimized', 'accelerated', 'reduced', 'improved', 'deployed',
  'designed', 'spearheaded', 'orchestrated', 'streamlined', 'integrated',
  'constructed', 'formulated', 'delivered', 'analyzed', 'led'
];

export const WEAK_PASSIVE_VERBS = [
  'worked on', 'helped with', 'responsible for', 'assisted in',
  'handled', 'did', 'was part of', 'tried to', 'participated in', 'looked after'
];

export const OUTDATED_ATS_PATTERNS = [
  { phrase: 'curriculum vitae', reason: 'Outdated phrasing in tech; use standard "Resume" title or omit header completely.' },
  { phrase: 'objective:', reason: 'Vague career objectives waste space; replace with a 3-sentence technical summary.' },
  { phrase: 'references available upon request', reason: 'Redundant line taking up valuable bullet space; employers will ask if needed.' },
  { phrase: 'date of birth', reason: 'Personal demographics can bias automated filters; remove personal details.' },
  { phrase: 'marital status', reason: 'Unnecessary personal detail that distracts from technical competency.' },
  { phrase: 'hobbies:', reason: 'Replace casual hobbies with relevant open-source projects or tech community work.' },
  { phrase: 'mother tongue', reason: 'Non-standard field for international ATS parsers.' }
];

export function calculateDeterministicATSScore(resume: ParsedResumeData): ATSScoreBreakdown {
  const textLower = resume.rawText.toLowerCase();

  // 1. FORMATTING & STRUCTURE (Max: 25)
  let formattingScore = 25;
  const formattingDetails: string[] = [];

  if (resume.isScannedPdf || resume.rawText.trim().length < 50) {
    formattingScore = 5;
    formattingDetails.push('CRITICAL: Scanned or unreadable document detected. ATS cannot parse bitmap images.');
  } else {
    // Check non-printable or corrupt characters
    const nonPrintableCount = (resume.rawText.match(/[^\x20-\x7E\t\r\n]/g) || []).length;
    if (nonPrintableCount > 30) {
      formattingScore -= 5;
      formattingDetails.push('Encoding artifacts detected; potential multi-column or embedded shape table.');
    } else {
      formattingDetails.push('Clean plain-text encoding; easily parsable by ATS tokenizers.');
    }

    // Check clear section linebreaks
    const lines = resume.rawText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 15) {
      formattingDetails.push('Well-structured line breaks and distinct paragraphs.');
    } else {
      formattingScore -= 4;
      formattingDetails.push('Text appears collapsed without clear vertical spacing.');
    }

    // Bullet points check
    const hasBullets = /(?:^|\n)\s*[-•*▪]\s+/m.test(resume.rawText) || resume.rawText.includes('•');
    if (hasBullets) {
      formattingDetails.push('Standard bullet points utilized for project and experience logs.');
    } else {
      formattingScore -= 5;
      formattingDetails.push('Missing explicit bullet point delimiters (- or •).');
    }

    // Negative pattern penalty
    let detectedBadPhrases = 0;
    OUTDATED_ATS_PATTERNS.forEach(p => {
      if (textLower.includes(p.phrase)) {
        detectedBadPhrases++;
        formattingScore -= 2;
        formattingDetails.push(`Outdated pattern detected: "${p.phrase}".`);
      }
    });

    if (detectedBadPhrases === 0) {
      formattingDetails.push('Zero outdated resume filler phrases or personal demographic tags.');
    }
  }
  formattingScore = Math.max(0, Math.min(25, formattingScore));

  const escapeRegex = (str: string) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

  // 2. KEYWORDS & SKILLS (Max: 25)
  const matchedKeywords = TECH_KEYWORDS_DICTIONARY.filter(kw => {
    if (kw === 'c++') return /\bc\+\+/i.test(textLower);
    const escaped = escapeRegex(kw);
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(textLower);
  });
  const matchedCount = matchedKeywords.length;
  let keywordsScore = 0;
  const keywordDetails: string[] = [];

  if (matchedCount >= 14) {
    keywordsScore = 25;
    keywordDetails.push(`Exceptional technical keyword density (${matchedCount} core skills recognized).`);
  } else if (matchedCount >= 10) {
    keywordsScore = 21;
    keywordDetails.push(`Strong keyword coverage (${matchedCount} tech skills identified).`);
  } else if (matchedCount >= 7) {
    keywordsScore = 17;
    keywordDetails.push(`Moderate keyword density (${matchedCount} detected; add containerization & cloud tools).`);
  } else if (matchedCount >= 4) {
    keywordsScore = 12;
    keywordDetails.push(`Basic skills found (${matchedCount} keywords). Needs deeper technical stack terms.`);
  } else {
    keywordsScore = 6;
    keywordDetails.push(`Low keyword count (${matchedCount} keywords). Most ATS filters will drop this.`);
  }
  keywordsScore = Math.max(0, Math.min(25, keywordsScore));

  // 3. ESSENTIAL SECTIONS (Max: 15)
  const sectionChecklist = [
    { name: 'Education', regex: /\b(education|academic|b\.tech|bachelor|university|college|cgpa|gpa)\b/i, weight: 3 },
    { name: 'Skills', regex: /\b(skills|technical skills|technologies|proficiencies|tools)\b/i, weight: 3 },
    { name: 'Projects', regex: /\b(projects|academic projects|technical projects|personal projects)\b/i, weight: 3 },
    { name: 'Experience / Training', regex: /\b(experience|internship|training|work experience|employment|leadership)\b/i, weight: 3 },
    { name: 'Summary or Contact', regex: /\b(summary|profile|about|contact|email|phone)\b/i, weight: 3 }
  ];

  let sectionsScore = 0;
  const sectionsFound: string[] = [];
  const sectionsMissing: string[] = [];
  const sectionDetails: string[] = [];

  sectionChecklist.forEach(sec => {
    if (sec.regex.test(textLower)) {
      sectionsScore += sec.weight;
      sectionsFound.push(sec.name);
    } else {
      sectionsMissing.push(sec.name);
    }
  });

  if (sectionsMissing.length === 0) {
    sectionDetails.push('All 5 standard ATS sections detected and properly demarcated.');
  } else {
    sectionDetails.push(`Missing standard section headers: ${sectionsMissing.join(', ')}.`);
  }
  sectionsScore = Math.max(0, Math.min(15, sectionsScore));

  // 4. ACTION VERBS & METRICS (Max: 15)
  const foundVerbs = STRONG_ACTION_VERBS.filter(v => textLower.includes(v));
  // Find numeric metric matches
  const metricMatches = resume.rawText.match(/\b(?:\d+%\s*|\d+k\+|\d+\+?\s*(?:seconds|ms|records|users|trainees|hours|leads|queries))\b/gi) || [];
  const metricsCount = metricMatches.length;
  const verbsCount = foundVerbs.length;

  let actionScore = 0;
  const actionDetails: string[] = [];

  // Verbs component (Max: 8)
  if (verbsCount >= 6) actionScore += 8;
  else if (verbsCount >= 4) actionScore += 6;
  else if (verbsCount >= 2) actionScore += 4;
  else actionScore += 2;

  // Metrics component (Max: 7)
  if (metricsCount >= 3) actionScore += 7;
  else if (metricsCount >= 2) actionScore += 5;
  else if (metricsCount === 1) actionScore += 3;
  else actionScore += 0;

  actionDetails.push(`Found ${verbsCount} strong action verbs (e.g., ${foundVerbs.slice(0, 3).join(', ') || 'none'}).`);
  if (metricsCount >= 2) {
    actionDetails.push(`Found ${metricsCount} quantified impact metrics (${metricMatches.slice(0, 2).join(', ')}).`);
  } else {
    actionDetails.push(`Low quantified impact: only ${metricsCount} metrics. Use the XYZ formula (Accomplished [X] measured by [Y], by doing [Z]).`);
  }
  actionScore = Math.max(0, Math.min(15, actionScore));

  // 5. LENGTH & DENSITY (Max: 10)
  const wordCount = resume.wordCount || resume.rawText.split(/\s+/).filter(Boolean).length;
  let lengthScore = 10;
  let lengthVerdict = 'Ideal Length';
  const lengthDetails: string[] = [];

  if (wordCount >= 350 && wordCount <= 750) {
    lengthScore = 10;
    lengthVerdict = 'Perfect (350–750 words)';
    lengthDetails.push(`Word count is optimal at ${wordCount} words (fits a clean 1-page format).`);
  } else if ((wordCount >= 250 && wordCount < 350) || (wordCount > 750 && wordCount <= 900)) {
    lengthScore = 7;
    lengthVerdict = wordCount < 350 ? 'Slightly Brief' : 'Approaching 2-Page Limit';
    lengthDetails.push(`Word count is ${wordCount}. Target exactly 400–700 words for graduate roles.`);
  } else if (wordCount < 250) {
    lengthScore = 4;
    lengthVerdict = 'Too Short (< 250 words)';
    lengthDetails.push(`Only ${wordCount} words. Insufficient detail for automated filtering.`);
  } else {
    lengthScore = 4;
    lengthVerdict = 'Too Long (> 900 words)';
    lengthDetails.push(`Resume is ${wordCount} words. Freshers should never submit 2+ page resumes.`);
  }

  // 6. CONTACT & PROFESSIONAL LINKS (Max: 10)
  let contactScore = 0;
  const contactDetails: string[] = [];
  const hasEmail = Boolean(resume.email && resume.email !== 'Not detected' && resume.email !== 'Not found');
  const hasPhone = Boolean(resume.phone && resume.phone !== 'Not detected' && resume.phone !== 'Not found');
  const hasLinkedIn = Boolean(
    (resume.links.linkedin && resume.links.linkedin !== 'Not found') || textLower.includes('linkedin.com')
  );
  const hasGitHub = Boolean(
    (resume.links.github && resume.links.github !== 'Not found') || textLower.includes('github.com')
  );

  if (hasEmail) { contactScore += 2.5; contactDetails.push('Professional email detected.'); }
  else { contactDetails.push('Missing valid email address.'); }

  if (hasPhone) { contactScore += 2.5; contactDetails.push('Phone number detected.'); }
  else { contactDetails.push('Missing contact phone number.'); }

  if (hasLinkedIn) { contactScore += 2.5; contactDetails.push('LinkedIn profile link detected.'); }
  else { contactDetails.push('Missing LinkedIn profile link in header.'); }

  if (hasGitHub) { contactScore += 2.5; contactDetails.push('GitHub repository link detected.'); }
  else { contactDetails.push('Missing GitHub portfolio link.'); }

  contactScore = Math.max(0, Math.min(10, contactScore));

  const totalScore = Math.round(formattingScore + keywordsScore + sectionsScore + actionScore + lengthScore + contactScore);

  return {
    formatting: { score: formattingScore, max: 25, details: formattingDetails },
    keywords: { score: keywordsScore, max: 25, details: keywordDetails, matchedCount },
    sections: { score: sectionsScore, max: 15, details: sectionDetails, found: sectionsFound, missing: sectionsMissing },
    actionVerbsAndMetrics: { score: actionScore, max: 15, details: actionDetails, metricsCount, verbsCount },
    length: { score: lengthScore, max: 10, details: lengthDetails, wordCount, verdict: lengthVerdict },
    contactAndLinks: { score: contactScore, max: 10, details: contactDetails, hasEmail, hasPhone, hasLinkedIn, hasGitHub },
    totalScore: Math.min(100, Math.max(0, totalScore))
  };
}

// Generate Precise Code Annotations with Before -> After Fixes using ONLY real extracted resume data
export function generateResumeAnnotations(resume: ParsedResumeData): ResumeAnnotation[] {
  const annotations: ResumeAnnotation[] = [];
  const raw = resume.rawText;
  const lower = raw.toLowerCase();
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  // Use the exact same parsed contact flags as calculateDeterministicATSScore
  const hasEmail = Boolean(resume.email && resume.email !== 'Not detected' && resume.email !== 'Not found');
  const hasPhone = Boolean(resume.phone && resume.phone !== 'Not detected' && resume.phone !== 'Not found');
  const hasLinkedIn = Boolean(
    (resume.links.linkedin && resume.links.linkedin !== 'Not found') || lower.includes('linkedin.com')
  );
  const hasGitHub = Boolean(
    (resume.links.github && resume.links.github !== 'Not found') || lower.includes('github.com')
  );

  // 1. Contact Header Fix (only if LinkedIn, GitHub, Email, or Phone is missing)
  if (!hasLinkedIn || !hasGitHub || !hasEmail || !hasPhone) {
    // Build "Change this" from the actual top contact lines in the uploaded resume
    const headerLines = lines.slice(0, 4).filter(
      l =>
        !/^(?:summary|professional\s+summary|objective|education|skills|technical\s+skills|projects|experience)\b/i.test(
          l
        )
    );
    const actualContactBlock =
      headerLines.length > 0
        ? headerLines.slice(0, 3).join('\n')
        : [
            resume.candidateName,
            hasEmail ? resume.email : null,
            hasPhone ? resume.phone : null,
            hasLinkedIn ? resume.links.linkedin?.replace(/^https?:\/\//, '') : null,
            hasGitHub ? resume.links.github?.replace(/^https?:\/\//, '') : null,
          ]
            .filter(Boolean)
            .join(' | ');

    const realName = resume.candidateName && resume.candidateName !== 'Candidate'
      ? resume.candidateName
      : lines[0] || '[Your Full Name]';
    const emailPart = hasEmail ? resume.email : '[add your email]';
    const phonePart = hasPhone ? resume.phone : '[add your phone number]';
    const linkedinPart = hasLinkedIn
      ? (resume.links.linkedin || '').replace(/^https?:\/\//, '')
      : 'linkedin.com/in/[your-username]';
    const githubPart = hasGitHub
      ? (resume.links.github || '').replace(/^https?:\/\//, '')
      : 'github.com/[your-username]';

    const missingItems: string[] = [];
    if (!hasEmail) missingItems.push('email');
    if (!hasPhone) missingItems.push('phone number');
    if (!hasLinkedIn) missingItems.push('LinkedIn');
    if (!hasGitHub) missingItems.push('GitHub');

    const anchorText =
      (hasEmail ? resume.email : '') ||
      (hasPhone ? resume.phone : '') ||
      headerLines[0] ||
      resume.candidateName;

    annotations.push({
      id: 'fix-contact-header',
      originalText: anchorText,
      type: 'must_fix',
      where: 'Contact Header',
      whatsWrong: `Missing ${missingItems.join(' and ')} in your contact header. Keep your detected details and add ${missingItems.join(' / ')} so recruiters can reach you and inspect your work.`,
      changeFrom: actualContactBlock,
      changeTo: `${realName}\n${emailPart} | ${phonePart}\n${linkedinPart} | ${githubPart}`,
      explanation: 'Include your real contact details and profile links in the top lines of your resume.',
      category: 'contact',
    });
  }

  // 2. Professional Summary / Objective Fix (built strictly from extracted degree, skills, and projects)
  const summaryHeaderIdx = lines.findIndex(l =>
    /^(?:professional\s+summary|summary|career\s+objective|objective|profile|about\s+me)\b/i.test(l)
  );
  let actualSummaryLine = '';
  if (summaryHeaderIdx !== -1) {
    const inlineContent = lines[summaryHeaderIdx]
      .replace(/^(?:professional\s+summary|summary|career\s+objective|objective|profile|about\s+me)\s*[:\-–—]?\s*/i, '')
      .trim();
    if (inlineContent.length > 15) {
      actualSummaryLine = inlineContent;
    } else if (summaryHeaderIdx + 1 < lines.length) {
      const nextLine = lines[summaryHeaderIdx + 1];
      if (!/^(?:education|skills|technical\s+skills|projects|experience)\b/i.test(nextLine)) {
        actualSummaryLine = nextLine;
      }
    }
  }

  const realDegree =
    resume.education.length > 0 && resume.education[0].degree !== 'Degree not specified'
      ? resume.education[0].degree
      : '[your degree and major]';
  const realSkills =
    resume.skills.length >= 2
      ? resume.skills.slice(0, 5).join(', ')
      : resume.skills.length === 1
      ? `${resume.skills[0]}, [add 2-3 core skills]`
      : '[your core technical skills]';
  const realProjectTitle =
    resume.projects.length > 0 && resume.projects[0].title
      ? resume.projects[0].title
      : '[your key project or internship]';

  const hasEnoughSummaryData =
    (resume.education.length > 0 && resume.education[0].degree !== 'Degree not specified') ||
    resume.skills.length >= 2 ||
    resume.projects.length > 0;

  const suggestedSummary = hasEnoughSummaryData
    ? `${realDegree} graduate with hands-on experience in ${realSkills}. Built ${realProjectTitle} achieving [X measurable result]. Seeking entry-level [target role] opportunities.`
    : `[Your degree and major] graduate with hands-on experience in [skill 1, skill 2, skill 3]. Built [project name] achieving [X measurable result]. Seeking entry-level [target role] opportunities.`;

  if (!actualSummaryLine || /objective|looking for|seeking a challenging|reputed|learn and grow/i.test(actualSummaryLine) || actualSummaryLine.split(/\s+/).length < 18) {
    annotations.push({
      id: 'fix-professional-summary',
      originalText: actualSummaryLine ? actualSummaryLine.slice(0, 50) : (lines[0] || resume.candidateName),
      type: actualSummaryLine ? 'improve' : 'must_fix',
      where: 'Professional Summary',
      whatsWrong: actualSummaryLine
        ? 'Strengthen your summary by tying your actual degree, technical skills, and key project to the role you want.'
        : 'No summary section was detected. Add a 2-sentence summary highlighting your degree, skills, and key project.',
      changeFrom: actualSummaryLine || '[No summary or objective section found in uploaded resume]',
      changeTo: suggestedSummary,
      explanation: 'Summarize only the degree, skills, and projects actually in your resume, and fill in your target role.',
      category: 'section',
    });
  }

  // 3. Projects Fix (built strictly from the user's real project line and real skills, with placeholders for metrics)
  let realProjectLine = '';
  let realProjectName = '[what you built]';
  let realProjectTech = resume.skills.length > 0 ? resume.skills.slice(0, 4).join(', ') : '[tech stack from your resume]';

  if (resume.projects.length > 0) {
    const p = resume.projects[0];
    realProjectName = p.title || '[what you built]';
    const rawMatchLine = lines.find(l => l.toLowerCase().includes(p.title.toLowerCase()));
    realProjectLine = rawMatchLine || `${p.title}: ${p.description[0] || ''}`.trim();
    if (p.techStack && p.techStack.length > 0 && p.techStack[0] !== 'Software Project') {
      realProjectTech = p.techStack.join(', ');
    }
  } else {
    const candidateProjLine = lines.find(
      (l, idx) =>
        idx > 1 &&
        l.length > 20 &&
        (/project|built|developed|engineered|created|designed|system|app|application|website|pipeline/i.test(l) ||
          /^[-•*▪]/.test(l))
    );
    if (candidateProjLine) {
      realProjectLine = candidateProjLine;
      const cleaned = candidateProjLine.replace(/^[-•*▪]\s*/, '').trim();
      realProjectName = cleaned.split(/[:|—-]/)[0].trim().slice(0, 60) || '[what you built]';
      const lineTech = TECH_KEYWORDS_DICTIONARY.filter(kw =>
        cleaned.toLowerCase().includes(kw.toLowerCase())
      ).slice(0, 4);
      if (lineTech.length > 0) {
        realProjectTech = lineTech.join(', ');
      }
    }
  }

  if (realProjectLine) {
    const hasQuantifiedMetric = /\b(?:\d+%|\d+k\+|\d+\+?\s*(?:seconds|ms|records|users|trainees|hours|requests|queries))\b/i.test(
      realProjectLine
    );
    if (!hasQuantifiedMetric) {
      annotations.push({
        id: 'fix-quantify-project',
        originalText: realProjectLine.replace(/^[-•*▪]\s*/, '').trim().slice(0, 48),
        type: 'improve',
        where: 'Projects',
        whatsWrong: 'Add numbers to this project: how many users, records, or how much faster?',
        changeFrom: realProjectLine,
        changeTo: `Built ${realProjectName} using ${realProjectTech}, achieving [X% accuracy / latency improvement] across [number of users or records].`,
        explanation: 'Keep your real project and tech stack, and fill in the bracketed placeholders with real numbers you can back up.',
        category: 'metric',
      });
    } else {
      // Even if one project line has a metric, check if another project line in the resume lacks metrics
      const secondUnquantified = lines.find(
        l =>
          l !== realProjectLine &&
          /^[-•*▪]/.test(l) &&
          l.length > 20 &&
          !/\b(?:\d+%|\d+k\+|\d+\+?\s*(?:seconds|ms|records|users|trainees|hours|requests|queries))\b/i.test(l)
      );
      if (secondUnquantified) {
        const cleanedSecond = secondUnquantified.replace(/^[-•*▪]\s*/, '').trim();
        const secondName = cleanedSecond.split(/[:|—-]/)[0].trim().slice(0, 60) || '[what you built]';
        const secondTechList = TECH_KEYWORDS_DICTIONARY.filter(kw =>
          cleanedSecond.toLowerCase().includes(kw.toLowerCase())
        ).slice(0, 4);
        const secondTech =
          secondTechList.length > 0
            ? secondTechList.join(', ')
            : realProjectTech;

        annotations.push({
          id: 'fix-quantify-project',
          originalText: cleanedSecond.slice(0, 48),
          type: 'improve',
          where: 'Projects',
          whatsWrong: 'Add numbers to this project: how many users, records, or how much faster?',
          changeFrom: secondUnquantified,
          changeTo: `Built ${secondName} using ${secondTech}, achieving [X% accuracy / latency improvement] across [number of users or records].`,
          explanation: 'Keep your real project and tech stack, and fill in the bracketed placeholders with real numbers you can back up.',
          category: 'metric',
        });
      }
    }
  } else {
    annotations.push({
      id: 'fix-add-project',
      originalText: lines[0] || resume.candidateName,
      type: 'must_fix',
      where: 'Projects',
      whatsWrong: 'No project bullet points were detected. Add 2–3 technical projects showing what you built and the tech stack used.',
      changeFrom: '[No project bullet lines found in uploaded resume]',
      changeTo: `Built [project name] using ${realProjectTech}, achieving [X measurable result] for [number of users / records].`,
      explanation: 'Describe what you built using your real tech stack and measurable outcomes.',
      category: 'metric',
    });
  }

  // 4. Check for Weak Verbs (using the actual line from the uploaded resume)
  WEAK_PASSIVE_VERBS.forEach((v, idx) => {
    if (lower.includes(v)) {
      const matchedLine =
        lines.find(l => l.toLowerCase().includes(v)) || v;
      const cleanedLine = matchedLine.replace(/^[-•*▪]\s*/, '').trim();
      const rewrittenLine = cleanedLine.replace(
        new RegExp(v, 'i'),
        'Engineered'
      );
      const needsMetricPlaceholder = !/\d+%|\d+k|\d+ms|\d+\+/i.test(cleanedLine);

      annotations.push({
        id: `fix-verb-${idx}`,
        originalText: v,
        type: 'improve',
        where: 'Projects or Experience Bullet Points',
        whatsWrong: `Swap "${v}" for an active verb like "Engineered" or "Built" so your ownership stands out.`,
        changeFrom: matchedLine,
        changeTo: needsMetricPlaceholder
          ? `${rewrittenLine}, achieving [X% improvement / measurable result]`
          : rewrittenLine,
        explanation: 'Start bullet points with an active past-tense verb and only include numbers you can back up.',
        category: 'verb',
      });
    }
  });

  // 5. Check for Outdated Phrases (using the actual line from the uploaded resume)
  OUTDATED_ATS_PATTERNS.forEach((p, idx) => {
    if (lower.includes(p.phrase)) {
      const matchedLine = lines.find(l => l.toLowerCase().includes(p.phrase)) || p.phrase;
      annotations.push({
        id: `fix-phrase-${idx}`,
        originalText: p.phrase,
        type: 'must_fix',
        where: 'Header or Footer',
        whatsWrong: p.reason,
        changeFrom: matchedLine,
        changeTo: '[Remove this line from your resume]',
        explanation: 'Removing outdated filler phrases frees up space for your projects and skills.',
        category: 'formatting',
      });
    }
  });

  // 6. Positive Highlights (Good) — only from skills actually detected in this resume
  if (resume.skills.length > 0) {
    const topSkill = resume.skills[0];
    const matchedSkillLine =
      lines.find(l => l.toLowerCase().includes(topSkill.toLowerCase())) || topSkill;
    annotations.push({
      id: 'highlight-good-skills',
      originalText: topSkill,
      type: 'good',
      where: 'Technical Skills',
      whatsWrong: 'None — Strong keyword match found in your resume.',
      changeFrom: matchedSkillLine,
      changeTo: `${matchedSkillLine} [keep this skill prominent]`,
      explanation: `"${topSkill.toUpperCase()}" was detected in your resume and matches entry-level job requirements.`,
      category: 'keyword',
    });
  }

  return annotations;
}
