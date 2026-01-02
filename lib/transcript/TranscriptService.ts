// Transcript Service - Coordinates transcript fetching across providers

import { TranscriptData, TranscriptProvider } from './types';
import { InnertubeTranscriptProvider } from './providers/InnertubeTranscriptProvider';
import { createLogger, Logger } from './utils/logger';

export class TranscriptService {
  private providers: TranscriptProvider[];
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ operation: 'TranscriptService' });

    // Initialize providers in priority order
    this.providers = [
      new InnertubeTranscriptProvider(this.logger),
      // Future: Add more providers here (e.g., AssemblyAI, etc.)
    ];

    // Sort by priority
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Fetch transcript using available providers in priority order
   * Falls back to next provider if current one fails
   */
  async fetchTranscript(videoId: string): Promise<TranscriptData | null> {
    const log = this.logger.withContext({ videoId });
    log.info('Starting transcript fetch', { providerCount: this.providers.length });

    for (const provider of this.providers) {
      try {
        log.debug(`Trying provider: ${provider.name}`);
        const transcript = await provider.fetchTranscript(videoId);

        if (transcript) {
          log.info('Successfully fetched transcript', {
            provider: provider.name,
            segmentCount: transcript.segments.length,
            language: transcript.language,
          });
          return transcript;
        }

        log.debug(`Provider ${provider.name} returned no transcript`);
      } catch (error) {
        log.warn(`Provider ${provider.name} failed`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    log.info('No transcript available from any provider');
    return null;
  }

  /**
   * Get list of available providers
   */
  getProviders(): string[] {
    return this.providers.map(p => p.name);
  }
}

// Singleton instance for convenience
let serviceInstance: TranscriptService | null = null;

export function getTranscriptService(logger?: Logger): TranscriptService {
  if (!serviceInstance) {
    serviceInstance = new TranscriptService(logger);
  }
  return serviceInstance;
}
