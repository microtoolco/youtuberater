'use client';

import { ScoreBreakdown as ScoreBreakdownType } from '@/lib/analyzers/types';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const metrics = [
    {
      label: 'Content Quality',
      value: breakdown.contentQuality,
      max: 25,
      description: 'Video length, title quality, tags',
      icon: '📝',
    },
    {
      label: 'Creator Trust',
      value: breakdown.creatorTrust,
      max: 25,
      description: 'Channel reputation, description detail',
      icon: '👤',
    },
    {
      label: 'Engagement Health',
      value: breakdown.engagementHealth,
      max: 25,
      description: 'Like ratio, comment activity',
      icon: '💬',
    },
    {
      label: 'Red Flag Penalty',
      value: -breakdown.redFlagPenalty,
      max: 0,
      min: -25,
      description: 'Points deducted for warning signs',
      icon: '⚠️',
      isNegative: true,
    },
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Score Breakdown</h3>

      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const percentage = metric.isNegative
            ? Math.abs(metric.value) / 25 * 100
            : metric.value / metric.max * 100;

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{metric.icon}</span>
                  <span className="text-slate-200 font-medium">{metric.label}</span>
                </div>
                <span className={`font-mono font-semibold ${
                  metric.isNegative ? 'text-red-400' : 'text-slate-300'
                }`}>
                  {metric.isNegative && metric.value !== 0 ? '' : '+'}{metric.value}/{metric.isNegative ? '-25' : metric.max}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    metric.isNegative ? 'bg-red-500' :
                    percentage >= 70 ? 'bg-green-500' :
                    percentage >= 40 ? 'bg-yellow-500' :
                    'bg-orange-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
