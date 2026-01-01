'use client';

import { RedFlag } from '@/lib/analyzers/types';

interface RedFlagsPanelProps {
  flags: RedFlag[];
}

export function RedFlagsPanel({ flags }: RedFlagsPanelProps) {
  if (flags.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-green-400 text-xl">✓</span>
          </div>
          <div>
            <h3 className="text-green-400 font-semibold">No Red Flags Detected</h3>
            <p className="text-slate-400 text-sm">This video passed our quality checks</p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      case 'low': return 'bg-orange-500/20 border-orange-500/40 text-orange-400';
    }
  };

  const getSeverityIcon = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '⚡';
    }
  };

  const getSeverityLabel = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-red-400">⚠️</span>
        Red Flags Detected ({flags.length})
      </h3>

      <div className="space-y-3">
        {flags.map((flag, index) => (
          <div
            key={index}
            className={`${getSeverityColor(flag.severity)} border rounded-lg p-4`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{getSeverityIcon(flag.severity)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold capitalize">
                    {flag.type.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    flag.severity === 'high' ? 'bg-red-500/30' :
                    flag.severity === 'medium' ? 'bg-yellow-500/30' :
                    'bg-orange-500/30'
                  }`}>
                    {getSeverityLabel(flag.severity)}
                  </span>
                </div>
                <p className="text-sm opacity-80">{flag.description}</p>
              </div>
              <div className="text-sm font-mono opacity-60">
                -{flag.points} pts
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
