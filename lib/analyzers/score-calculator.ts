// YouTube Rater - Enhanced Score Calculator

import { VideoMetadata, AnalysisResult, ScoreBreakdown, RedFlag, GreenFlag, ContentInsights, GranularMetrics } from './types';
import { detectRedFlags, calculateRedFlagPenalty } from './pattern-matcher';
import { analyzeWithAI, calculateGranularMetrics, detectGreenFlags, generateVerdict } from './ai-analyzer';
import { fetchTranscript } from './transcript-fetcher';

export async function calculateScore(video: VideoMetadata): Promise<{ analysis: AnalysisResult; transcript: string | null }> {
  // Fetch transcript (non-blocking, with fallback)
  const transcript = await fetchTranscript(video.videoId);

  // Run analyses in parallel
  const [redFlags, granularMetrics, contentInsights] = await Promise.all([
    Promise.resolve(detectRedFlags(video)),
    Promise.resolve(calculateGranularMetrics(video)),
    analyzeWithAI(video, transcript || undefined),
  ]);

  const greenFlags = detectGreenFlags(video, granularMetrics);
  const breakdown = calculateBreakdown(video, redFlags, greenFlags);

  // Calculate overall score with green flag bonuses
  const greenFlagBonus = greenFlags.reduce((sum, flag) => sum + flag.points, 0);
  const baseScore = breakdown.contentQuality + breakdown.creatorTrust + breakdown.engagementHealth;
  const overallScore = Math.max(0, Math.min(100,
    baseScore + Math.min(greenFlagBonus, 15) - breakdown.redFlagPenalty
  ));

  const recommendation = getRecommendation(overallScore, redFlags, contentInsights);
  const recommendationReason = getRecommendationReason(overallScore, redFlags, greenFlags, contentInsights);
  const highlights = generateHighlights(video, redFlags, greenFlags, contentInsights);
  const verdict = generateVerdict(video, overallScore, contentInsights, granularMetrics);

  return {
    analysis: {
      overallScore,
      recommendation,
      recommendationReason,
      breakdown,
      redFlags,
      greenFlags,
      highlights,
      analyzedAt: new Date().toISOString(),
      granularMetrics,
      contentInsights,
      verdict,
    },
    transcript,
  };
}

function calculateBreakdown(video: VideoMetadata, redFlags: RedFlag[], greenFlags: GreenFlag[]): ScoreBreakdown {
  return {
    contentQuality: calculateContentQuality(video),
    creatorTrust: calculateCreatorTrust(video),
    engagementHealth: calculateEngagementHealth(video),
    redFlagPenalty: calculateRedFlagPenalty(redFlags),
  };
}

function calculateContentQuality(video: VideoMetadata): number {
  let score = 15;

  const mins = video.durationSeconds / 60;
  if (mins >= 5 && mins <= 20) {
    score += 5;
  } else if (mins > 20 && mins <= 45) {
    score += 3;
  } else if (mins < 2) {
    score -= 5;
  }

  if (video.title.length > 20 && video.title.length < 100) {
    score += 3;
  }
  if (video.title === video.title.toUpperCase()) {
    score -= 3;
  }

  if (video.tags && video.tags.length > 3) {
    score += 2;
  }

  // Bonus for timestamps in description
  if (/\d{1,2}:\d{2}/.test(video.description)) {
    score += 3;
  }

  return Math.max(0, Math.min(25, score));
}

function calculateCreatorTrust(video: VideoMetadata): number {
  let score = 15;

  if (video.viewCount > 100000) {
    score += 5;
  } else if (video.viewCount > 10000) {
    score += 3;
  } else if (video.viewCount < 1000) {
    score -= 3;
  }

  if (video.description.length > 500) {
    score += 3;
  } else if (video.description.length < 100) {
    score -= 3;
  }

  if (video.commentCount && video.commentCount > 100) {
    score += 2;
  }

  return Math.max(0, Math.min(25, score));
}

function calculateEngagementHealth(video: VideoMetadata): number {
  let score = 15;

  if (video.viewCount > 0) {
    const likeRatio = video.likeCount / video.viewCount;
    if (likeRatio >= 0.05) {
      score += 7;
    } else if (likeRatio >= 0.03) {
      score += 5;
    } else if (likeRatio >= 0.02) {
      score += 2;
    } else if (likeRatio < 0.01) {
      score -= 5;
    }

    if (video.commentCount) {
      const commentRatio = video.commentCount / video.viewCount;
      if (commentRatio >= 0.01) {
        score += 3;
      }
    }
  }

  return Math.max(0, Math.min(25, score));
}

function getRecommendation(
  score: number,
  redFlags: RedFlag[],
  insights: ContentInsights
): 'watch' | 'caution' | 'skip' {
  const hasHighSeverityFlag = redFlags.some(f => f.severity === 'high');
  const isSalesPitch = insights.contentType === 'sales_pitch';

  if (isSalesPitch && hasHighSeverityFlag) {
    return 'skip';
  }

  if (score >= 70 && !hasHighSeverityFlag) {
    return 'watch';
  } else if (score >= 40 || (score >= 30 && !hasHighSeverityFlag)) {
    return 'caution';
  } else {
    return 'skip';
  }
}

function getRecommendationReason(
  score: number,
  redFlags: RedFlag[],
  greenFlags: GreenFlag[],
  insights: ContentInsights
): string {
  const highFlags = redFlags.filter(f => f.severity === 'high');

  if (score >= 70 && greenFlags.length > 2) {
    return `Strong content with ${greenFlags.length} positive signals and high engagement`;
  }

  if (highFlags.length > 0) {
    return `${highFlags.length} high-severity warning(s): ${highFlags[0].description}`;
  }

  if (insights.contentType === 'sales_pitch') {
    return 'Primary purpose appears to be selling a product or course';
  }

  if (score >= 50) {
    return 'Decent content but verify claims independently';
  }

  return 'Multiple warning signals detected - approach with skepticism';
}

function generateHighlights(
  video: VideoMetadata,
  redFlags: RedFlag[],
  greenFlags: GreenFlag[],
  insights: ContentInsights
): string[] {
  const highlights: string[] = [];

  // Content type
  if (insights.contentType) {
    highlights.push(`📺 Content type: ${insights.contentType.replace('_', ' ')}`);
  }

  // Top green flags
  greenFlags.slice(0, 2).forEach(flag => {
    highlights.push(`✅ ${flag.description}`);
  });

  // Key value prop
  if (insights.valueProposition && insights.valueProposition !== 'Not determined') {
    highlights.push(`💡 ${insights.valueProposition}`);
  }

  // High severity warnings
  const highFlags = redFlags.filter(f => f.severity === 'high');
  if (highFlags.length > 0) {
    highlights.push(`⚠️ ${highFlags.length} high-severity warning(s) detected`);
  }

  // Monetization warning
  if (insights.monetizationMethods.length > 1) {
    highlights.push(`💰 Multiple monetization: ${insights.monetizationMethods.slice(0, 2).join(', ')}`);
  }

  // Video age
  const publishDate = new Date(video.publishedAt);
  const ageMonths = Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (ageMonths > 24) {
    highlights.push('📅 Content is 2+ years old - verify info is current');
  }

  return highlights.slice(0, 6);
}
