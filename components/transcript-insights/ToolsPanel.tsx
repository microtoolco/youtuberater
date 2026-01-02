'use client';

import { ToolMention } from '@/lib/transcript/types';
import { buildWatchUrl } from '@/lib/transcript/utils/youtubeUrl';

interface ToolsPanelProps {
  tools: ToolMention[];
  videoId: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  software: '💻',
  service: '🔧',
  platform: '🌐',
  resource: '📚',
};

export function ToolsPanel({ tools, videoId }: ToolsPanelProps) {
  if (tools.length === 0) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>🛠️</span> Tools & Products Mentioned ({tools.length})
      </h3>

      <div className="flex flex-wrap gap-2">
        {tools.map((tool, index) => (
          <a
            key={index}
            href={buildWatchUrl(videoId, tool.startSeconds)}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
          >
            <div className="px-3 py-2 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-700/50 hover:border-teal-500/30 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <span>{CATEGORY_ICONS[tool.category || 'software']}</span>
                <span className="text-slate-300 group-hover:text-white font-medium">
                  {tool.name}
                </span>
                <span className="text-xs text-slate-500 font-mono group-hover:text-teal-400">
                  {tool.timestamp}
                </span>
              </div>
            </div>

            {/* Tooltip with context */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-10 shadow-xl">
              {tool.context}
            </div>
          </a>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Click to see where each tool is mentioned
      </p>
    </div>
  );
}
