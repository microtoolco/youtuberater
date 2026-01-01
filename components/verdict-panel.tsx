'use client';

interface VerdictPanelProps {
  verdict: {
    watchTime: string;
    bestFor: string;
    skipIf: string;
    tldr: string;
  };
  recommendationReason: string;
}

export function VerdictPanel({ verdict, recommendationReason }: VerdictPanelProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>⚡</span> Quick Verdict
      </h3>

      {/* TL;DR */}
      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
        <p className="text-slate-200 font-medium">{verdict.tldr}</p>
      </div>

      <div className="space-y-4">
        {/* Watch Time Recommendation */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400">⏱️</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">Time Investment</p>
            <p className="text-slate-200">{verdict.watchTime}</p>
          </div>
        </div>

        {/* Best For */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400">👤</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">Best For</p>
            <p className="text-slate-200">{verdict.bestFor}</p>
          </div>
        </div>

        {/* Skip If */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-orange-400">⏭️</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">Skip If</p>
            <p className="text-slate-200">{verdict.skipIf}</p>
          </div>
        </div>

        {/* Recommendation Reason */}
        <div className="pt-4 border-t border-slate-700/50">
          <p className="text-sm text-slate-400 mb-1">Why this rating?</p>
          <p className="text-slate-300 text-sm">{recommendationReason}</p>
        </div>
      </div>
    </div>
  );
}
