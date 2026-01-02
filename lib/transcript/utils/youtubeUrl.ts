// YouTube URL utilities - normalization and video ID extraction

export interface ParsedYouTubeUrl {
  videoId: string;
  normalizedUrl: string;
  type: 'watch' | 'short' | 'embed' | 'share' | 'direct';
}

/**
 * Extract video ID from various YouTube URL formats
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/v/VIDEO_ID
 * - Direct video ID
 */
export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Direct video ID (11 characters, alphanumeric + underscore + hyphen)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    // Standard watch URL
    /(?:youtube\.com\/watch\?(?:[^&]+&)*v=)([a-zA-Z0-9_-]{11})/,
    // Short URL
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Shorts
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    // Embed
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Old embed format
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    // Live
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Parse and normalize a YouTube URL
 */
export function parseYouTubeUrl(url: string): ParsedYouTubeUrl | null {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return null;
  }

  let type: ParsedYouTubeUrl['type'] = 'watch';

  if (/youtu\.be\//.test(url)) {
    type = 'share';
  } else if (/\/shorts\//.test(url)) {
    type = 'short';
  } else if (/\/embed\//.test(url)) {
    type = 'embed';
  } else if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    type = 'direct';
  }

  return {
    videoId,
    normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    type,
  };
}

/**
 * Build a YouTube watch URL with optional timestamp
 */
export function buildWatchUrl(videoId: string, startSeconds?: number): string {
  let url = `https://www.youtube.com/watch?v=${videoId}`;
  if (startSeconds !== undefined && startSeconds > 0) {
    url += `&t=${Math.floor(startSeconds)}`;
  }
  return url;
}

/**
 * Format seconds to HH:MM:SS or MM:SS timestamp
 */
export function formatTimestamp(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse HH:MM:SS or MM:SS timestamp to seconds
 */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}
