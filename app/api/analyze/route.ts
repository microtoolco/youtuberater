// YouTube Rater - Enhanced Analysis API Endpoint
// Fast base analysis with optional transcript enrichment

import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, fetchVideoMetadata } from '@/lib/analyzers/youtube-api';
import { calculateScore } from '@/lib/analyzers/score-calculator';
import { VideoAnalysis } from '@/lib/analyzers/types';
import {
  getTranscriptCache,
  createLogger,
  TranscriptStatus,
  TranscriptInsights,
  LIMITS,
} from '@/lib/transcript';

export async function POST(request: NextRequest) {
  const logger = createLogger({ operation: 'analyze' });

  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required', code: 'MISSING_URL' },
        { status: 400 }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL', code: 'INVALID_URL' },
        { status: 400 }
      );
    }

    const log = logger.withContext({ videoId });
    log.info('Starting analysis');

    // Fetch video metadata from YouTube API
    const video = await fetchVideoMetadata(videoId);

    // Run base analysis (fast, no transcript dependency)
    const { analysis } = await calculateScore(video);

    // Check cache for transcript insights (non-blocking, best-effort)
    let transcriptStatus: TranscriptStatus = { status: 'not_fetched' };
    let transcriptInsights: TranscriptInsights | undefined;

    try {
      const cache = getTranscriptCache(log);

      if (cache.isAvailable()) {
        // Check if we have cached transcript data
        const cached = await cache.getTranscript(videoId);

        if (cached) {
          transcriptStatus = cached.status;

          // If transcript is available, also check for cached insights
          if (cached.status.status === 'available') {
            const insights = await cache.getInsights(videoId);
            if (insights) {
              transcriptInsights = insights;
              log.info('Using cached transcript insights');
            }
          }
        }
      }
    } catch (cacheError) {
      // Cache failures should never break analysis
      log.warn('Cache check failed', {
        error: cacheError instanceof Error ? cacheError.message : 'Unknown',
      });
    }

    // Build response - omit base transcript to use TranscriptStatus instead
    const response: Omit<VideoAnalysis, 'transcript'> & {
      transcript: TranscriptStatus;
      transcriptInsights?: TranscriptInsights;
      nextActions?: {
        fetchTranscriptInsights?: {
          endpoint: string;
          body: Record<string, unknown>;
        };
      };
    } = {
      success: true,
      videoId,
      video,
      analysis,
      hasTranscript: transcriptStatus.status === 'available',
      transcript: {
        ...transcriptStatus,
        // Limit preview segments
        previewSegments: transcriptStatus.previewSegments?.slice(0, LIMITS.MAX_PREVIEW_SEGMENTS),
      },
    };

    // Add insights if available
    if (transcriptInsights) {
      response.transcriptInsights = transcriptInsights;
    }

    // Add next action if transcript not yet fetched
    if (transcriptStatus.status === 'not_fetched') {
      response.nextActions = {
        fetchTranscriptInsights: {
          endpoint: '/api/transcript/enrich',
          body: { videoId, url },
        },
      };
    }

    log.info('Analysis complete', {
      score: analysis.overallScore,
      transcriptStatus: transcriptStatus.status,
      hasInsights: !!transcriptInsights,
    });

    return NextResponse.json(response);
  } catch (error) {
    // Never leak internal error details
    const message = error instanceof Error ? error.message : 'Analysis failed';
    const isKnownError = error instanceof Error && (
      message.includes('Video not found') ||
      message.includes('API key') ||
      message.includes('Invalid')
    );

    logger.error('Analysis failed', {
      error: message,
      code: isKnownError ? 'KNOWN_ERROR' : 'INTERNAL_ERROR',
    });

    return NextResponse.json(
      {
        success: false,
        error: isKnownError ? message : 'Analysis failed. Please try again.',
        code: isKnownError ? 'KNOWN_ERROR' : 'INTERNAL_ERROR',
      },
      { status: isKnownError ? 400 : 500 }
    );
  }
}
