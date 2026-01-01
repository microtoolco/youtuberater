'use client';

import { IntroAnalysis } from '@/lib/analyzers/types';

interface SkipIntroPanelProps {
  introAnalysis: IntroAnalysis;
  videoId: string;
}

export function SkipIntroPanel({ introAnalysis, videoId }: SkipIntroPanelProps) {
  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-emerald-400 bg-emerald-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-orange-400 bg-orange-500/20';
    }
  };

  const getConfidenceLabel = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'High confidence';
      case 'medium': return 'Medium confidence';
      case 'low': return 'Estimated';
    }
  };

  const youtubeUrl = `https://youtube.com/watch?v=${videoId}&t=${introAnalysis.skipToTimestamp}`;

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5">
      <div className="flex items-start gap-4">
        {/* Skip button */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 group"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <div className="text-center">
              <span className="text-white font-bold text-lg block">{introAnalysis.skipToFormatted}</span>
              <span className="text-purple-200 text-[10px] uppercase tracking-wide">Skip to</span>
            </div>
          </div>
        </a>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white">Skip Intro</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${getConfidenceColor(introAnalysis.confidence)}`}>
              {getConfidenceLabel(introAnalysis.confidence)}
            </span>
          </div>

          <p className="text-slate-300 text-sm mb-3">
            Main content starts at <span className="font-mono text-purple-300">{introAnalysis.skipToFormatted}</span>
            {' '}- skip the first {introAnalysis.introLength} seconds
          </p>

          <div className="flex items-center gap-3">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Watch from {introAnalysis.skipToFormatted}
            </a>

            <span className="text-slate-500 text-xs">
              {introAnalysis.detectionReason}
            </span>
          </div>
        </div>
      </div>

      {/* Time saved indicator */}
      {introAnalysis.introLength >= 30 && (
        <div className="mt-4 pt-3 border-t border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-300 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Save ~{Math.round(introAnalysis.introLength / 60) || 1} minute{introAnalysis.introLength >= 120 ? 's' : ''} by skipping the intro
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
