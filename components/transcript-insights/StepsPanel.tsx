'use client';

import { Step } from '@/lib/transcript/types';
import { buildWatchUrl } from '@/lib/transcript/utils/youtubeUrl';

interface StepsPanelProps {
  steps: Step[];
  videoId: string;
}

export function StepsPanel({ steps, videoId }: StepsPanelProps) {
  if (steps.length === 0) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>📋</span> Steps ({steps.length})
      </h3>

      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.number}>
            <a
              href={buildWatchUrl(videoId, step.startSeconds)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/80 transition-colors border border-transparent hover:border-blue-500/30 group"
            >
              {/* Step number */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                {step.number}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white">
                  {step.text}
                </p>
              </div>

              {/* Timestamp */}
              <div className="flex-shrink-0 text-right">
                <span className="font-mono text-xs text-slate-500 group-hover:text-blue-400">
                  {step.timestamp}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs text-slate-500">
        Click any step to watch that section
      </p>
    </div>
  );
}
