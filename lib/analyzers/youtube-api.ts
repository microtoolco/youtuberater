// YouTube Rater - YouTube Data API Integration

import { VideoMetadata } from './types';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'snippet,contentDetails,statistics');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', YOUTUBE_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const item = data.items[0];
  const snippet = item.snippet;
  const stats = item.statistics;
  const contentDetails = item.contentDetails;

  return {
    videoId,
    title: snippet.title,
    description: snippet.description || '',
    channelTitle: snippet.channelTitle,
    channelId: snippet.channelId,
    publishedAt: snippet.publishedAt,
    duration: contentDetails.duration,
    durationSeconds: parseDuration(contentDetails.duration),
    viewCount: parseInt(stats.viewCount || '0', 10),
    likeCount: parseInt(stats.likeCount || '0', 10),
    commentCount: stats.commentCount ? parseInt(stats.commentCount, 10) : null,
    thumbnail: snippet.thumbnails?.maxres?.url ||
               snippet.thumbnails?.high?.url ||
               snippet.thumbnails?.medium?.url ||
               `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    tags: snippet.tags || [],
  };
}

// Parse ISO 8601 duration (PT1H2M3S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
