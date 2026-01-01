'use client';

import { GreenFlag } from '@/lib/analyzers/types';

interface GreenFlagsPanelProps {
  flags: GreenFlag[];
}

export function GreenFlagsPanel({ flags }: GreenFlagsPanelProps) {
  if (flags.length === 0) return null;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
        <span>✅</span>
        Positive Signals ({flags.length})
      </h3>

      <div className="space-y-3">
        {flags.map((flag, index) => (
          <div
            key={index}
            className="flex items-center gap-3 text-emerald-200"
          >
            <span className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <span className="text-emerald-400">✓</span>
            </span>
            <div className="flex-1">
              <span>{flag.description}</span>
            </div>
            <span className="text-emerald-400 text-sm font-mono">
              +{flag.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
