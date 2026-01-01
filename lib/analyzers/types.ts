// YouTube Rater - Analysis Types (Enhanced)

export interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  commentCount: number | null;
  thumbnail: string;
  tags: string[];
}

export interface RedFlag {
  type: RedFlagType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  points: number;
  evidence?: string;
}

export type RedFlagType =
  | 'length_gaming'
  | 'disabled_comments'
  | 'clickbait'
  | 'gatekeeping'
  | 'wealth_flex'
  | 'course_pitch'
  | 'low_engagement'
  | 'new_channel_big_claims'
  | 'excessive_cta'
  | 'misleading_title'
  | 'engagement_bait';

export interface ScoreBreakdown {
  contentQuality: number;
  creatorTrust: number;
  engagementHealth: number;
  redFlagPenalty: number;
}

// Granular metrics for deep analysis
export interface GranularMetrics {
  likeToViewRatio: number;
  commentToViewRatio: number;
  engagementGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  titleClickbaitScore: number;
  descriptionQuality: number;
  contentDensityEstimate: number;
  channelConsistency: string;
  uploadFrequency: string;
  isShortForm: boolean;
  hasChapters: boolean;
  hasTimestamps: boolean;
  estimatedAdBreaks: number;
}

// AI-extracted content insights
export interface ContentInsights {
  summary: string;
  targetAudience: string;
  contentType: string;
  keyPoints: string[];
  actionableSteps: string[];
  toolsMentioned: string[];
  resourcesLinked: string[];
  valueProposition: string;
  uniqueInsights: string[];
  potentialBias: string[];
  monetizationMethods: string[];
  callToActions: string[];
  affiliateIndicators: string[];
  contentWarnings: string[];
  factCheckFlags: string[];
}

// Green flags (positive signals)
export interface GreenFlag {
  type: string;
  description: string;
  points: number;
}

export interface AnalysisResult {
  overallScore: number;
  recommendation: 'watch' | 'caution' | 'skip';
  recommendationReason: string;
  breakdown: ScoreBreakdown;
  redFlags: RedFlag[];
  greenFlags: GreenFlag[];
  highlights: string[];
  analyzedAt: string;
  granularMetrics: GranularMetrics;
  contentInsights: ContentInsights;
  verdict: {
    watchTime: string;
    bestFor: string;
    skipIf: string;
    tldr: string;
  };
}

export interface IntroAnalysis {
  skipToTimestamp: number;
  skipToFormatted: string;
  introLength: number;
  confidence: 'high' | 'medium' | 'low';
  detectionReason: string;
}

export interface VideoAnalysis {
  success: boolean;
  videoId: string;
  video: VideoMetadata;
  analysis: AnalysisResult;
  transcript?: string;
  hasTranscript: boolean;
  introAnalysis?: IntroAnalysis;
  cached?: boolean;
  error?: string;
}
