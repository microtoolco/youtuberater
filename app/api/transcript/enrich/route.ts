// YouTube Rater - Transcript Enrichment API Endpoint
// Fetches transcript and extracts insights with caching

import { NextRequest, NextResponse } from 'next/server';
import {
  getTranscriptService,
  getTranscriptCache,
  extractTranscriptInsights,
  createLogger,
  checkRateLimit,
  getClientIp,
  TranscriptStatus,
  TranscriptInsights,
  TranscriptEnrichmentResponse,
  LIMITS,
} from '@/lib/transcript';
import { extractVideoId } from '@/lib/transcript/utils/youtubeUrl';

// Rate limit config: 10 requests per minute per IP
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,
  maxRequests: 10,
};

export async function POST(request: NextRequest) {
  const logger = createLogger({ operation: 'transcript/enrich' });
  const requestId = logger.getRequestId();

  // Rate limiting
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit('transcript/enrich', clientIp, RATE_LIMIT_CONFIG);

  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { clientIp });
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: rateLimit.headers,
      }
    );
  }

  try {
    const body = await request.json();
    const { videoId: rawVideoId, url, force = false } = body;

    // Extract video ID (support both videoId and url params)
    const videoId = rawVideoId || (url ? extractVideoId(url) : null);

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'videoId or url is required',
          code: 'MISSING_VIDEO_ID',
        },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const log = logger.withContext({ videoId, requestId });
    log.info('Starting transcript enrichment', { force });

    const cache = getTranscriptCache(log);
    const service = getTranscriptService(log);

    // Check cache first (unless force refresh)
    if (!force && cache.isAvailable()) {
      const cachedTranscript = await cache.getTranscript(videoId);
      const cachedInsights = await cache.getInsights(videoId);

      if (cachedTranscript && cachedInsights) {
        log.info('Returning cached transcript insights');

        const response: TranscriptEnrichmentResponse = {
          transcript: {
            ...cachedTranscript.status,
            previewSegments: cachedTranscript.status.previewSegments?.slice(
              0,
              LIMITS.MAX_PREVIEW_SEGMENTS
            ),
          },
          transcriptInsights: cachedInsights,
          cached: true,
        };

        return NextResponse.json(response, { headers: rateLimit.headers });
      }

      // Check if we cached an unavailable status recently
      if (cachedTranscript?.status.status === 'unavailable') {
        log.info('Transcript previously marked unavailable');

        const response: TranscriptEnrichmentResponse = {
          transcript: cachedTranscript.status,
          cached: true,
        };

        return NextResponse.json(response, { headers: rateLimit.headers });
      }
    }

    // Fetch transcript
    log.info('Fetching transcript from providers');
    const transcriptData = await service.fetchTranscript(videoId);

    let transcriptStatus: TranscriptStatus;
    let transcriptInsights: TranscriptInsights | undefined;

    if (!transcriptData) {
      // Transcript unavailable
      transcriptStatus = {
        status: 'unavailable',
        reason: 'No captions available for this video',
      };

      // Cache the unavailable status (with short TTL)
      if (cache.isAvailable()) {
        await cache.setTranscript(videoId, null, 'No captions available');
      }

      log.info('Transcript unavailable');
    } else {
      // Extract insights
      log.info('Extracting transcript insights', {
        segmentCount: transcriptData.segments.length,
        language: transcriptData.language,
      });

      // Need video duration for insight extraction
      // Estimate from transcript (last segment end time)
      const lastSegment = transcriptData.segments[transcriptData.segments.length - 1];
      const estimatedDuration = lastSegment
        ? lastSegment.startSeconds + lastSegment.durationSeconds
        : 600; // Default to 10 min if unknown

      transcriptInsights = extractTranscriptInsights(transcriptData, estimatedDuration);

      transcriptStatus = {
        status: 'available',
        language: transcriptData.language,
        previewSegments: transcriptData.segments.slice(0, LIMITS.MAX_PREVIEW_SEGMENTS),
      };

      // Cache transcript and insights
      if (cache.isAvailable()) {
        await Promise.all([
          cache.setTranscript(videoId, transcriptData),
          cache.setInsights(videoId, transcriptInsights),
        ]);
      }

      log.info('Transcript insights extracted', {
        keyMoments: transcriptInsights.keyMoments.length,
        steps: transcriptInsights.steps.length,
        tools: transcriptInsights.tools.length,
        pitchSignals: transcriptInsights.pitchSignals.length,
        contentDensityGrade: transcriptInsights.contentDensity.grade,
      });
    }

    // Build response
    const response: TranscriptEnrichmentResponse = {
      transcript: transcriptStatus,
      transcriptInsights,
      cached: false,
    };

    return NextResponse.json(response, { headers: rateLimit.headers });
  } catch (error) {
    // Never leak internal error details or API keys
    const message = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Transcript enrichment failed', {
      error: message,
      code: 'ENRICHMENT_ERROR',
    });

    // Return a safe error message
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transcript. Please try again.',
        code: 'ENRICHMENT_ERROR',
        transcript: {
          status: 'unavailable' as const,
          reason: 'Temporary error fetching transcript',
        },
      },
      {
        status: 500,
        headers: {
          ...checkRateLimit('transcript/enrich', getClientIp(request.headers), RATE_LIMIT_CONFIG).headers,
        },
      }
    );
  }
}
