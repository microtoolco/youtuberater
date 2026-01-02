'use client';

import { KeyMoment } from '@/lib/transcript/types';
import { buildWatchUrl } from '@/lib/transcript/utils/youtubeUrl';

interface KeyMomentsPanelProps {
  moments: KeyMoment[];
  videoId: string;
}

const TYPE_ICONS: Record<KeyMoment['type'], string> = {
  tip: '💡',
  step: '📋',
  insight: '🎯',
  framework: '🧩',
  warning: '⚠️',
  claim: '📊',
};

const TYPE_COLORS: Record<KeyMoment['type'], string> = {
  tip: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  step: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  insight: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  framework: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  claim: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export function KeyMomentsPanel({ moments, videoId }: KeyMomentsPanelProps) {
  if (moments.length === 0) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>🎬</span> Key Moments ({moments.length})
      </h3>

      <div className="space-y-3">
        {moments.map((moment, index) => (
          <a
            key={index}
            href={buildWatchUrl(videoId, moment.startSeconds)}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-700/50">
              {/* Timestamp */}
              <div className="flex-shrink-0 w-16 text-center">
                <span className="font-mono text-sm text-emerald-400 group-hover:text-emerald-300">
                  {moment.timestamp}
                </span>
              </div>

              {/* Type badge */}
              <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs border ${TYPE_COLORS[moment.type]}`}>
                <span className="mr-1">{TYPE_ICONS[moment.type]}</span>
                {moment.type}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white">
                  {moment.text}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 text-slate-500 group-hover:text-emerald-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Click any moment to jump to that point in the video
      </p>
    </div>
  );
}
