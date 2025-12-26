"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Search, Link as LinkIcon, Loader2, Youtube, FileText, Clock, Wrench, LogOut, Zap, Crown } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Tuborial</span>
            {isPro && (
              <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Pro
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
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
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <FileText className="w-4 h-4" />
                <span>Total Guides</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGuides}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>This Month</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Zap className="w-4 h-4" />
                <span>Remaining</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.creditsRemaining}
                {stats.monthlyLimit && <span className="text-sm text-gray-400">/{stats.monthlyLimit}</span>}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Crown className="w-4 h-4" />
                <span>Plan</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 capitalize">{stats.plan || "Free"}</p>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Convert YouTube Tutorial to Guide
          </h2>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                placeholder="Paste YouTube video URL (e.g., https://youtube.com/watch?v=...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleConvert()}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleConvert}
              disabled={loading || !url.trim()}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
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
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <p className="mt-3 text-sm text-gray-500">
            Works best with how-to videos, tutorials, DIY projects, recipes, and instructional content.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Youtube className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Guide</h3>
            <p className="text-gray-500 text-sm">
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
          <div className="mt-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Running low on guides?</h3>
                <p className="text-white/80 text-sm">
                  Upgrade to Pro for 50 guides/month and unlock unlimited potential.
                </p>
              </div>
              <button className="px-6 py-3 bg-white text-orange-600 font-medium rounded-xl hover:bg-gray-100 transition">
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
