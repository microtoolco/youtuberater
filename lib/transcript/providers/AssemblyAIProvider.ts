// AssemblyAI Provider - Fallback transcription for videos without captions
// Cost: ~$0.00025/second ($0.90/hour of audio)

import { TranscriptProvider, TranscriptData, TranscriptSegment } from '../types';
import { formatTimestamp, buildWatchUrl } from '../utils/youtubeUrl';
import { createLogger } from '../utils/logger';

const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

interface Word {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

interface TranscriptResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  words?: Word[];
  error?: string;
}

export class AssemblyAIProvider implements TranscriptProvider {
  name = 'assemblyai' as const;
  priority = 2; // Lower priority than InnerTube (used as fallback)

  private apiKey: string | undefined;
  private logger = createLogger({ operation: 'AssemblyAIProvider' });

  constructor() {
    this.apiKey = process.env.ASSEMBLYAI_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async fetchTranscript(videoIdOrUrl: string): Promise<TranscriptData | null> {
    if (!this.apiKey) {
      this.logger.warn('AssemblyAI API key not configured');
      return null;
    }

    const log = this.logger.withContext({ videoId: videoIdOrUrl });

    // Build full YouTube URL for AssemblyAI
    const videoUrl = videoIdOrUrl.startsWith('http')
      ? videoIdOrUrl
      : buildWatchUrl(videoIdOrUrl);

    log.info('Starting AssemblyAI transcription');

    try {
      // Step 1: Submit the YouTube URL for transcription
      const submitResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: videoUrl,
        }),
      });

      if (!submitResponse.ok) {
        const error = await submitResponse.text();
        log.error('AssemblyAI submit failed', { error });
        return null;
      }

      const submitData: TranscriptResponse = await submitResponse.json();
      const transcriptId = submitData.id;

      log.info('AssemblyAI job submitted', { transcriptId });

      // Step 2: Poll for completion (max 5 minutes)
      const maxAttempts = 60; // 60 * 5 seconds = 5 minutes
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

        const pollResponse = await fetch(
          `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
          {
            headers: {
              'Authorization': this.apiKey!,
            },
          }
        );

        if (!pollResponse.ok) {
          log.error('AssemblyAI poll failed', { status: pollResponse.status });
          return null;
        }

        const pollData: TranscriptResponse = await pollResponse.json();

        if (pollData.status === 'completed' && pollData.words) {
          log.info('AssemblyAI transcription complete', { wordCount: pollData.words.length });

          // Convert words to segments
          const segments = this.wordsToSegments(pollData.words);
          const fullText = pollData.text || segments.map(s => s.text).join(' ');

          return {
            videoId: videoIdOrUrl,
            language: 'en', // AssemblyAI defaults to English
            segments,
            fullText,
            source: 'assemblyai',
          };
        }

        if (pollData.status === 'error') {
          log.error('AssemblyAI transcription error', { error: pollData.error });
          return null;
        }

        log.debug('AssemblyAI polling', { status: pollData.status, attempt: attempts + 1 });
        attempts++;
      }

      log.error('AssemblyAI transcription timed out');
      return null;
    } catch (error) {
      log.error('AssemblyAI error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return null;
    }
  }

  /**
   * Convert AssemblyAI words array to transcript segments (~5 second chunks)
   */
  private wordsToSegments(words: Word[]): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    let currentWords: string[] = [];
    let segmentStart: number | null = null;
    let lastEnd = 0;

    for (const word of words) {
      const wordTimeSeconds = word.start / 1000;

      if (segmentStart === null) {
        segmentStart = wordTimeSeconds;
        currentWords = [word.text];
        lastEnd = word.end / 1000;
      } else if (wordTimeSeconds - segmentStart > 5) {
        // Create segment every ~5 seconds
        segments.push({
          startSeconds: segmentStart,
          durationSeconds: lastEnd - segmentStart,
          startTimestamp: formatTimestamp(segmentStart),
          text: currentWords.join(' '),
        });

        segmentStart = wordTimeSeconds;
        currentWords = [word.text];
        lastEnd = word.end / 1000;
      } else {
        currentWords.push(word.text);
        lastEnd = word.end / 1000;
      }
    }

    // Push final segment
    if (segmentStart !== null && currentWords.length > 0) {
      segments.push({
        startSeconds: segmentStart,
        durationSeconds: lastEnd - segmentStart,
        startTimestamp: formatTimestamp(segmentStart),
        text: currentWords.join(' '),
      });
    }

    return segments;
  }
}
