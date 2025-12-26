"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Youtube, FileText, Clock, Wrench, LogOut, Zap, Crown } from "lucide-react";
import { GuidePreview } from "@/components/guide/GuidePreview";
import type { GuideContent, Stats } from "@/types";

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guide, setGuide] = useState<GuideContent | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ title: string; thumbnail: string; channel: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleConvert = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setGuide(null);
    setVideoInfo(null);

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate guide");
        if (data.needsUpgrade) {
          // Could show upgrade modal here
        }
        return;
      }

      setGuide(data.guide);
      setVideoInfo(data.videoInfo);
      fetchStats(); // Refresh stats
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isPro = stats?.plan === "monthly" || stats?.plan === "lifetime";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                Tuborial
              </span>
            </Link>
            {isPro && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Pro
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <FileText className="w-4 h-4" />
                <span>Total Guides</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalGuides}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>This Month</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Zap className="w-4 h-4" />
                <span>Remaining</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.creditsRemaining}
                {stats.monthlyLimit && <span className="text-sm text-slate-500">/{stats.monthlyLimit}</span>}
              </p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Crown className="w-4 h-4" />
                <span>Plan</span>
              </div>
              <p className="text-2xl font-bold text-white capitalize">{stats.plan || "Free"}</p>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Convert YouTube Tutorial to Guide
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="url"
                placeholder="Paste YouTube video URL (e.g., https://youtube.com/watch?v=...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleConvert()}
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleConvert}
              disabled={loading || !url.trim()}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-5 h-5" />
                  <span>Generate Guide</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <p className="mt-3 text-sm text-slate-500">
            Works best with how-to videos, tutorials, DIY projects, recipes, and instructional content.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Youtube className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Generating Your Guide</h3>
            <p className="text-slate-400 text-sm">
              Extracting transcript and converting to step-by-step instructions...
            </p>
          </div>
        )}

        {/* Guide Output */}
        {guide && videoInfo && !loading && (
          <GuidePreview guide={guide} videoInfo={videoInfo} />
        )}

        {/* Upgrade CTA for free users */}
        {stats && stats.plan === "free" && stats.creditsRemaining <= 1 && (
          <div className="mt-8 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Running low on guides?</h3>
                <p className="text-slate-400 text-sm">
                  Upgrade to Pro for 50 guides/month and unlock unlimited potential.
                </p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-orange-700 transition-all shadow-lg shadow-red-500/20 whitespace-nowrap">
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
