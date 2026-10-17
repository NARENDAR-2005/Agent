'use client';

import React, { useState, useEffect } from 'react';
import { AdzunaJob, JobFilterState } from '@/lib/types';
import { AsteriskIcon } from '../ui/SVGs';

interface JobsSectionProps {
  candidateSkills: string[];
}

const SKILL_PILL_COLORS = [
  'bg-primary text-ink',
  'bg-mint text-ink',
  'bg-sky text-ink',
  'bg-lime text-ink',
  'bg-tomato text-white',
  'bg-violet text-white',
];

export function JobsSection({ candidateSkills }: JobsSectionProps) {
  const [jobs, setJobs] = useState<AdzunaJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [filters, setFilters] = useState<JobFilterState>({
    timeframe: '7d',
    location: 'India',
    remoteOnly: false,
    minMatch: 70,
    searchQuery: '',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fresherlaunch_saved_jobs');
      if (saved) {
        setSavedJobIds(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSaveJob = (id: string) => {
    setSavedJobIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('fresherlaunch_saved_jobs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skillsParam = candidateSkills.slice(0, 8).join(',');
      const params = new URLSearchParams({
        timeframe: filters.timeframe,
        location: filters.location,
        remote: String(filters.remoteOnly),
        skills: skillsParam,
        q: filters.searchQuery || 'software engineer trainee',
      });

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch job openings');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load openings right now. Check connection or retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.timeframe, filters.remoteOnly]);

  const displayedJobs = jobs.filter(j => {
    if (showSavedOnly && !savedJobIds.includes(j.id)) return false;
    if (j.matchPercentage < filters.minMatch) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const text = `${j.title} ${j.company} ${j.location} ${j.matchedSkills.join(' ')}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  return (
    <section className="w-full bg-canvas border-3 border-ink rounded-neo shadow-ink p-5 sm:p-8 mb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b-3 border-ink gap-4">
        <div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Jobs that fit you right now
          </h2>
          <p className="font-body text-base text-ink-muted mt-1">
            Entry-level openings matched against your skills. Senior roles are automatically hidden.
          </p>
        </div>

        {/* Saved Jobs Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSavedOnly(prev => !prev)}
            className={`btn-pressable px-4 py-2 border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase ${
              showSavedOnly ? 'bg-primary text-ink' : 'bg-canvas text-ink'
            }`}
          >
            Saved Roles ({savedJobIds.length})
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-paper-dark border-3 border-ink rounded-neo shadow-ink mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Timeframe selector: 24h, 3d, 7d, 30d */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-ink uppercase mr-1">Posted:</span>
          {(['24h', '3d', '7d', '30d'] as const).map(tf => (
            <button
              key={tf}
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, timeframe: tf }))}
              className={`px-3 py-1 font-mono text-xs font-bold border-3 border-ink rounded-neo ${
                filters.timeframe === tf
                  ? 'bg-primary text-ink'
                  : 'bg-canvas text-ink'
              }`}
            >
              {tf === '7d' ? '7d' : tf}
            </button>
          ))}
        </div>

        {/* Search query input */}
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search title, company, or skill..."
            className="w-full px-3 py-2 font-body text-base bg-canvas border-3 border-ink rounded-neo text-ink focus:outline-none"
          />
        </div>

        {/* Minimum Match Filter */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-ink uppercase">Min Match:</span>
          <select
            value={filters.minMatch}
            onChange={e => setFilters(prev => ({ ...prev, minMatch: Number(e.target.value) }))}
            className="px-3 py-2 font-mono text-xs font-bold bg-canvas border-3 border-ink rounded-neo text-ink focus:outline-none"
          >
            <option value="60">60%+</option>
            <option value="70">70%+</option>
            <option value="80">80%+</option>
            <option value="85">85%+</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-paper-dark border-3 border-ink rounded-neo">
          <AsteriskIcon className="w-8 h-8 text-ink animate-spin mx-auto mb-3" />
          <p className="font-headline font-bold text-xl text-ink">Finding fresh openings...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center bg-paper-dark border-3 border-ink rounded-neo">
          <p className="font-body text-base text-ink font-bold mb-3">{error}</p>
          <button
            type="button"
            onClick={fetchJobs}
            className="btn-pressable px-4 py-2 bg-primary text-ink border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase"
          >
            Try Again
          </button>
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="p-10 text-center bg-paper-dark border-3 border-ink rounded-neo">
          <p className="font-headline font-bold text-xl text-ink">
            No openings matched your filters
          </p>
          <p className="font-body text-base text-ink-muted mt-1">
            Try lowering the minimum match percentage or clearing your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedJobs.map(job => {
            const isSaved = savedJobIds.includes(job.id);
            const matchBadgeColor =
              job.matchPercentage >= 75 ? 'bg-mint text-ink' : 'bg-primary text-ink';

            return (
              <div
                key={job.id}
                className="p-5 sm:p-6 bg-paper-dark border-3 border-ink rounded-neo shadow-ink flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Match % Badge + Posted Time */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b-3 border-ink">
                    <span
                      className={`font-mono text-xs font-bold px-3 py-1 border-3 border-ink rounded-neo ${matchBadgeColor}`}
                    >
                      {job.matchPercentage}% MATCH
                    </span>
                    <span className="font-mono text-xs font-bold text-ink-muted uppercase">
                      {job.postedTime}
                    </span>
                  </div>

                  {/* Title & Company */}
                  <h3 className="font-headline font-bold text-xl text-ink tracking-tight mb-1">
                    {job.title}
                  </h3>
                  <div className="font-body font-bold text-base text-ink mb-3">
                    {job.company} •{' '}
                    <span className="text-ink-muted font-normal">{job.location}</span>
                  </div>

                  {/* Description snippet */}
                  <p className="font-body text-base text-ink-muted leading-relaxed line-clamp-3 mb-4">
                    {job.description}
                  </p>

                  {/* Matched Skills Chips */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {job.matchedSkills.map((skill, idx) => (
                      <span
                        key={skill}
                        className={`font-mono text-xs font-bold border-3 border-ink rounded-neo px-2.5 py-0.5 uppercase ${
                          SKILL_PILL_COLORS[idx % SKILL_PILL_COLORS.length]
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Controls: Apply + Save */}
                <div className="pt-4 border-t-3 border-ink flex flex-wrap items-center justify-between gap-3">
                  <div className="font-mono text-xs font-bold text-ink">
                    {job.salary || 'Fresher Package'}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSaveJob(job.id)}
                      className={`btn-pressable px-3.5 py-2 border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase ${
                        isSaved ? 'bg-mint text-ink' : 'bg-canvas text-ink'
                      }`}
                    >
                      {isSaved ? '✓ Saved' : 'Save'}
                    </button>

                    <a
                      href={job.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-pressable px-4 py-2 bg-primary text-ink border-3 border-ink rounded-neo font-mono text-xs font-bold uppercase flex items-center gap-1"
                    >
                      <span>Apply</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
