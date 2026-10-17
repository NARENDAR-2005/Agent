export interface ATSScoreBreakdown {
  formatting: { score: number; max: 25; details: string[] };
  keywords: { score: number; max: 25; details: string[]; matchedCount: number };
  sections: { score: number; max: 15; details: string[]; found: string[]; missing: string[] };
  actionVerbsAndMetrics: { score: number; max: 15; details: string[]; metricsCount: number; verbsCount: number };
  length: { score: number; max: 10; details: string[]; wordCount: number; verdict: string };
  contactAndLinks: { score: number; max: 10; details: string[]; hasEmail: boolean; hasPhone: boolean; hasLinkedIn: boolean; hasGitHub: boolean };
  totalScore: number;
}

export type HighlightType = 'must_fix' | 'improve' | 'good';

export interface ResumeAnnotation {
  id: string;
  originalText: string;
  type: HighlightType;
  where: string;
  whatsWrong: string;
  changeFrom: string;
  changeTo: string;
  explanation: string;
  category: 'formatting' | 'keyword' | 'metric' | 'verb' | 'contact' | 'section';
}

export interface ParsedResumeData {
  rawText: string;
  candidateName: string;
  email: string;
  phone: string;
  links: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
    score?: string;
  }>;
  skills: string[];
  projects: Array<{
    title: string;
    techStack: string[];
    description: string[];
  }>;
  experience: Array<{
    role: string;
    company: string;
    duration: string;
    description: string[];
  }>;
  sectionsFound: string[];
  wordCount: number;
  isScannedPdf?: boolean;
}

export interface AdzunaJob {
  id: string;
  title: string;
  company: string;
  location: string;
  postedTime: string;
  created: string;
  description: string;
  salary?: string;
  redirectUrl: string;
  matchPercentage: number;
  matchedSkills: string[];
  isEntryLevel: boolean;
  category?: string;
}

export interface JobFilterState {
  timeframe: '24h' | '3d' | '7d' | '30d';
  location: string;
  remoteOnly: boolean;
  minMatch: number;
  searchQuery: string;
}
