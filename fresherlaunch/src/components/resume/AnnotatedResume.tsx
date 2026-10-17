'use client';

import React, { useState } from 'react';
import { ParsedResumeData, ResumeAnnotation, HighlightType } from '@/lib/types';

interface AnnotatedResumeProps {
  resumeData: ParsedResumeData;
  annotations: ResumeAnnotation[];
}

function getKindSuggestion(ann: ResumeAnnotation): string {
  if (ann.category === 'metric') {
    return ann.whatsWrong || 'Add numbers to this project: how many users, records, or how much faster?';
  }
  if (ann.category === 'verb') {
    return `Swap "${ann.originalText}" for an active verb like "Engineered" or "Built" so your ownership stands out.`;
  }
  if (ann.category === 'contact') {
    return ann.whatsWrong;
  }
  if (ann.category === 'formatting') {
    return `You can safely remove "${ann.originalText}" to save space for your technical projects.`;
  }
  if (ann.type === 'good') {
    return `"${ann.originalText.toUpperCase()}" is a high-demand skill for entry-level roles — great job including it!`;
  }
  return ann.whatsWrong;
}

export function AnnotatedResume({ resumeData, annotations }: AnnotatedResumeProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<ResumeAnnotation | null>(null);
  const [filterType, setFilterType] = useState<'all' | HighlightType>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAnnotations =
    filterType === 'all'
      ? annotations
      : annotations.filter(a => a.type === filterType);

  const handleCopyRewrite = (annotation: ResumeAnnotation) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(annotation.changeTo);
      setCopiedId(annotation.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Meaning-based badges: pink badge for critical, yellow badge for suggested, mint for strong
  const getBadgeForType = (type: HighlightType) => {
    switch (type) {
      case 'must_fix':
        return (
          <span className="bg-berry text-white font-mono text-xs font-bold px-2.5 py-0.5 border-3 border-ink rounded-neo">
            Critical
          </span>
        );
      case 'improve':
        return (
          <span className="bg-primary text-ink font-mono text-xs font-bold px-2.5 py-0.5 border-3 border-ink rounded-neo">
            Suggested
          </span>
        );
      case 'good':
        return (
          <span className="bg-mint text-ink font-mono text-xs font-bold px-2.5 py-0.5 border-3 border-ink rounded-neo">
            Strong
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-canvas border-3 border-ink rounded-neo shadow-ink p-5 sm:p-8 mb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b-3 border-ink gap-4">
        <div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            What to fix, and where
          </h2>
          <p className="font-body text-base text-ink-muted mt-1">
            Click any highlighted line in your resume to see a ready-to-copy rewrite.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`btn-pressable px-3.5 py-1.5 font-mono text-xs font-bold border-3 border-ink rounded-neo ${
              filterType === 'all' ? 'bg-ink text-canvas' : 'bg-canvas text-ink'
            }`}
          >
            All ({annotations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('must_fix')}
            className={`btn-pressable px-3.5 py-1.5 font-mono text-xs font-bold border-3 border-ink rounded-neo ${
              filterType === 'must_fix' ? 'bg-berry text-white' : 'bg-canvas text-ink'
            }`}
          >
            Critical ({annotations.filter(a => a.type === 'must_fix').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('improve')}
            className={`btn-pressable px-3.5 py-1.5 font-mono text-xs font-bold border-3 border-ink rounded-neo ${
              filterType === 'improve' ? 'bg-primary text-ink' : 'bg-canvas text-ink'
            }`}
          >
            Suggested ({annotations.filter(a => a.type === 'improve').length})
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Annotated Resume Viewer */}
        <div className="lg:col-span-6 bg-paper-dark border-3 border-ink rounded-neo p-5 sm:p-6 shadow-ink overflow-hidden">
          <div className="flex items-center justify-between border-b-3 border-ink pb-3 mb-4 text-xs font-mono font-bold text-ink">
            <span className="uppercase truncate">Resume: {resumeData.candidateName}</span>
            <span className="shrink-0 ml-2">{resumeData.wordCount} words</span>
          </div>

          {/* Interactive Document Body */}
          <div className="font-body text-base leading-relaxed whitespace-pre-wrap break-words text-ink select-text">
            {resumeData.rawText.split('\n').map((line, lineIdx) => {
              if (!line.trim()) return <div key={lineIdx} className="h-3" />;

              const matchedAnn = annotations.find(ann =>
                ann.originalText && line.toLowerCase().includes(ann.originalText.toLowerCase())
              );

              if (matchedAnn) {
                const highlightClass =
                  matchedAnn.type === 'must_fix'
                    ? 'highlight-must-fix'
                    : matchedAnn.type === 'improve'
                    ? 'highlight-improve'
                    : 'highlight-good';

                return (
                  <div key={lineIdx} className="my-1.5 py-0.5">
                    <span
                      onClick={() => setSelectedAnnotation(matchedAnn)}
                      className={`${highlightClass} inline`}
                      title="Click to see how to improve this line"
                    >
                      {line}
                    </span>
                  </div>
                );
              }

              return (
                <div key={lineIdx} className="my-1">
                  {line}
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t-3 border-ink text-xs font-mono font-bold text-ink flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-berry border-2 border-ink inline-block rounded-sm" />
              Critical fix
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-primary border-2 border-ink inline-block rounded-sm" />
              Suggested improvement
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-mint border-2 border-ink inline-block rounded-sm" />
              Strong keyword
            </span>
          </div>
        </div>

        {/* Right: Suggested Fix Cards & Inspector */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b-3 border-ink">
            <span className="font-mono text-xs uppercase font-bold text-ink">
              {selectedAnnotation
                ? 'Selected Suggestion'
                : `Suggestions (${filteredAnnotations.length})`}
            </span>
            {selectedAnnotation && (
              <button
                type="button"
                onClick={() => setSelectedAnnotation(null)}
                className="text-xs font-mono font-bold text-ink underline uppercase"
              >
                Show All
              </button>
            )}
          </div>

          {selectedAnnotation ? (
            /* Detailed Fix Card */
            <div className="bg-paper-dark border-3 border-ink rounded-neo p-5 sm:p-6 shadow-ink">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="font-mono text-xs font-bold uppercase text-ink">
                  Where: {selectedAnnotation.where}
                </span>
                {getBadgeForType(selectedAnnotation.type)}
              </div>

              {/* Kind Suggestion */}
              <div className="mb-4">
                <span className="font-mono text-xs font-bold text-ink-muted uppercase block mb-1">
                  How to make it stronger:
                </span>
                <p className="font-body text-base text-ink leading-relaxed bg-canvas p-3.5 border-3 border-ink rounded-neo">
                  {getKindSuggestion(selectedAnnotation)}
                </p>
              </div>

              {/* Change this -> To this rewrite block */}
              <div className="mb-5 flex flex-col gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-ink-muted uppercase block mb-1">
                    Change this:
                  </span>
                  <div className="font-mono text-xs p-3 bg-canvas border-3 border-ink rounded-neo text-ink-muted whitespace-pre-wrap break-words">
                    {selectedAnnotation.changeFrom}
                  </div>
                </div>

                <div>
                  <span className="font-mono text-xs font-bold text-ink uppercase block mb-1">
                    To this:
                  </span>
                  <div className="font-mono text-xs p-3 bg-mint/30 border-3 border-ink rounded-neo text-ink font-bold whitespace-pre-wrap break-words">
                    {selectedAnnotation.changeTo}
                  </div>
                  <p className="mt-1.5 font-mono text-xs text-ink-muted">
                    Replace the [brackets] with your real details. Don&apos;t add numbers you can&apos;t back up.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyRewrite(selectedAnnotation)}
                className="btn-pressable w-full py-2.5 bg-primary text-ink border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase flex items-center justify-center gap-2"
              >
                <span>
                  {copiedId === selectedAnnotation.id
                    ? '✓ Copied to clipboard!'
                    : 'Copy this rewrite'}
                </span>
              </button>
            </div>
          ) : (
            /* List of Actionable Annotation Cards with inline Change this -> To this boxes */
            <div className="flex flex-col gap-4 max-h-[720px] overflow-y-auto pr-1">
              {filteredAnnotations.map((ann, idx) => (
                <div
                  key={ann.id || idx}
                  onClick={() => setSelectedAnnotation(ann)}
                  className="p-4 bg-paper-dark border-3 border-ink rounded-neo shadow-ink cursor-pointer transition-transform hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-ink uppercase">
                      {ann.where}
                    </span>
                    {getBadgeForType(ann.type)}
                  </div>

                  <p className="font-body text-base text-ink mb-3">
                    {getKindSuggestion(ann)}
                  </p>

                  <div className="flex flex-col gap-2.5 mb-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-ink-muted uppercase block mb-1">
                        Change this:
                      </span>
                      <div className="font-mono text-xs p-2.5 bg-canvas border-3 border-ink rounded-neo text-ink-muted whitespace-pre-wrap break-words">
                        {ann.changeFrom}
                      </div>
                    </div>

                    <div>
                      <span className="font-mono text-xs font-bold text-ink uppercase block mb-1">
                        To this:
                      </span>
                      <div className="font-mono text-xs p-2.5 bg-mint/30 border-3 border-ink rounded-neo text-ink font-bold whitespace-pre-wrap break-words">
                        {ann.changeTo}
                      </div>
                      <p className="mt-1 font-mono text-xs text-ink-muted">
                        Replace the [brackets] with your real details. Don&apos;t add numbers you can&apos;t back up.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
