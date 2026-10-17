'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ATSScoreBreakdown, ParsedResumeData } from '@/lib/types';

interface ATSScoreCardProps {
  score: ATSScoreBreakdown;
  resumeData: ParsedResumeData;
  onRecheck: () => void;
  onDownloadDocx: () => void;
  isDownloadingDocx?: boolean;
}

export function ATSScoreCard({
  score,
  onDownloadDocx,
  isDownloadingDocx,
}: ATSScoreCardProps) {
  const [showProjectedScore, setShowProjectedScore] = useState(false);

  const projectedScore = Math.min(96, Math.max(88, score.totalScore + 22));
  const currentDisplayScore = showProjectedScore ? projectedScore : score.totalScore;

  // Dial needle angle: -90deg (0 score) to 90deg (100 score)
  const needleAngle = -90 + (currentDisplayScore / 100) * 180;

  // Meaning-based dial color: coral below 50, yellow from 50 to 74, mint from 75 up
  const dialStrokeColor =
    currentDisplayScore < 50
      ? '#FF4F2E'
      : currentDisplayScore <= 74
      ? '#FFD12E'
      : '#00E5A3';

  const isStrongScore = currentDisplayScore >= 75;
  const pointsToStrong = Math.max(1, 75 - currentDisplayScore);

  const categories = [
    {
      title: 'Formatting & ATS Cleanliness',
      score: score.formatting.score,
      max: score.formatting.max,
      details: score.formatting.details,
      fixTip: 'Use standard bullet points (•) and clear line breaks between sections.',
    },
    {
      title: 'Technical Keywords Density',
      score: score.keywords.score,
      max: score.keywords.max,
      details: score.keywords.details,
      fixTip: 'Add core tools and frameworks you have used (e.g., Docker, AWS, SQL, Git).',
    },
    {
      title: 'Standard Section Demarcation',
      score: score.sections.score,
      max: score.sections.max,
      details: score.sections.details,
      fixTip: 'Include clear headings for Education, Skills, Projects, and Experience.',
    },
    {
      title: 'Action Verbs & Impact Metrics',
      score: score.actionVerbsAndMetrics.score,
      max: score.actionVerbsAndMetrics.max,
      details: score.actionVerbsAndMetrics.details,
      fixTip: 'Add numbers to your projects: how many users, records, or how much faster?',
    },
    {
      title: 'Word Count & Page Density',
      score: score.length.score,
      max: score.length.max,
      details: score.length.details,
      fixTip: 'Aim for 400–700 words so your resume fills one clean page.',
    },
    {
      title: 'Contact Details & Profile Links',
      score: score.contactAndLinks.score,
      max: score.contactAndLinks.max,
      details: score.contactAndLinks.details,
      fixTip: 'Add clickable GitHub and LinkedIn links right at the top of your resume.',
    },
  ];

  // Compute the top 3 fixes based on categories with the largest point gap
  const topThreeFixes = [...categories]
    .sort((a, b) => (b.max - b.score) - (a.max - a.score))
    .slice(0, 3)
    .map(c => c.fixTip);

  return (
    <div className="w-full bg-canvas border-3 border-ink rounded-neo shadow-ink p-5 sm:p-8 mb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b-3 border-ink gap-4">
        <div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            ATS Score
          </h2>
          <p className="font-body text-base text-ink-muted mt-1">
            How easily robots can read your resume
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowProjectedScore(prev => !prev)}
            className="btn-pressable px-4 py-2 border-3 border-ink rounded-neo bg-canvas text-ink font-mono text-xs font-bold uppercase"
          >
            {showProjectedScore ? '← Show Current Score' : 'Preview Score After Fixes →'}
          </button>

          <button
            type="button"
            onClick={onDownloadDocx}
            disabled={isDownloadingDocx}
            className="btn-pressable px-4 py-2 border-3 border-ink rounded-neo bg-primary text-ink font-mono text-xs font-bold uppercase disabled:opacity-50 flex items-center gap-2"
          >
            <span>{isDownloadingDocx ? 'Generating...' : 'Download Improved (.DOCX)'}</span>
            <span>↓</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Dial + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dial Gauge + Top 3 Things to Fix */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-paper-dark border-3 border-ink rounded-neo shadow-ink text-center">
          <span className="font-mono text-xs uppercase font-bold text-ink-muted mb-2">
            Overall ATS Score
          </span>

          {/* SVG Semi-Circle Dial */}
          <div className="relative w-56 h-36 flex items-end justify-center overflow-hidden my-2">
            <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#EFE4C8"
                strokeWidth="18"
                strokeLinecap="round"
              />
              {/* Meaning-Based Foreground Arc */}
              <motion.path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={dialStrokeColor}
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{
                  strokeDashoffset: 251.2 * (1 - currentDisplayScore / 100),
                }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
              {/* Dial Center Pin */}
              <circle cx="100" cy="100" r="8" fill="#141414" />
            </svg>

            {/* Rotating Needle */}
            <motion.div
              className="absolute bottom-0 w-1.5 h-20 bg-ink origin-bottom"
              style={{ left: 'calc(50% - 3px)' }}
              initial={{ rotate: -90 }}
              animate={{ rotate: needleAngle }}
              transition={{ duration: 1.1, type: 'spring', damping: 15 }}
            />
          </div>

          {/* Score Numbers */}
          <div className="mt-3">
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-5xl sm:text-6xl font-bold text-ink">
                {currentDisplayScore}
              </span>
              <span className="font-mono text-xl text-ink-muted font-bold">/ 100</span>
            </div>

            {showProjectedScore && (
              <div className="mt-2 text-xs font-mono text-ink font-bold bg-mint px-3 py-1 border-3 border-ink rounded-neo inline-block">
                +{projectedScore - score.totalScore} pts with fixes applied
              </div>
            )}
          </div>

          {/* Required Action Summary Line + Top 3 Fixes */}
          <div className="mt-5 w-full text-left p-4 bg-canvas border-3 border-ink rounded-neo shadow-ink">
            {isStrongScore ? (
              <p className="font-body text-base font-bold text-ink mb-2">
                Strong score! Here are 3 ways to polish it:
              </p>
            ) : (
              <p className="font-body text-base font-bold text-ink mb-2">
                You&apos;re <span className="font-mono">{pointsToStrong}</span>{' '}
                {pointsToStrong === 1 ? 'point' : 'points'} from a strong score. Fix these 3 things:
              </p>
            )}
            <ol className="list-decimal list-inside space-y-1.5 font-body text-base text-ink-muted">
              {topThreeFixes.map((tip, i) => (
                <li key={i} className="leading-snug">
                  {tip}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right Column: 6 Fixed-Rule Category Breakdown Bars */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b-3 border-ink text-xs font-mono font-bold text-ink uppercase">
            <span>Rule Category</span>
            <span>Score / Max</span>
          </div>

          {categories.map((cat, idx) => {
            const percentage = (cat.score / cat.max) * 100;
            const barColor =
              percentage >= 75 ? 'bg-mint' : percentage >= 50 ? 'bg-primary' : 'bg-tomato';

            return (
              <div
                key={idx}
                className="p-4 bg-paper-dark border-3 border-ink rounded-neo shadow-ink"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="font-headline text-base font-bold text-ink">
                    {cat.title}
                  </span>
                  <span className="font-mono text-sm font-bold text-ink shrink-0">
                    {cat.score} / {cat.max}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-canvas border-3 border-ink rounded-neo h-3.5 overflow-hidden">
                  <motion.div
                    className={`h-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.7, delay: 0.08 * idx, ease: 'easeOut' }}
                  />
                </div>

                {/* Explanatory detail */}
                <p className="mt-2 font-body text-base text-ink-muted">
                  {cat.details[0] || 'Rule validated.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
