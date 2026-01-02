// Kome.ai Provider - Fast YouTube transcript API
// Free tier available, returns transcripts quickly

import { TranscriptProvider, TranscriptData, TranscriptSegment } from '../types';
import { formatTimestamp } from '../utils/youtubeUrl';
import { createLogger } from '../utils/logger';

const KOME_API_URL = 'https://api.kome.ai/api/tools/youtube-transcripts';

interface KomeSegment {
  text: string;
  start?: number;
  duration?: number;
}

interface KomeResponse {
  transcript?: string | KomeSegment[];
  error?: string;
}

export class KomeAIProvider implements TranscriptProvider {
  name = 'komeai' as const;
  priority = 1.5; // Between InnerTube (1) and AssemblyAI (2)

  private logger = createLogger({ operation: 'KomeAIProvider' });

  async fetchTranscript(videoIdOrUrl: string): Promise<TranscriptData | null> {
    const log = this.logger.withContext({ videoId: videoIdOrUrl });

    // Extract video ID if full URL provided
    const videoId = this.extractVideoId(videoIdOrUrl);
    if (!videoId) {
      log.warn('Invalid video ID');
      return null;
    }

    log.info('Fetching transcript from Kome.ai');

    try {
      const response = await fetch(KOME_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: videoId,
          format: true,
        }),
      });

      if (!response.ok) {
        log.error('Kome.ai API error', { status: response.status });
        return null;
      }

      const data: KomeResponse = await response.json();

      if (!data.transcript) {
        log.debug('No transcript in response');
        return null;
      }

      // Parse transcript
      let segments: TranscriptSegment[];
      let fullText: string;

      if (Array.isArray(data.transcript)) {
        // Array of segments with timing
        segments = data.transcript
          .filter((t): t is KomeSegment => typeof t === 'object' && 'text' in t)
          .map((t, index) => ({
            startSeconds: t.start ?? index * 5,
            durationSeconds: t.duration ?? 5,
            startTimestamp: formatTimestamp(t.start ?? index * 5),
            text: t.text.trim(),
          }))
          .filter(s => s.text.length > 0);

        fullText = segments.map(s => s.text).join(' ');
      } else {
        // Plain text - create synthetic segments
        fullText = String(data.transcript)
          .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
          .replace(/\s+/g, ' ')
          .trim();

        if (fullText.length < 50) {
          log.debug('Transcript too short', { length: fullText.length });
          return null;
        }

        // Split into ~30 word segments
        const words = fullText.split(' ');
        segments = [];
        for (let i = 0; i < words.length; i += 30) {
          const chunk = words.slice(i, i + 30).join(' ');
          const estimatedStart = (i / words.length) * 600; // Estimate based on position
          segments.push({
            startSeconds: estimatedStart,
            durationSeconds: 5,
            startTimestamp: formatTimestamp(estimatedStart),
            text: chunk,
          });
        }
      }

      if (segments.length === 0) {
        log.debug('No segments extracted');
        return null;
      }

      log.info('Successfully fetched transcript', { segmentCount: segments.length });

      return {
        videoId,
        language: 'en',
        segments,
        fullText,
        source: 'komeai' as const,
      };
    } catch (error) {
      log.error('Kome.ai error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return null;
    }
  }

  private extractVideoId(input: string): string | null {
    // Already a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }

    // Extract from URL
    const patterns = [
      /(?:youtube\.com\/watch\?(?:[^&]+&)*v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match?.[1]) return match[1];
    }

    return null;
  }
}
