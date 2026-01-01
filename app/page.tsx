'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');

    // Validate URL format
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(url)) {
      setError('Please enter a valid YouTube URL');
      setIsLoading(false);
      return;
    }

    // Navigate to analyze page with URL
    router.push(`/analyze?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                YouTube Rater
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Is This Video
              </span>
              <br />
              <span className="text-white">
                Worth Your Time?
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-300 mb-12">
              Analyze any YouTube video before you watch. Detect clickbait, gatekeeping, and predatory content.
            </p>

            {/* URL Input */}
            <div className="max-w-3xl mx-auto mb-8">
              <form onSubmit={handleAnalyze}>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError('');
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1 px-6 py-4 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        'Analyze Video'
                      )}
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm mt-4">{error}</p>
                  )}
                </div>
              </form>
            </div>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 mb-16">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Red Flag Detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Predator Protection</span>
              </div>
            </div>
          </div>

          {/* What We Detect */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">What We Detect</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: '⏱️',
                  title: '10:01 Videos',
                  description: 'Videos padded to hit the ad threshold',
                },
                {
                  icon: '🔒',
                  title: 'Gatekeeping',
                  description: '"Sign up for my course to learn the secret"',
                },
                {
                  icon: '🎣',
                  title: 'Clickbait',
                  description: 'Misleading titles that don\'t deliver',
                },
                {
                  icon: '💰',
                  title: 'Wealth Flex',
                  description: 'Lamborghinis and mansions as manipulation',
                },
                {
                  icon: '🚫',
                  title: 'Disabled Comments',
                  description: 'Hiding feedback from viewers',
                },
                {
                  icon: '📉',
                  title: 'Low Engagement',
                  description: 'Videos that don\'t resonate with viewers',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>YouTube Rater — Know before you watch.</p>
          <p className="mt-2">Built to protect your time and money from predatory content.</p>
        </div>
      </footer>
    </div>
  );
}
