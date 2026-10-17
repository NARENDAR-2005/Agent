'use client';

import React, { useState } from 'react';
import { WelcomeHero } from '@/components/welcome/WelcomeHero';
import { CandidateProfileCard } from '@/components/results/CandidateProfileCard';
import { ATSScoreCard } from '@/components/results/ATSScoreCard';
import { AnnotatedResume } from '@/components/resume/AnnotatedResume';
import { JobsSection } from '@/components/jobs/JobsSection';
import { ParsedResumeData, ATSScoreBreakdown, ResumeAnnotation } from '@/lib/types';

export default function FresherLaunchPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [resumeData, setResumeData] = useState<ParsedResumeData | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ATSScoreBreakdown | null>(null);
  const [annotations, setAnnotations] = useState<ResumeAnnotation[]>([]);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const runProgressSteps = async () => {
    setCurrentStep(0);
    await new Promise(r => setTimeout(r, 450));
    setCurrentStep(1);
    await new Promise(r => setTimeout(r, 500));
    setCurrentStep(2);
    await new Promise(r => setTimeout(r, 500));
    setCurrentStep(3);
    await new Promise(r => setTimeout(r, 450));
  };

  const handleProcessResume = async (file?: File, pastedText?: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setIsAnalyzing(false);
        setErrorMsg('File size exceeds 4 MB. Please upload a smaller resume document.');
        return;
      }
      if (file.size === 0) {
        setIsAnalyzing(false);
        setErrorMsg('The uploaded file is empty. Please upload a valid resume.');
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'doc') {
        setIsAnalyzing(false);
        setErrorMsg('Legacy .doc format is not supported. Please save as .docx or PDF.');
        return;
      }
      if (!['pdf', 'docx', 'txt', 'md'].includes(ext)) {
        setIsAnalyzing(false);
        setErrorMsg('Unsupported file format. Please upload a PDF, DOCX, or TXT file.');
        return;
      }
    }

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (pastedText) formData.append('pastedText', pastedText);

      const progressPromise = runProgressSteps();

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      await progressPromise;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "We couldn't read this file. Try pasting the text instead.");
      }

      setResumeData(data.resumeData);
      setScoreBreakdown(data.scoreBreakdown);
      setAnnotations(data.annotations || []);
      setIsAnalyzing(false);

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 80);
    } catch (err: any) {
      console.error(err);
      const isNetwork = err?.name === 'TypeError' || (err?.message && /fetch|network|failed to fetch/i.test(err.message));
      setErrorMsg(
        isNetwork
          ? 'Unable to reach the server. Please check your connection and try again.'
          : (err?.message || "We couldn't read this file. Try pasting the text instead.")
      );
      setIsAnalyzing(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!resumeData) return;
    setIsDownloadingDocx(true);
    try {
      const res = await fetch('/api/download-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData),
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resumeData.candidateName || 'Fresher').replace(/\s+/g, '_')}_Improved_ATS_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to generate DOCX file.');
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleReset = () => {
    setResumeData(null);
    setScoreBreakdown(null);
    setAnnotations([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-canvas text-ink pb-24">
      {/* Sticky Navigation when in Results Mode */}
      {resumeData && (
        <nav className="sticky top-0 z-50 bg-canvas border-b-3 border-ink px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-ink">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-neo bg-primary border-3 border-ink inline-block" />
            <span className="font-headline font-bold text-xl text-ink">FresherLaunch</span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-primary border-3 border-ink rounded-neo font-mono text-xs font-bold text-ink uppercase">
              {resumeData.candidateName}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="btn-pressable px-3.5 py-1.5 border-3 border-ink rounded-neo bg-canvas text-ink font-mono text-xs font-bold uppercase"
            >
              ← Upload Another
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isDownloadingDocx}
              className="btn-pressable px-3.5 py-1.5 border-3 border-ink rounded-neo bg-primary text-ink font-mono text-xs font-bold uppercase disabled:opacity-50"
            >
              {isDownloadingDocx ? 'Exporting...' : 'Export DOCX ↓'}
            </button>
          </div>
        </nav>
      )}

      {/* Screen 1 & 2: Welcome Hero & Interactive Drop Box */}
      {!resumeData && (
        <WelcomeHero
          onFileSelect={file => handleProcessResume(file, undefined)}
          onPasteSubmit={text => handleProcessResume(undefined, text)}
          isAnalyzing={isAnalyzing}
          currentStep={currentStep}
        />
      )}

      {/* Parse Failure Banner */}
      {errorMsg && (
        <div className="max-w-xl mx-auto my-6 px-4">
          <div className="p-6 bg-canvas border-3 border-ink rounded-neo shadow-ink text-center">
            <span className="inline-block px-3 py-1 bg-berry text-white border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase mb-3">
              Upload Notice
            </span>
            <p className="font-body text-base font-bold text-ink mb-4">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="btn-pressable px-4 py-2 bg-primary text-ink border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Screen 3 & 4: Candidate Profile Card + ATS Score + Annotated Fixes + Matched Jobs */}
      {resumeData && scoreBreakdown && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          {resumeData.isScannedPdf && (
            <div className="p-4 bg-primary/30 border-3 border-ink rounded-neo shadow-ink mb-6 text-center font-body text-base text-ink">
              <strong>Note:</strong> We couldn&apos;t read this file cleanly because it looks like a scanned image. Try pasting the text instead, or download our ATS-safe DOCX below.
            </div>
          )}

          {/* 0. Candidate Name & Full Resume Details Card */}
          <CandidateProfileCard
            resumeData={resumeData}
            atsScore={scoreBreakdown.totalScore}
            onReset={handleReset}
            onDownloadDocx={handleDownloadDocx}
            isDownloadingDocx={isDownloadingDocx}
          />

          {/* 1. ATS Score Card with Dial and 6 Rule Bars */}
          <ATSScoreCard
            score={scoreBreakdown}
            resumeData={resumeData}
            onRecheck={() => {}}
            onDownloadDocx={handleDownloadDocx}
            isDownloadingDocx={isDownloadingDocx}
          />

          {/* 2. Annotated Resume Fixes ("What to fix, and where") */}
          <AnnotatedResume
            resumeData={resumeData}
            annotations={annotations}
          />

          {/* 3. Live Verified Jobs Feed ("Jobs that fit you right now") */}
          <JobsSection
            candidateSkills={
              resumeData.skills.length > 0
                ? resumeData.skills
                : ['python', 'flask', 'sql', 'linux', 'git']
            }
          />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t-3 border-ink max-w-5xl mx-auto px-4 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-ink-muted gap-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-primary border-3 border-ink rounded-neo font-bold text-ink">
            FresherLaunch
          </span>
          <span>— Built for fresh graduates.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>Deterministic Rules</span>
          <span>•</span>
          <span>Your resume is never saved</span>
        </div>
      </footer>
    </main>
  );
}
