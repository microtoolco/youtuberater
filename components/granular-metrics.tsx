'use client';

import { GranularMetrics as GranularMetricsType } from '@/lib/analyzers/types';

interface GranularMetricsProps {
  metrics: GranularMetricsType;
}

export function GranularMetrics({ metrics }: GranularMetricsProps) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-emerald-400 bg-emerald-500/20';
      case 'B': return 'text-green-400 bg-green-500/20';
      case 'C': return 'text-yellow-400 bg-yellow-500/20';
      case 'D': return 'text-orange-400 bg-orange-500/20';
      case 'F': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getScoreColor = (score: number, inverted = false) => {
    const adjustedScore = inverted ? 100 - score : score;
    if (adjustedScore >= 70) return 'text-emerald-400';
    if (adjustedScore >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>📊</span> Detailed Metrics
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Engagement Grade */}
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-400 mb-2">Engagement</p>
          <span className={`text-3xl font-bold ${getGradeColor(metrics.engagementGrade)} px-3 py-1 rounded`}>
            {metrics.engagementGrade}
          </span>
        </div>

        {/* Like Ratio */}
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-400 mb-2">Like Ratio</p>
          <p className={`text-2xl font-bold ${getScoreColor(metrics.likeToViewRatio * 20)}`}>
            {metrics.likeToViewRatio.toFixed(2)}%
          </p>
        </div>

        {/* Comment Ratio */}
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-400 mb-2">Comment Ratio</p>
          <p className={`text-2xl font-bold ${getScoreColor(metrics.commentToViewRatio * 50)}`}>
            {metrics.commentToViewRatio.toFixed(2)}%
          </p>
        </div>

        {/* Clickbait Score */}
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-400 mb-2">Clickbait Score</p>
          <p className={`text-2xl font-bold ${getScoreColor(metrics.titleClickbaitScore, true)}`}>
            {metrics.titleClickbaitScore}/100
          </p>
          <p className="text-xs text-slate-500 mt-1">Lower is better</p>
        </div>

        {/* Description Quality */}
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-400 mb-2">Description Quality</p>
          <p className={`text-2xl font-bold ${getScoreColor(metrics.descriptionQuality)}`}>
            {metrics.descriptionQuality}/100
          </p>
        </div>

        {/* Content Density */}
        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-400 mb-2">Content Density</p>
          <p className={`text-2xl font-bold ${getScoreColor(metrics.contentDensityEstimate)}`}>
            {metrics.contentDensityEstimate}/100
          </p>
        </div>
      </div>

      {/* Video Characteristics */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <p className="text-sm text-slate-400 mb-3">Video Characteristics</p>
        <div className="flex flex-wrap gap-2">
          {metrics.hasTimestamps && (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm flex items-center gap-1">
              <span>✓</span> Has Timestamps
            </span>
          )}
          {metrics.hasChapters && (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm flex items-center gap-1">
              <span>✓</span> Has Chapters
            </span>
          )}
          {metrics.isShortForm && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              Short Form
            </span>
          )}
          {metrics.estimatedAdBreaks > 0 && (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
              ~{metrics.estimatedAdBreaks} ad break{metrics.estimatedAdBreaks > 1 ? 's' : ''}
            </span>
          )}
          {!metrics.hasTimestamps && !metrics.hasChapters && (
            <span className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded-full text-sm">
              No navigation aids
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
