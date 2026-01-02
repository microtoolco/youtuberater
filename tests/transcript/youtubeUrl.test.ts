import { describe, it, expect } from 'vitest';
import {
  extractVideoId,
  parseYouTubeUrl,
  buildWatchUrl,
  formatTimestamp,
  parseTimestamp,
} from '@/lib/transcript/utils/youtubeUrl';

describe('extractVideoId', () => {
  it('extracts video ID from standard watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from watch URL with additional params', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from short URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ?t=30')).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from shorts URL', () => {
    expect(extractVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://www.youtube.com/shorts/abc123_XY-z')).toBe('abc123_XY-z');
  });

  it('extracts video ID from embed URL', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from old embed format', () => {
    expect(extractVideoId('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from live URL', () => {
    expect(extractVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('accepts direct video ID', () => {
    expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('abc123_XY-z')).toBe('abc123_XY-z');
  });

  it('handles whitespace', () => {
    expect(extractVideoId('  dQw4w9WgXcQ  ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('  https://youtu.be/dQw4w9WgXcQ  ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid input', () => {
    expect(extractVideoId('')).toBeNull();
    expect(extractVideoId('not a url')).toBeNull();
    expect(extractVideoId('https://example.com/video')).toBeNull();
    expect(extractVideoId('abc')).toBeNull(); // Too short
    expect(extractVideoId('abc123456789012')).toBeNull(); // Too long
  });

  it('returns null for null/undefined input', () => {
    expect(extractVideoId(null as unknown as string)).toBeNull();
    expect(extractVideoId(undefined as unknown as string)).toBeNull();
  });
});

describe('parseYouTubeUrl', () => {
  it('parses standard watch URL', () => {
    const result = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      normalizedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'watch',
    });
  });

  it('parses short URL with correct type', () => {
    const result = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      normalizedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'share',
    });
  });

  it('parses shorts URL with correct type', () => {
    const result = parseYouTubeUrl('https://youtube.com/shorts/dQw4w9WgXcQ');
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      normalizedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'short',
    });
  });

  it('parses embed URL with correct type', () => {
    const result = parseYouTubeUrl('https://youtube.com/embed/dQw4w9WgXcQ');
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      normalizedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'embed',
    });
  });

  it('parses direct video ID with correct type', () => {
    const result = parseYouTubeUrl('dQw4w9WgXcQ');
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      normalizedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'direct',
    });
  });

  it('returns null for invalid URL', () => {
    expect(parseYouTubeUrl('not a valid url')).toBeNull();
    expect(parseYouTubeUrl('')).toBeNull();
  });
});

describe('buildWatchUrl', () => {
  it('builds basic watch URL', () => {
    expect(buildWatchUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('builds watch URL with timestamp', () => {
    expect(buildWatchUrl('dQw4w9WgXcQ', 120)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120');
    expect(buildWatchUrl('dQw4w9WgXcQ', 90.5)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90');
  });

  it('does not add timestamp for 0 seconds', () => {
    expect(buildWatchUrl('dQw4w9WgXcQ', 0)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('does not add timestamp for undefined', () => {
    expect(buildWatchUrl('dQw4w9WgXcQ', undefined)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });
});

describe('formatTimestamp', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatTimestamp(0)).toBe('0:00');
    expect(formatTimestamp(30)).toBe('0:30');
    expect(formatTimestamp(65)).toBe('1:05');
    expect(formatTimestamp(599)).toBe('9:59');
  });

  it('formats seconds to HH:MM:SS for long videos', () => {
    expect(formatTimestamp(3600)).toBe('1:00:00');
    expect(formatTimestamp(3661)).toBe('1:01:01');
    expect(formatTimestamp(7325)).toBe('2:02:05');
  });

  it('handles decimal seconds', () => {
    expect(formatTimestamp(30.7)).toBe('0:30');
    expect(formatTimestamp(59.9)).toBe('0:59');
  });
});

describe('parseTimestamp', () => {
  it('parses MM:SS format', () => {
    expect(parseTimestamp('0:00')).toBe(0);
    expect(parseTimestamp('0:30')).toBe(30);
    expect(parseTimestamp('1:05')).toBe(65);
    expect(parseTimestamp('10:30')).toBe(630);
  });

  it('parses HH:MM:SS format', () => {
    expect(parseTimestamp('1:00:00')).toBe(3600);
    expect(parseTimestamp('1:30:45')).toBe(5445);
    expect(parseTimestamp('2:00:00')).toBe(7200);
  });

  it('returns 0 for invalid input', () => {
    expect(parseTimestamp('')).toBe(0);
    expect(parseTimestamp('invalid')).toBe(0);
  });
});
