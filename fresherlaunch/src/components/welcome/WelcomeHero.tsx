'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SquiggleUnderline, AsteriskIcon } from '../ui/SVGs';

interface WelcomeHeroProps {
  onFileSelect: (file: File) => void;
  onPasteSubmit: (text: string) => void;
  isAnalyzing: boolean;
  currentStep: number;
}

const HERO_SUBLINE = "Let's get your first job moving.";
const PROGRESS_STEPS = [
  { label: 'Reading' },
  { label: 'Checking ATS' },
  { label: 'Scoring' },
  { label: 'Finding jobs' },
];

const LETTER_PALETTE = [
  { bg: '#FFD12E', text: '#141414' }, // Sunburst Yellow
  { bg: '#FF3E8A', text: '#FFFFFF' }, // Berry Pink
  { bg: '#00E5A3', text: '#141414' }, // Electric Mint
  { bg: '#38BDF8', text: '#141414' }, // Sky Pop
  { bg: '#FF4F2E', text: '#FFFFFF' }, // Tomato Coral
  { bg: '#A3E635', text: '#141414' }, // Lime Pop
  { bg: '#8B5CF6', text: '#FFFFFF' }, // Vivid Violet
];

interface BlastParticle {
  id: number;
  dx: number;
  dy: number;
  rot: number;
  color: string;
  shape: 'square' | 'circle' | 'diamond';
  size: number;
  delay: number;
}

const PARTICLE_COLORS = ['#FFD12E', '#FF3E8A', '#00E5A3', '#38BDF8', '#FF4F2E', '#A3E635', '#8B5CF6'];

function createBlastParticles(count = 42): BlastParticle[] {
  return Array.from({ length: count }, (_, idx) => {
    const angle = (idx / count) * Math.PI * 2 + (idx % 3) * 0.18;
    const distance = 90 + ((idx * 35) % 220);
    const shapes: Array<'square' | 'circle' | 'diamond'> = ['square', 'circle', 'diamond'];
    return {
      id: idx,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance * 0.72,
      rot: ((idx * 73) % 540) - 270,
      color: PARTICLE_COLORS[idx % PARTICLE_COLORS.length],
      shape: shapes[idx % shapes.length],
      size: 10 + ((idx * 11) % 12),
      delay: (idx % 5) * 0.02,
    };
  });
}

const BLAST_PARTICLES = createBlastParticles(42);

const SAMPLE_FRESHER_RESUME = `Sample Fresher
Email: sample.fresher@example.com | Phone: +91 98765 43210 | github.com/sample-fresher | linkedin.com/in/sample-fresher

SUMMARY
Final-year B.Tech Computer Science graduate with hands-on experience building Python backend services, REST APIs, and machine learning pipelines.

EDUCATION
B.Tech in Computer Science & Engineering, National Institute of Technology — 2026 | CGPA: 8.2

TECHNICAL SKILLS
Python, Flask, SQL, MySQL, REST API, OpenCV, YOLO, LSTM, Machine Learning, Linux, Git, GitHub, OOP, Data Structures

PROJECTS
• Smart Traffic Vision System: Engineered a real-time vehicle detection and tracking pipeline using Python and OpenCV.
• TaskFlow API Server: Worked on developing the backend features with Flask, MySQL, and REST APIs handling 500+ task records under 180ms latency.

EXPERIENCE
• Software Engineering Intern — Acme Tech Labs (Jun 2025 – Aug 2025): Collaborated with a 6-member engineering team and automated data validation scripts in Python, reducing manual triage time by 25%.`;

