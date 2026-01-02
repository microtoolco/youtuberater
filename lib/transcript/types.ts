// Transcript Types - Core data structures for transcript enrichment

export interface TranscriptSegment {
  startSeconds: number;
  durationSeconds: number;
  startTimestamp: string; // HH:MM:SS format
  text: string;
}

export interface TranscriptData {
  videoId: string;
  language: string;
  segments: TranscriptSegment[];
  fullText: string;
  source: 'innertube' | 'youtube-transcript' | 'assemblyai' | 'komeai';
}

export interface KeyMoment {
  timestamp: string;
  startSeconds: number;
  text: string;
  type: 'tip' | 'step' | 'insight' | 'framework' | 'warning' | 'claim';
}

export interface Step {
  number: number;
  timestamp: string;
  startSeconds: number;
  text: string;
}

export interface ToolMention {
  name: string;
  timestamp: string;
  startSeconds: number;
  context: string;
  category?: 'software' | 'service' | 'platform' | 'resource';
}

export interface PitchSignal {
  timestamp: string;
  startSeconds: number;
  text: string;
  type: 'course' | 'coaching' | 'sponsor' | 'affiliate' | 'cta' | 'download';
  severity: 'low' | 'medium' | 'high';
}

export interface ContentDensity {
  actionableStatementsPerMinute: number;
  totalActionableStatements: number;
  videoDurationMinutes: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface TranscriptInsights {
  keyMoments: KeyMoment[];
  steps: Step[];
  tools: ToolMention[];
  pitchSignals: PitchSignal[];
  contentDensity: ContentDensity;
  extractedAt: string;
}

export interface TranscriptStatus {
  status: 'available' | 'not_fetched' | 'unavailable' | 'processing';
  language?: string;
  previewSegments?: TranscriptSegment[];
  reason?: string;
}

export interface TranscriptEnrichmentResponse {
  transcript: TranscriptStatus;
  transcriptInsights?: TranscriptInsights;
  cached?: boolean;
}

export interface NextAction {
  endpoint: string;
  body: Record<string, unknown>;
}

export interface AnalyzeResponseExtension {
  transcript: TranscriptStatus;
  transcriptInsights?: TranscriptInsights;
  nextActions?: {
    fetchTranscriptInsights?: NextAction;
  };
}

// Provider interface for transcript extraction
export interface TranscriptProvider {
  name: string;
  priority: number;
  fetchTranscript(videoId: string): Promise<TranscriptData | null>;
}

// Cache configuration
export const CACHE_TTL = {
  AVAILABLE_TRANSCRIPT: 14 * 24 * 60 * 60 * 1000, // 14 days
  UNAVAILABLE_TRANSCRIPT: 6 * 60 * 60 * 1000, // 6 hours
  INSIGHTS: 14 * 24 * 60 * 60 * 1000, // 14 days
} as const;

export const LIMITS = {
  MAX_PREVIEW_SEGMENTS: 30,
  MAX_KEY_MOMENTS: 15,
  MIN_KEY_MOMENTS: 8,
} as const;
