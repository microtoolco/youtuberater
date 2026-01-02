// InnerTube Transcript Provider - Extract transcripts using YouTube's internal API

import { TranscriptProvider, TranscriptData, TranscriptSegment } from '../types';
import { extractVideoId } from '../utils/youtubeUrl';
import { parseCaptionsXml, combineToFullText } from '../parsers/captionsXmlParser';
import { httpGet, httpPost, HttpError } from '../utils/httpClient';
import { createLogger, Logger } from '../utils/logger';

interface InnertubeConfig {
  apiKey: string;
  clientName: string;
  clientVersion: string;
  visitorData?: string;
  userAgent: string;
}

interface CaptionTrack {
  baseUrl: string;
  name: { simpleText?: string; runs?: Array<{ text: string }> };
  languageCode: string;
  kind?: string; // 'asr' for auto-generated
  isTranslatable?: boolean;
}

interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
  playabilityStatus?: {
    status: string;
    reason?: string;
  };
}

export class InnertubeTranscriptProvider implements TranscriptProvider {
  name = 'innertube';
  priority = 1;

  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ operation: 'innertube' });
  }

  async fetchTranscript(videoIdOrUrl: string): Promise<TranscriptData | null> {
    const videoId = extractVideoId(videoIdOrUrl);
    if (!videoId) {
      this.logger.warn('Invalid video ID or URL', { input: videoIdOrUrl.slice(0, 50) });
      return null;
    }

    const log = this.logger.withContext({ videoId });
    log.info('Fetching transcript via InnerTube');

    try {
      // Step 1: Get watch page HTML
      const watchPageHtml = await this.fetchWatchPage(videoId, log);
      if (!watchPageHtml) {
        return null;
      }

      // Step 2: Extract InnerTube config from HTML
      const config = this.extractInnertubeConfig(watchPageHtml, log);
      if (!config) {
        log.warn('Could not extract InnerTube config');
        return null;
      }

      // Step 3: Call InnerTube player endpoint
      const playerResponse = await this.fetchPlayerResponse(videoId, config, log);
      if (!playerResponse) {
        return null;
      }

      // Step 4: Get best caption track
      const captionTrack = this.selectBestCaptionTrack(playerResponse, log);
      if (!captionTrack) {
        log.info('No captions available for video');
        return null;
      }

      // Step 5: Fetch caption XML
      const segments = await this.fetchCaptionSegments(captionTrack, log);
      if (!segments || segments.length === 0) {
        log.warn('No segments parsed from captions');
        return null;
      }

      log.info('Successfully fetched transcript', {
        segmentCount: segments.length,
        language: captionTrack.languageCode,
      });

      return {
        videoId,
        language: captionTrack.languageCode,
        segments,
        fullText: combineToFullText(segments),
        source: 'innertube',
      };
    } catch (error) {
      // Never leak sensitive data in errors
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = error instanceof HttpError ? error.code : 'UNKNOWN';
      log.error('Failed to fetch transcript', { errorCode: code, message });
      return null;
    }
  }

  private async fetchWatchPage(videoId: string, log: Logger): Promise<string | null> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      const response = await httpGet(url, {
        timeout: 15000,
        retries: 2,
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }, log);

      return response.data;
    } catch (error) {
      log.error('Failed to fetch watch page', {
        errorCode: error instanceof HttpError ? error.code : 'FETCH_ERROR',
      });
      return null;
    }
  }

  private extractInnertubeConfig(html: string, log: Logger): InnertubeConfig | null {
    try {
      // Extract INNERTUBE_API_KEY
      const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
      const apiKey = apiKeyMatch?.[1];

      if (!apiKey) {
        log.debug('Could not find INNERTUBE_API_KEY');
        return null;
      }

      // Extract client info
      const clientNameMatch = html.match(/"INNERTUBE_CLIENT_NAME":"([^"]+)"/);
      const clientVersionMatch = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/);

      const clientName = clientNameMatch?.[1] || 'WEB';
      const clientVersion = clientVersionMatch?.[1] || '2.20231219.04.00';

      // Extract visitor data (optional)
      const visitorDataMatch = html.match(/"visitorData":"([^"]+)"/);
      const visitorData = visitorDataMatch?.[1];

      // Default user agent
      const userAgent = 'com.google.android.youtube/17.36.4 (Linux; U; Android 12; US) gzip';

      log.debug('Extracted InnerTube config', { clientName, clientVersion });

      return {
        apiKey,
        clientName,
        clientVersion,
        visitorData,
        userAgent,
      };
    } catch (error) {
      log.error('Failed to parse InnerTube config');
      return null;
    }
  }

  private async fetchPlayerResponse(
    videoId: string,
    config: InnertubeConfig,
    log: Logger
  ): Promise<PlayerResponse | null> {
    const url = `https://www.youtube.com/youtubei/v1/player?key=${config.apiKey}`;

    // Use Android client context for better caption access
    const body = {
      videoId,
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '17.36.4',
          androidSdkVersion: 31,
          hl: 'en',
          gl: 'US',
          utcOffsetMinutes: 0,
        },
      },
      params: 'CgIQBg==', // Request captions
    };

    try {
      const response = await httpPost<PlayerResponse>(url, body, {
        timeout: 15000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': config.userAgent,
          'X-YouTube-Client-Name': '3', // Android
          'X-YouTube-Client-Version': '17.36.4',
        },
      }, log);

      const playerResponse = response.data;

      // Check playability
      if (playerResponse.playabilityStatus?.status !== 'OK') {
        log.warn('Video not playable', {
          status: playerResponse.playabilityStatus?.status,
        });
        return null;
      }

      return playerResponse;
    } catch (error) {
      log.error('Failed to fetch player response', {
        errorCode: error instanceof HttpError ? error.code : 'PLAYER_ERROR',
      });
      return null;
    }
  }

  private selectBestCaptionTrack(
    playerResponse: PlayerResponse,
    log: Logger
  ): CaptionTrack | null {
    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks || tracks.length === 0) {
      return null;
    }

    log.debug('Available caption tracks', {
      count: tracks.length,
      languages: tracks.map(t => t.languageCode).join(', '),
    });

    // Priority:
    // 1. Manual English captions
    // 2. Auto-generated English captions
    // 3. Any manual captions
    // 4. Any auto-generated captions

    // Find manual English
    const manualEnglish = tracks.find(
      t => t.languageCode.startsWith('en') && t.kind !== 'asr'
    );
    if (manualEnglish) {
      log.debug('Selected manual English captions');
      return manualEnglish;
    }

    // Find auto English
    const autoEnglish = tracks.find(
      t => t.languageCode.startsWith('en') && t.kind === 'asr'
    );
    if (autoEnglish) {
      log.debug('Selected auto-generated English captions');
      return autoEnglish;
    }

    // Find any manual
    const anyManual = tracks.find(t => t.kind !== 'asr');
    if (anyManual) {
      log.debug('Selected manual captions', { language: anyManual.languageCode });
      return anyManual;
    }

    // Return first available
    log.debug('Selected first available captions', { language: tracks[0].languageCode });
    return tracks[0];
  }

  private async fetchCaptionSegments(
    track: CaptionTrack,
    log: Logger
  ): Promise<TranscriptSegment[] | null> {
    // Ensure XML format
    let url = track.baseUrl;
    if (!url.includes('fmt=')) {
      url += (url.includes('?') ? '&' : '?') + 'fmt=srv3';
    }

    try {
      const response = await httpGet(url, {
        timeout: 10000,
        retries: 2,
      }, log);

      const segments = parseCaptionsXml(response.data);
      return segments;
    } catch (error) {
      log.error('Failed to fetch caption XML', {
        errorCode: error instanceof HttpError ? error.code : 'CAPTION_ERROR',
      });
      return null;
    }
  }
}