export function WelcomeHero({ onFileSelect, onPasteSubmit, isAnalyzing, currentStep }: WelcomeHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isDragOver, setIsDragOver] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [showTypewriterCursor, setShowTypewriterCursor] = useState(true);
  const [showDropZone, setShowDropZone] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [animCycle, setAnimCycle] = useState(0);
  const [isBlasting, setIsBlasting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerInOutAndBlast = useCallback(() => {
    if (prefersReducedMotion) {
      setIsBlasting(false);
      setTypewriterText(HERO_SUBLINE);
      setShowDropZone(true);
      return () => {};
    }

    setIsBlasting(false);
    setAnimCycle(prev => prev + 1);

    const blastTimer = setTimeout(() => {
      setIsBlasting(true);
    }, 1000);

    const clearBlastTimer = setTimeout(() => {
      setIsBlasting(false);
    }, 2300);

    return () => {
      clearTimeout(blastTimer);
      clearTimeout(clearBlastTimer);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypewriterText(HERO_SUBLINE);
      setShowDropZone(true);
      return;
    }

    const cleanupBlast = triggerInOutAndBlast();

    const timer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < HERO_SUBLINE.length) {
          setTypewriterText(HERO_SUBLINE.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setShowDropZone(true);
        }
      }, 30);
      return () => clearInterval(interval);
    }, 1150);

    return () => {
      cleanupBlast();
      clearTimeout(timer);
    };
  }, [triggerInOutAndBlast, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const blinkInterval = setInterval(() => {
      setShowTypewriterCursor(prev => !prev);
    }, 500);
    return () => clearInterval(blinkInterval);
  }, [prefersReducedMotion]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (pastedText.trim().length > 40) {
      onPasteSubmit(pastedText.trim());
    }
  };

  const titleLines = [
    { word: 'WELCOME,', offset: 0 },
    { word: 'FRESHER', offset: 8 },
  ];

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 py-8 max-w-5xl mx-auto text-ink overflow-hidden">
      {/* 3 Floating Stickers in Hero Only */}
      <div className="pointer-events-none hidden lg:block">
        <motion.div
          animate={prefersReducedMotion ? undefined : { y: [0, -6, 0], rotate: [-4, -2, -4] }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-24 left-6 bg-primary border-3 border-ink rounded-neo px-3 py-1.5 shadow-ink font-mono text-xs font-bold uppercase"
        >
          ★ ATS Rule Engine
        </motion.div>
        <motion.div
          animate={prefersReducedMotion ? undefined : { y: [0, 6, 0], rotate: [4, 6, 4] }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-28 right-6 bg-berry text-white border-3 border-ink rounded-neo px-3 py-1.5 shadow-ink font-mono text-xs font-bold uppercase"
        >
          ⚡ Line-by-Line Fixes
        </motion.div>
        <motion.div
          animate={prefersReducedMotion ? undefined : { y: [0, -5, 0], rotate: [2, -2, 2] }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-24 left-10 bg-mint text-ink border-3 border-ink rounded-neo px-3 py-1.5 shadow-ink font-mono text-xs font-bold uppercase"
        >
          ✓ Zero Data Stored
        </motion.div>
      </div>

      {/* Top Editorial Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b-3 border-ink">
        <div className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded-neo bg-primary border-3 border-ink inline-block" />
          <span className="font-headline font-bold text-xl sm:text-2xl tracking-tight text-ink">
            FresherLaunch
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={triggerInOutAndBlast}
            className="btn-pressable px-3.5 py-1.5 bg-berry text-white border-3 border-ink rounded-neo font-mono text-xs font-bold"
          >
            Again! 🎉
          </button>
        </div>
      </div>

      {/* Main Headline: Letters Coming IN & OUT -> Then BLAST Explosion */}
      <div
        key={animCycle}
        onClick={triggerInOutAndBlast}
        title="Click to replay animation"
        className="relative text-center my-3 py-3 px-1 cursor-pointer select-none w-full"
      >
        {/* Shockwave Rings & Blast Particles (skipped when prefers-reduced-motion) */}
        <AnimatePresence>
          {isBlasting && !prefersReducedMotion && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20 overflow-visible">
              <motion.div
                initial={{ scale: 0.1, opacity: 1 }}
                animate={{ scale: 3.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-40 h-40 rounded-full border-3 border-berry"
              />
              <motion.div
                initial={{ scale: 0.1, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
                className="absolute w-36 h-36 rounded-full border-3 border-primary"
              />

              {BLAST_PARTICLES.map(p => (
                <motion.span
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    x: p.dx,
                    y: p.dy,
                    scale: [0, 1.35, 1, 0],
                    rotate: p.rot,
                    opacity: [1, 1, 0.9, 0],
                  }}
                  transition={{
                    duration: 1.0,
                    delay: p.delay,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                  }}
                  className={`absolute border-3 border-ink shadow-ink ${
                    p.shape === 'circle'
                      ? 'rounded-full'
                      : p.shape === 'diamond'
                      ? 'rotate-45'
                      : 'rounded-neo'
                  }`}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Animated Letter Tiles — Sized cleanly for 375px mobile & 1280px desktop */}
        <h1 className="relative z-10 font-headline text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 flex-wrap">
          {titleLines.map(line => (
            <span key={line.word} className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
              {line.word.split('').map((char, charIdx) => {
                const globalIdx = line.offset + charIdx;
                const palette = LETTER_PALETTE[globalIdx % LETTER_PALETTE.length];
                const initialY = globalIdx % 2 === 0 ? -75 : 75;
                const tilt = ((globalIdx % 5) - 2) * 2;

                return (
                  <motion.span
                    key={charIdx}
                    initial={
                      prefersReducedMotion
                        ? false
                        : {
                            y: initialY,
                            scale: 0,
                            opacity: 0,
                            rotate: initialY > 0 ? -20 : 20,
                          }
                    }
                    animate={
                      prefersReducedMotion
                        ? { y: 0, scale: 1, opacity: 1, rotate: 0 }
                        : {
                            y: [initialY, 0, globalIdx % 2 === 0 ? -20 : 20, -12, 0],
                            scale: [0, 1.2, 0.55, 1.35, 1],
                            opacity: [0, 1, 0.85, 1, 1],
                            rotate: [initialY > 0 ? -20 : 20, -tilt * 2, tilt * 2.5, -tilt * 2, tilt],
                          }
                    }
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 1.3,
                            times: [0, 0.32, 0.62, 0.82, 1],
                            delay: globalIdx * 0.04,
                            ease: 'easeInOut',
                          }
                    }
                    whileHover={
                      prefersReducedMotion
                        ? undefined
                        : {
                            scale: 1.12,
                            y: -4,
                            transition: { duration: 0.12 },
                          }
                    }
                    style={{
                      backgroundColor: palette.bg,
                      color: palette.text,
                    }}
                    className="inline-flex items-center justify-center px-1.5 sm:px-3 py-1 sm:py-2 border-3 border-ink rounded-neo shadow-ink"
                  >
                    {char}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </h1>

        <div className="max-w-xs sm:max-w-md mx-auto mt-4">
          <SquiggleUnderline />
        </div>
      </div>

      {/* Hero Subline under WELCOME, FRESHER */}
      <div className="min-h-[3rem] mt-2 mb-6 flex items-center justify-center">
        <div className="px-4 py-2 bg-canvas border-3 border-ink rounded-neo shadow-ink">
          <p className="font-body text-base sm:text-xl font-bold text-ink text-center">
            {typewriterText || HERO_SUBLINE}
            <span
              className={`inline-block w-2.5 h-5 bg-berry ml-1 align-middle ${
                showTypewriterCursor ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </p>
        </div>
      </div>

      {/* Drop Box Area */}
      <AnimatePresence>
        {showDropZone && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' }}
            className="w-full max-w-xl mx-auto"
          >
            {isAnalyzing ? (
              /* Analyzing Progress State */
              <div className="bg-canvas border-3 border-ink rounded-neo p-6 sm:p-8 shadow-ink text-center">
                <div className="flex items-center justify-center gap-2.5 mb-6">
                  <AsteriskIcon className="w-7 h-7 text-berry animate-spin" />
                  <span className="font-headline font-bold text-xl sm:text-2xl text-ink">
                    Reading & Scoring Your Resume...
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                  {PROGRESS_STEPS.map((step, idx) => {
                    const isDone = currentStep > idx;
                    const isCurrent = currentStep === idx;
                    return (
                      <div key={step.label} className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 flex items-center justify-center font-mono text-xs font-bold border-3 border-ink rounded-neo shadow-ink transition-all ${
                            isDone
                              ? 'bg-mint text-ink'
                              : isCurrent
                              ? 'bg-primary text-ink scale-105'
                              : 'bg-canvas text-ink-muted'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-xs font-mono mt-2 ${
                            isCurrent ? 'font-bold text-ink' : 'text-ink-muted'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="w-full bg-paper-dark border-3 border-ink rounded-neo h-4 overflow-hidden p-0.5 mt-4">
                  <div
                    className="bg-mint h-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, (currentStep + 1) * 25)}%` }}
                  />
                </div>
              </div>
            ) : (
              /* Ready Drop Box */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer transition-all duration-150 border-3 border-ink rounded-neo bg-canvas p-6 sm:p-10 text-center select-none shadow-ink ${
                  isDragOver ? 'bg-primary/30 translate-x-0.5 translate-y-0.5' : ''
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 border-3 border-ink rounded-neo flex items-center justify-center bg-primary shadow-ink mb-1">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="w-7 h-7 text-ink"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>

                  <h2 className="font-headline font-bold text-xl sm:text-2xl text-ink">
                    {isDragOver
                      ? 'Yes, right here!'
                      : 'Drop your resume here (PDF or DOCX), or paste the text'}
                  </h2>

                  <p className="font-body text-base text-ink-muted max-w-md">
                    Drag and drop your file, or{' '}
                    <span className="text-ink font-bold underline decoration-2 underline-offset-4">
                      browse your computer
                    </span>{' '}
                    (up to 4 MB).
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                    <span className="font-mono text-xs font-bold px-3 py-1 border-3 border-ink rounded-neo text-ink bg-primary shadow-ink">
                      PDF
                    </span>
                    <span className="font-mono text-xs font-bold px-3 py-1 border-3 border-ink rounded-neo text-ink bg-mint shadow-ink">
                      DOCX
                    </span>
                    <span className="font-mono text-xs font-bold px-3 py-1 border-3 border-ink rounded-neo text-ink bg-canvas shadow-ink">
                      UP TO 4 MB
                    </span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            )}

            {/* Paste alternative & Sample Resume */}
            {!isAnalyzing && (
              <div className="mt-5 flex flex-col items-center">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onPasteSubmit(SAMPLE_FRESHER_RESUME)}
                    className="btn-pressable px-4 py-2 bg-primary border-3 border-ink rounded-neo font-mono text-xs font-bold text-ink"
                  >
                    Try a sample resume
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPasteOpen(prev => !prev)}
                    className="btn-pressable px-4 py-2 bg-canvas border-3 border-ink rounded-neo font-mono text-xs font-bold text-ink"
                  >
                    {isPasteOpen ? 'Hide text box' : 'Paste resume text'}
                  </button>
                </div>

                {isPasteOpen && (
                  <div className="w-full mt-4 p-4 bg-canvas border-3 border-ink rounded-neo shadow-ink">
                    <textarea
                      rows={5}
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      placeholder="Paste your resume text here (Education, Skills, Projects, Experience...)"
                      className="w-full p-3 font-body text-base bg-paper-dark border-3 border-ink rounded-neo text-ink focus:outline-none resize-y"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handlePasteSubmit}
                        disabled={pastedText.trim().length < 40}
                        className="btn-pressable px-5 py-2.5 bg-primary text-ink border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase disabled:opacity-50"
                      >
                        Check My Resume →
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-canvas border-3 border-ink rounded-neo shadow-ink text-xs font-mono font-bold text-ink">
                  <span className="w-2.5 h-2.5 rounded-full bg-mint border-2 border-ink inline-block" />
                  <span>Your resume is never saved.</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
