'use client';

import { useState, useEffect } from 'react';
import { TranscriptInsights, TranscriptStatus } from '@/lib/transcript/types';
import { KeyMomentsPanel } from './KeyMomentsPanel';
import { StepsPanel } from './StepsPanel';
import { ToolsPanel } from './ToolsPanel';
import { PitchSignalsPanel } from './PitchSignalsPanel';
import { ContentDensityBadge } from './ContentDensityBadge';

interface TranscriptInsightsSectionProps {
  videoId: string;
  initialStatus: TranscriptStatus;
  initialInsights?: TranscriptInsights;
  nextAction?: {
    endpoint: string;
    body: Record<string, unknown>;
  };
}

export function TranscriptInsightsSection({
  videoId,
  initialStatus,
  initialInsights,
  nextAction,
}: TranscriptInsightsSectionProps) {
  const [status, setStatus] = useState<TranscriptStatus>(initialStatus);
  const [insights, setInsights] = useState<TranscriptInsights | undefined>(initialInsights);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch transcript insights if not already available
  useEffect(() => {
    if (status.status === 'not_fetched' && nextAction && !isLoading) {
      fetchTranscriptInsights();
    }
  }, [status.status, nextAction]);

  async function fetchTranscriptInsights() {
    if (!nextAction) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(nextAction.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextAction.body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }

      setStatus(data.transcript);
      if (data.transcriptInsights) {
        setInsights(data.transcriptInsights);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transcript insights');
      setStatus({ status: 'unavailable', reason: 'Error fetching transcript' });
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state
  if (isLoading || status.status === 'processing') {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-300">Adding transcript insights...</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          This may take a few seconds. Transcript-based insights are best-effort.
        </p>
      </div>
    );
  }

  // Unavailable state
  if (status.status === 'unavailable') {
    return (
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-slate-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Transcript insights unavailable for this video</span>
        </div>
        {status.reason && (
          <p className="text-xs text-slate-600 mt-1">{status.reason}</p>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchTranscriptInsights}
          className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // No insights yet
  if (!insights) {
    return null;
  }

  // Render insights
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>📝</span> Transcript Insights
        </h2>
        {status.language && (
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
            {status.language.toUpperCase()}
          </span>
        )}
      </div>

      {/* Content Density */}
      <ContentDensityBadge density={insights.contentDensity} />

      {/* Key Moments */}
      <KeyMomentsPanel moments={insights.keyMoments} videoId={videoId} />

      {/* Steps */}
      <StepsPanel steps={insights.steps} videoId={videoId} />

      {/* Tools */}
      <ToolsPanel tools={insights.tools} videoId={videoId} />

      {/* Pitch Signals */}
      <PitchSignalsPanel signals={insights.pitchSignals} videoId={videoId} />

      {/* Footer note */}
      <p className="text-xs text-slate-500 text-center">
        Transcript-based insights are best-effort and may not capture all content.
      </p>
    </div>
  );
}

export { KeyMomentsPanel, StepsPanel, ToolsPanel, PitchSignalsPanel, ContentDensityBadge };
