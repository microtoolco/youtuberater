'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { VideoAnalysis } from '@/lib/analyzers/types';
import { ScoreGauge } from '@/components/score-gauge';
import { RedFlagsPanel } from '@/components/red-flags-panel';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { VideoPreview } from '@/components/video-preview';
import { HighlightsPanel } from '@/components/highlights-panel';
import { ContentInsights } from '@/components/content-insights';
import { VerdictPanel } from '@/components/verdict-panel';
import { GranularMetrics } from '@/components/granular-metrics';
import { GreenFlagsPanel } from '@/components/green-flags-panel';
import { SkipIntroPanel } from '@/components/skip-intro-panel';

type TabType = 'overview' | 'insights' | 'metrics';

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get('url');

  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (!url) {
      router.push('/');
      return;
    }

    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Analysis failed');
        }

        setAnalysis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [url, router]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!analysis) {
    return <ErrorState error="No analysis data" />;
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'insights' as TabType, label: 'Content Insights', icon: '💡' },
    { id: 'metrics' as TabType, label: 'Detailed Metrics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                YouTube Rater
              </span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              Analyze Another
            </Link>
          </div>
        </div>
      </nav>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Video + Score + Verdict */}
          <div className="lg:col-span-1 space-y-6">
            <VideoPreview video={analysis.video} />
            <ScoreGauge
              score={analysis.analysis.overallScore}
              recommendation={analysis.analysis.recommendation}
            />
            <VerdictPanel
              verdict={analysis.analysis.verdict}
              recommendationReason={analysis.analysis.recommendationReason}
            />

            {/* Skip Intro Panel */}
            {analysis.introAnalysis && (
              <SkipIntroPanel
                introAnalysis={analysis.introAnalysis}
                videoId={analysis.videoId}
              />
            )}

            {/* Transcript indicator */}
            {analysis.hasTranscript && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                <span className="text-emerald-400 text-sm">
                  ✓ Full transcript analyzed for deeper insights
                </span>
              </div>
            )}
          </div>

          {/* Right Column - Tabbed Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <HighlightsPanel highlights={analysis.analysis.highlights} />
                <GreenFlagsPanel flags={analysis.analysis.greenFlags} />
                <RedFlagsPanel flags={analysis.analysis.redFlags} />
                <ScoreBreakdown breakdown={analysis.analysis.breakdown} />

                {/* Share Section */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Share This Analysis</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Link
                    </button>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `This video scored ${analysis.analysis.overallScore}/100 on YouTube Rater! ${analysis.analysis.recommendation === 'watch' ? '✅ Worth watching' : analysis.analysis.recommendation === 'skip' ? '❌ Consider skipping' : '⚠️ Proceed with caution'}\n\n"${analysis.video.title}"`
                      )}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Share on X
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <ContentInsights
                insights={analysis.analysis.contentInsights}
                hasTranscript={analysis.hasTranscript}
              />
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <GranularMetrics metrics={analysis.analysis.granularMetrics} />
                <ScoreBreakdown breakdown={analysis.analysis.breakdown} />

                {/* Raw Data Preview */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🔍</span> Video Metadata
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-white ml-2">{analysis.video.duration}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Published:</span>
                      <span className="text-white ml-2">
                        {new Date(analysis.video.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Views:</span>
                      <span className="text-white ml-2">{analysis.video.viewCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Likes:</span>
                      <span className="text-white ml-2">{analysis.video.likeCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Comments:</span>
                      <span className="text-white ml-2">
                        {analysis.video.commentCount?.toLocaleString() || 'Disabled'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tags:</span>
                      <span className="text-white ml-2">{analysis.video.tags?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-semibold text-white mb-3">Deep Analysis in Progress...</h2>
        <div className="space-y-2 text-slate-400">
          <p>Fetching video metadata</p>
          <p>Analyzing content patterns</p>
          <p>Detecting red flags & value signals</p>
          <p>Extracting key insights</p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-3xl">!</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Analysis Failed</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all inline-block"
        >
          Try Another Video
        </Link>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AnalyzeContent />
    </Suspense>
  );
}
