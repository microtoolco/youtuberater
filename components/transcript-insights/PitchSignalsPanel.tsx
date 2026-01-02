'use client';

import { PitchSignal } from '@/lib/transcript/types';
import { buildWatchUrl } from '@/lib/transcript/utils/youtubeUrl';

interface PitchSignalsPanelProps {
  signals: PitchSignal[];
  videoId: string;
}

const TYPE_LABELS: Record<PitchSignal['type'], string> = {
  course: 'Course Pitch',
  coaching: 'Coaching Offer',
  sponsor: 'Sponsored',
  affiliate: 'Affiliate',
  cta: 'Call to Action',
  download: 'Lead Magnet',
};

const SEVERITY_COLORS: Record<PitchSignal['severity'], string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export function PitchSignalsPanel({ signals, videoId }: PitchSignalsPanelProps) {
  if (signals.length === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <span>✓</span>
          <span className="font-medium">No significant sales pitches detected</span>
        </div>
      </div>
    );
  }

  const highSeverity = signals.filter(s => s.severity === 'high').length;
  const mediumSeverity = signals.filter(s => s.severity === 'medium').length;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <span>🎯</span> Pitch & Upsell Moments ({signals.length})
      </h3>

      {/* Summary */}
      <div className="mb-4 flex gap-2 text-sm">
        {highSeverity > 0 && (
          <span className="px-2 py-1 rounded bg-red-500/20 text-red-400">
            {highSeverity} high
          </span>
        )}
        {mediumSeverity > 0 && (
          <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400">
            {mediumSeverity} medium
          </span>
        )}
      </div>

      <div className="space-y-2">
        {signals.map((signal, index) => (
          <a
            key={index}
            href={buildWatchUrl(videoId, signal.startSeconds)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-700/50 group"
          >
            {/* Timestamp */}
            <span className="flex-shrink-0 font-mono text-sm text-slate-500 group-hover:text-orange-400 w-14">
              {signal.timestamp}
            </span>

            {/* Type badge */}
            <span className={`flex-shrink-0 px-2 py-1 rounded text-xs border ${SEVERITY_COLORS[signal.severity]}`}>
              {TYPE_LABELS[signal.type]}
            </span>

            {/* Text */}
            <p className="flex-1 text-slate-400 text-sm truncate group-hover:text-slate-300">
              {signal.text}
            </p>
          </a>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        These moments contain promotional content. Click to see context.
      </p>
    </div>
  );
}
