'use client';

interface HighlightsPanelProps {
  highlights: string[];
}

export function HighlightsPanel({ highlights }: HighlightsPanelProps) {
  if (highlights.length === 0) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>💡</span>
        Key Insights
      </h3>

      <ul className="space-y-3">
        {highlights.map((highlight, index) => (
          <li key={index} className="flex items-start gap-3 text-slate-300">
            <span className="text-slate-500 mt-0.5">•</span>
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
