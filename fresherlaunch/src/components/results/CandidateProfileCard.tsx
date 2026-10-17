'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ParsedResumeData } from '@/lib/types';

interface CandidateProfileCardProps {
  resumeData: ParsedResumeData;
  atsScore: number;
  onReset: () => void;
  onDownloadDocx: () => void;
  isDownloadingDocx: boolean;
}

const SKILL_BADGE_COLORS = [
  'bg-primary text-ink',
  'bg-mint text-ink',
  'bg-sky text-ink',
  'bg-lime text-ink',
  'bg-tomato text-white',
  'bg-violet text-white',
  'bg-berry text-white',
];

const BLAST_SPARKS = Array.from({ length: 32 }, (_, idx) => {
  const angle = (idx / 32) * Math.PI * 2;
  const dist = 80 + ((idx * 29) % 190);
  const colors = ['#FFD12E', '#FF3E8A', '#00E5A3', '#38BDF8', '#FF4F2E', '#A3E635', '#8B5CF6'];
  return {
    id: idx,
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist * 0.65,
    color: colors[idx % colors.length],
    size: 10 + (idx % 10),
    rot: (idx * 55) % 360,
  };
});

export function CandidateProfileCard({
  resumeData,
  atsScore,
  onReset,
  onDownloadDocx,
  isDownloadingDocx,
}: CandidateProfileCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showBlast, setShowBlast] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setShowBlast(false);
      return;
    }
    setShowBlast(true);
    const timer = setTimeout(() => setShowBlast(false), 1600);
    return () => clearTimeout(timer);
  }, [resumeData.candidateName, prefersReducedMotion]);

  const nameChars = (resumeData.candidateName || 'CANDIDATE').toUpperCase().split('');
  const scoreBadgeBg =
    atsScore >= 75 ? 'bg-mint text-ink' : atsScore >= 50 ? 'bg-primary text-ink' : 'bg-tomato text-white';

  const hasValidEmail = Boolean(
    resumeData.email && resumeData.email !== 'Not found' && resumeData.email !== 'Not detected'
  );
  const hasValidPhone = Boolean(
    resumeData.phone && resumeData.phone !== 'Not found' && resumeData.phone !== 'Not detected'
  );
  const hasValidLinkedIn = Boolean(
    resumeData.links.linkedin && resumeData.links.linkedin !== 'Not found'
  );
  const hasValidGitHub = Boolean(
    resumeData.links.github && resumeData.links.github !== 'Not found'
  );

  return (
    <section className="relative mb-12 pt-4">
      {/* Celebratory Blast on Resume Upload Completion (skipped when prefers-reduced-motion) */}
      <AnimatePresence>
        {showBlast && !prefersReducedMotion && (
          <div className="pointer-events-none absolute inset-x-0 top-16 flex items-center justify-center z-30 overflow-visible">
            <motion.div
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 2.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute w-36 h-36 rounded-full border-3 border-primary"
            />
            {BLAST_SPARKS.map(s => (
              <motion.span
                key={s.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: s.dx,
                  y: s.dy,
                  scale: [0, 1.3, 0.85, 0],
                  rotate: s.rot,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.95, ease: 'easeOut' }}
                style={{ width: s.size, height: s.size, backgroundColor: s.color }}
                className="absolute border-3 border-ink rounded-neo shadow-ink"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Candidate Dossier Card */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' }}
        className="border-3 border-ink rounded-neo bg-canvas shadow-ink overflow-hidden"
      >
        {/* Header Row: Candidate Name & Quick Status */}
        <div className="p-5 sm:p-8 bg-paper-dark border-b-3 border-ink flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="px-3 py-1 bg-mint text-ink border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase shadow-ink">
                ✓ Resume Parsed
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!prefersReducedMotion) setShowBlast(true);
                }}
                className="btn-pressable px-3 py-1 bg-berry text-white border-3 border-ink rounded-neo font-mono text-xs font-bold"
              >
                Again! 🎉
              </button>
            </div>

            {/* Candidate Name Letter Tiles */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 my-2">
              {nameChars.map((ch, idx) =>
                ch === ' ' ? (
                  <span key={idx} className="w-2.5 sm:w-4 inline-block" />
                ) : (
                  <motion.span
                    key={idx}
                    initial={prefersReducedMotion ? false : { y: -30, scale: 0, opacity: 0 }}
                    animate={
                      prefersReducedMotion
                        ? { y: 0, scale: 1, opacity: 1 }
                        : {
                            y: [-30, 0, -8, 0],
                            scale: [0, 1.2, 0.85, 1],
                            opacity: 1,
                          }
                    }
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.75,
                            delay: idx * 0.03,
                            ease: 'easeInOut',
                          }
                    }
                    className={`inline-flex items-center justify-center px-2 sm:px-2.5 py-0.5 sm:py-1 border-3 border-ink rounded-neo font-headline font-bold text-xl sm:text-3xl shadow-ink ${
                      SKILL_BADGE_COLORS[idx % SKILL_BADGE_COLORS.length]
                    }`}
                  >
                    {ch}
                  </motion.span>
                )
              )}
            </div>

            <p className="font-body text-base text-ink mt-2">
              Extracted from your resume •{' '}
              <span className="font-mono font-bold">{resumeData.wordCount} words</span> •{' '}
              <span className="font-mono font-bold">{resumeData.skills.length} skills</span> found
            </p>
          </div>

          {/* Right Quick Summary Badge + Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <div className={`px-5 py-3 border-3 border-ink rounded-neo shadow-ink text-center ${scoreBadgeBg}`}>
              <span className="block font-mono text-xs font-bold uppercase">ATS Score</span>
              <span className="font-mono font-bold text-3xl sm:text-4xl">{atsScore}</span>
              <span className="font-mono text-sm font-bold">/100</span>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <button
                type="button"
                onClick={onDownloadDocx}
                disabled={isDownloadingDocx}
                className="btn-pressable px-4 py-2 bg-primary text-ink border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase disabled:opacity-50"
              >
                {isDownloadingDocx ? 'Generating DOCX...' : '↓ Download ATS Resume'}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="btn-pressable px-4 py-2 bg-canvas text-ink border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase"
              >
                ↺ Upload Another Resume
              </button>
            </div>
          </div>
        </div>

        {/* Contact Details Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b-3 border-ink bg-canvas divide-y-3 sm:divide-y-0 sm:divide-x-3 divide-ink">
          <div className="p-4 flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 shrink-0 flex items-center justify-center bg-primary border-3 border-ink rounded-neo font-mono font-bold text-xs shadow-ink">
              @
            </span>
            <div className="min-w-0">
              <span className="block font-mono text-xs uppercase text-ink-muted">Email</span>
              {hasValidEmail ? (
                <span className="font-mono text-xs font-bold text-ink truncate block">
                  {resumeData.email}
                </span>
              ) : (
                <span className="font-mono text-xs text-ink-muted italic block">Not found</span>
              )}
            </div>
          </div>

          <div className="p-4 flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 shrink-0 flex items-center justify-center bg-mint border-3 border-ink rounded-neo font-mono font-bold text-xs shadow-ink">
              ☎
            </span>
            <div className="min-w-0">
              <span className="block font-mono text-xs uppercase text-ink-muted">Phone</span>
              {hasValidPhone ? (
                <span className="font-mono text-xs font-bold text-ink truncate block">
                  {resumeData.phone}
                </span>
              ) : (
                <span className="font-mono text-xs text-ink-muted italic block">Not found</span>
              )}
            </div>
          </div>

          <div className="p-4 flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 shrink-0 flex items-center justify-center bg-primary border-3 border-ink rounded-neo font-mono font-bold text-xs shadow-ink">
              in
            </span>
            <div className="min-w-0">
              <span className="block font-mono text-xs uppercase text-ink-muted">LinkedIn</span>
              {hasValidLinkedIn ? (
                /^https?:\/\//i.test(resumeData.links.linkedin || '') ? (
                  <a
                    href={resumeData.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-bold text-ink underline truncate block"
                  >
                    {resumeData.links.linkedin!.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <span className="font-mono text-xs font-bold text-ink truncate block">
                    {resumeData.links.linkedin}
                  </span>
                )
              ) : (
                <span className="font-mono text-xs text-ink-muted italic block">Not found</span>
              )}
            </div>
          </div>

          <div className="p-4 flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 shrink-0 flex items-center justify-center bg-mint border-3 border-ink rounded-neo font-mono font-bold text-xs shadow-ink">
              {'<>'}
            </span>
            <div className="min-w-0">
              <span className="block font-mono text-xs uppercase text-ink-muted">GitHub</span>
              {hasValidGitHub ? (
                /^https?:\/\//i.test(resumeData.links.github || '') ? (
                  <a
                    href={resumeData.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-bold text-ink underline truncate block"
                  >
                    {resumeData.links.github!.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <span className="font-mono text-xs font-bold text-ink truncate block">
                    {resumeData.links.github}
                  </span>
                )
              ) : (
                <span className="font-mono text-xs text-ink-muted italic block">Not found</span>
              )}
            </div>
          </div>
        </div>

        {/* 3-Column Extracted Resume Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y-3 lg:divide-y-0 lg:divide-x-3 divide-ink bg-canvas">
          {/* Column 1: Education & Sections */}
          <div className="p-5 sm:p-6">
            <h3 className="font-headline font-bold text-lg text-ink mb-3">
              Education & Sections
            </h3>

            {resumeData.education.length > 0 ? (
              resumeData.education.map((edu, i) => (
                <div key={i} className="p-4 bg-paper-dark border-3 border-ink rounded-neo shadow-ink mb-4">
                  <h4 className="font-headline font-bold text-base text-ink leading-snug">
                    {edu.degree}
                  </h4>
                  <p className="font-body text-base text-ink-muted mt-1">{edu.institution}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {edu.year && (
                      <span className="px-2.5 py-1 bg-primary border-3 border-ink rounded-neo font-mono text-xs font-bold">
                        Batch: {edu.year}
                      </span>
                    )}
                    {edu.score && (
                      <span className="px-2.5 py-1 bg-mint border-3 border-ink rounded-neo font-mono text-xs font-bold">
                        Score: {edu.score}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="font-mono text-xs text-ink-muted italic mb-4">Not found</p>
            )}

            <div className="mt-4">
              <span className="block font-mono text-xs font-bold uppercase text-ink-muted mb-2">
                Sections Detected ({resumeData.sectionsFound.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {resumeData.sectionsFound.length > 0 ? (
                  resumeData.sectionsFound.map(sec => (
                    <span
                      key={sec}
                      className="px-2.5 py-1 bg-mint border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase"
                    >
                      ✓ {sec}
                    </span>
                  ))
                ) : (
                  <span className="font-mono text-xs text-ink-muted italic">Not found</span>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Skills we found */}
          <div className="p-5 sm:p-6">
            <h3 className="font-headline font-bold text-lg text-ink mb-2">
              Skills we found
            </h3>

            <p className="font-body text-base text-ink-muted mb-4">
              Matched from your resume and used to rank jobs below:
            </p>

            <div className="flex flex-wrap gap-2">
              {resumeData.skills.length > 0 ? (
                resumeData.skills.map((skill, idx) => (
                  <span
                    key={skill}
                    className={`px-3 py-1 border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase shadow-ink ${
                      SKILL_BADGE_COLORS[idx % SKILL_BADGE_COLORS.length]
                    }`}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="font-mono text-xs text-ink-muted italic">Not found</span>
              )}
            </div>
          </div>

          {/* Column 3: Projects & Experience */}
          <div className="p-5 sm:p-6">
            <h3 className="font-headline font-bold text-lg text-ink mb-3">
              Projects & Experience
            </h3>

            <div className="space-y-3">
              {resumeData.projects.map((proj, idx) => (
                <div key={idx} className="p-3.5 bg-paper-dark border-3 border-ink rounded-neo shadow-ink">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-headline font-bold text-base text-ink">{proj.title}</h4>
                    <span className="px-2 py-0.5 bg-primary border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase">
                      Project
                    </span>
                  </div>
                  <p className="font-mono text-xs text-ink font-bold mt-1">
                    {proj.techStack.join(' • ')}
                  </p>
                  {proj.description[0] && (
                    <p className="font-body text-base text-ink-muted mt-1">
                      {proj.description[0]}
                    </p>
                  )}
                </div>
              ))}

              {resumeData.experience.map((exp, idx) => (
                <div key={idx} className="p-3.5 bg-paper-dark border-3 border-ink rounded-neo shadow-ink">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-headline font-bold text-base text-ink">{exp.role}</h4>
                    <span className="px-2 py-0.5 bg-mint border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase">
                      Experience
                    </span>
                  </div>
                  <p className="font-mono text-xs text-ink-muted mt-1">
                    {exp.company} ({exp.duration})
                  </p>
                </div>
              ))}

              {resumeData.projects.length === 0 && resumeData.experience.length === 0 && (
                <p className="font-mono text-xs text-ink-muted italic">Not found</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
