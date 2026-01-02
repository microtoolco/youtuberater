// Transcript Cache - Supabase-based caching for transcripts and insights

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  TranscriptData,
  TranscriptSegment,
  TranscriptInsights,
  TranscriptStatus,
  CACHE_TTL,
  LIMITS,
} from '../types';
import { createLogger, Logger } from '../utils/logger';

interface CachedTranscript {
  video_id: string;
  language: string | null;
  segments_json: TranscriptSegment[] | null;
  full_text: string | null;
  source: string;
  status: string;
  reason: string | null;
  created_at: string;
  expires_at: string;
}

interface CachedInsights {
  video_id: string;
  insights_json: TranscriptInsights;
  created_at: string;
  expires_at: string;
}

export class TranscriptCache {
  private supabase: ReturnType<typeof createSupabaseClient> | null = null;
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ operation: 'TranscriptCache' });
    this.initSupabase();
  }

  private initSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || url.includes('placeholder')) {
      this.logger.warn('Supabase not configured, caching disabled');
      return;
    }

    try {
      this.supabase = createSupabaseClient(url, key);
      this.logger.info('Supabase cache initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Supabase', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  /**
   * Check if caching is available
   */
  isAvailable(): boolean {
    return this.supabase !== null;
  }

  /**
   * Get cached transcript for a video
   */
  async getTranscript(videoId: string): Promise<{
    data: TranscriptData | null;
    status: TranscriptStatus;
  } | null> {
    if (!this.supabase) return null;

    const log = this.logger.withContext({ videoId });

    try {
      const { data, error } = await this.supabase
        .from('video_transcripts')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (error || !data) {
        log.debug('No cached transcript found');
        return null;
      }

      const cached = data as CachedTranscript;

      // Check if expired
      if (new Date(cached.expires_at) < new Date()) {
        log.debug('Cached transcript expired');
        return null;
      }

      // Build status
      const status: TranscriptStatus = {
        status: cached.status as TranscriptStatus['status'],
        language: cached.language || undefined,
        reason: cached.reason || undefined,
      };

      // If unavailable, just return status
      if (cached.status === 'unavailable') {
        return { data: null, status };
      }

      // Build transcript data
      const segments = cached.segments_json || [];
      status.previewSegments = segments.slice(0, LIMITS.MAX_PREVIEW_SEGMENTS);

      const transcriptData: TranscriptData = {
        videoId,
        language: cached.language || 'en',
        segments,
        fullText: cached.full_text || '',
        source: cached.source as TranscriptData['source'],
      };

      log.debug('Retrieved cached transcript', { segmentCount: segments.length });

      return { data: transcriptData, status };
    } catch (error) {
      log.error('Failed to get cached transcript', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return null;
    }
  }

  /**
   * Cache a transcript
   */
  async setTranscript(
    videoId: string,
    transcript: TranscriptData | null,
    reason?: string
  ): Promise<boolean> {
    if (!this.supabase) return false;

    const log = this.logger.withContext({ videoId });

    try {
      const now = new Date();
      const ttl = transcript
        ? CACHE_TTL.AVAILABLE_TRANSCRIPT
        : CACHE_TTL.UNAVAILABLE_TRANSCRIPT;
      const expiresAt = new Date(now.getTime() + ttl);

      const record = {
        video_id: videoId,
        language: transcript?.language || null,
        segments_json: transcript?.segments || null,
        full_text: transcript?.fullText || null,
        source: transcript?.source || 'unknown',
        status: transcript ? 'available' : 'unavailable',
        reason: reason || null,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('video_transcripts')
        .upsert(record, { onConflict: 'video_id' });

      if (error) {
        log.error('Failed to cache transcript', { error: error.message });
        return false;
      }

      log.info('Cached transcript', {
        status: record.status,
        ttlMinutes: Math.round(ttl / 60000),
      });

      return true;
    } catch (error) {
      log.error('Failed to cache transcript', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  }

  /**
   * Get cached insights for a video
   */
  async getInsights(videoId: string): Promise<TranscriptInsights | null> {
    if (!this.supabase) return null;

    const log = this.logger.withContext({ videoId });

    try {
      const { data, error } = await this.supabase
        .from('transcript_insights')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (error || !data) {
        log.debug('No cached insights found');
        return null;
      }

      const cached = data as CachedInsights;

      // Check if expired
      if (new Date(cached.expires_at) < new Date()) {
        log.debug('Cached insights expired');
        return null;
      }

      log.debug('Retrieved cached insights');
      return cached.insights_json;
    } catch (error) {
      log.error('Failed to get cached insights', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return null;
    }
  }

  /**
   * Cache insights for a video
   */
  async setInsights(videoId: string, insights: TranscriptInsights): Promise<boolean> {
    if (!this.supabase) return false;

    const log = this.logger.withContext({ videoId });

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_TTL.INSIGHTS);

      const record = {
        video_id: videoId,
        insights_json: insights,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('transcript_insights')
        .upsert(record, { onConflict: 'video_id' });

      if (error) {
        log.error('Failed to cache insights', { error: error.message });
        return false;
      }

      log.info('Cached insights', {
        keyMoments: insights.keyMoments.length,
        steps: insights.steps.length,
        tools: insights.tools.length,
      });

      return true;
    } catch (error) {
      log.error('Failed to cache insights', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  }

  /**
   * Check if transcript exists and is fresh
   */
  async hasTranscript(videoId: string): Promise<{
    exists: boolean;
    status?: TranscriptStatus['status'];
    fresh: boolean;
  }> {
    if (!this.supabase) {
      return { exists: false, fresh: false };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase as any)
        .from('video_transcripts')
        .select('status, expires_at')
        .eq('video_id', videoId)
        .single();

      if (error || !data) {
        return { exists: false, fresh: false };
      }

      const fresh = new Date(data.expires_at) > new Date();
      return {
        exists: true,
        status: data.status as TranscriptStatus['status'],
        fresh,
      };
    } catch {
      return { exists: false, fresh: false };
    }
  }
}

// Singleton instance
let cacheInstance: TranscriptCache | null = null;

export function getTranscriptCache(logger?: Logger): TranscriptCache {
  if (!cacheInstance) {
    cacheInstance = new TranscriptCache(logger);
  }
  return cacheInstance;
}
