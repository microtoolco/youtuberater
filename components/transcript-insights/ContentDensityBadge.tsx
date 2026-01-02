'use client';

import { ContentDensity } from '@/lib/transcript/types';

interface ContentDensityBadgeProps {
  density: ContentDensity;
}

const GRADE_COLORS: Record<ContentDensity['grade'], string> = {
  A: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  B: 'bg-green-500/20 text-green-400 border-green-500/30',
  C: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  D: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  F: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const GRADE_DESCRIPTIONS: Record<ContentDensity['grade'], string> = {
  A: 'Highly instructional - packed with actionable content',
  B: 'Good educational value - solid learning content',
  C: 'Moderate value - some useful information',
  D: 'Low density - limited actionable content',
  F: 'Entertainment focus - minimal educational value',
};

export function ContentDensityBadge({ density }: ContentDensityBadgeProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-1">Content Density</h4>
          <p className="text-xs text-slate-500">{GRADE_DESCRIPTIONS[density.grade]}</p>
        </div>

        <div className="text-right">
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${GRADE_COLORS[density.grade]}`}>
            <span className="text-2xl font-bold">{density.grade}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {density.actionableStatementsPerMinute.toFixed(1)}/min
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex gap-4 text-xs text-slate-500">
        <span>{density.totalActionableStatements} actionable statements</span>
        <span>{density.videoDurationMinutes} min video</span>
      </div>
    </div>
  );
}
