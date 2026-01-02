import { describe, it, expect } from 'vitest';
import {
  extractPitchSignals,
  calculatePitchDensity,
  getOverallPitchSeverity,
} from '@/lib/transcript/insights/pitchExtractor';
import { TranscriptSegment, PitchSignal } from '@/lib/transcript/types';

function makeSegment(startSeconds: number, text: string): TranscriptSegment {
  const minutes = Math.floor(startSeconds / 60);
  const seconds = Math.floor(startSeconds % 60);
  return {
    startSeconds,
    durationSeconds: 5,
    startTimestamp: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    text,
  };
}

describe('extractPitchSignals', () => {
  it('detects course pitches', () => {
    const segments = [
      makeSegment(30, 'Check out my course on web development'),
      makeSegment(60, 'More content here'),
    ];

    const signals = extractPitchSignals(segments);

    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('course');
    expect(signals[0].severity).toBe('high');
  });

  it('detects coaching offers', () => {
    const segments = [
      makeSegment(30, 'Book a call with me for one-on-one coaching'),
    ];

    const signals = extractPitchSignals(segments);

    expect(signals.some(s => s.type === 'coaching')).toBe(true);
  });

  it('detects sponsor mentions', () => {
    const segments = [
      makeSegment(30, 'This video is sponsored by AwesomeProduct'),
    ];

    const signals = extractPitchSignals(segments);

    expect(signals.some(s => s.type === 'sponsor')).toBe(true);
    expect(signals[0].severity).toBe('medium');
  });

  it('detects affiliate links', () => {
    const segments = [
      makeSegment(30, 'Use my affiliate link in the description'),
    ];

    const signals = extractPitchSignals(segments);

    expect(signals.some(s => s.type === 'affiliate')).toBe(true);
  });

  it('detects download/lead magnet offers', () => {
    const segments = [
      makeSegment(30, 'Grab the free PDF checklist in the description below'),
    ];

    const signals = extractPitchSignals(segments);

    expect(signals.some(s => s.type === 'download')).toBe(true);
  });

  it('detects generic CTAs', () => {
    const segments = [
      makeSegment(30, 'Make sure to subscribe and hit the bell'),
    ];

    const signals = extractPitchSignals(segments);

    expect(signals.some(s => s.type === 'cta')).toBe(true);
    expect(signals[0].severity).toBe('low');
  });

  it('includes timestamp and text', () => {
    const segments = [
      makeSegment(65, 'Enroll in my masterclass today'),
    ];

    const signals = extractPitchSignals(segments);

    expect(signals[0].timestamp).toBe('1:05');
    expect(signals[0].startSeconds).toBe(65);
    expect(signals[0].text).toContain('masterclass');
  });

  it('avoids clustering signals within 20 seconds', () => {
    const segments = [
      makeSegment(30, 'Subscribe to my channel'),
      makeSegment(35, 'Like this video'),
      makeSegment(40, 'Hit the bell notification'),
    ];

    const signals = extractPitchSignals(segments);

    // Should only have 1 signal due to clustering prevention
    expect(signals.length).toBeLessThanOrEqual(1);
  });

  it('allows signals separated by more than 20 seconds', () => {
    const segments = [
      makeSegment(30, 'Check out my course'),
      makeSegment(100, 'This is sponsored by Company X'),
    ];

    const signals = extractPitchSignals(segments);

    expect(signals).toHaveLength(2);
  });

  it('deduplicates similar signals within 60 seconds', () => {
    const segments = [
      makeSegment(30, 'Sign up for my course'),
      makeSegment(70, 'Enroll in my course today'),
    ];

    const signals = extractPitchSignals(segments);

    // Both are course type within 60 seconds - should deduplicate
    expect(signals.filter(s => s.type === 'course').length).toBeLessThanOrEqual(1);
  });

  it('returns empty array for clean content', () => {
    const segments = [
      makeSegment(30, 'Today we will learn about JavaScript'),
      makeSegment(60, 'Variables are used to store data'),
      makeSegment(90, 'Functions allow you to reuse code'),
    ];

    const signals = extractPitchSignals(segments);

    expect(signals).toEqual([]);
  });

  it('sorts signals by timestamp', () => {
    const segments = [
      makeSegment(100, 'Check out my course'),
      makeSegment(30, 'Subscribe to the channel'),
    ];

    const signals = extractPitchSignals(segments);

    if (signals.length >= 2) {
      expect(signals[0].startSeconds).toBeLessThan(signals[1].startSeconds);
    }
  });

  it('truncates long text', () => {
    const longText = 'This is a very long pitch text '.repeat(10);
    const segments = [makeSegment(30, longText + 'check out my course')];

    const signals = extractPitchSignals(segments);

    if (signals.length > 0) {
      expect(signals[0].text.length).toBeLessThanOrEqual(153); // 150 + "..."
    }
  });
});

describe('calculatePitchDensity', () => {
  it('calculates signals per minute', () => {
    const signals: PitchSignal[] = [
      { timestamp: '0:30', startSeconds: 30, text: 'Signal 1', type: 'cta', severity: 'low' },
      { timestamp: '1:30', startSeconds: 90, text: 'Signal 2', type: 'cta', severity: 'low' },
    ];

    // 2 signals in 180 seconds (3 minutes) = 0.67 per minute
    const density = calculatePitchDensity(signals, 180);

    expect(density).toBeCloseTo(0.67, 1);
  });

  it('returns 0 for zero duration', () => {
    const signals: PitchSignal[] = [
      { timestamp: '0:00', startSeconds: 0, text: 'Signal', type: 'cta', severity: 'low' },
    ];

    expect(calculatePitchDensity(signals, 0)).toBe(0);
  });

  it('returns 0 for negative duration', () => {
    const signals: PitchSignal[] = [];

    expect(calculatePitchDensity(signals, -60)).toBe(0);
  });
});

describe('getOverallPitchSeverity', () => {
  it('returns "none" for no signals', () => {
    expect(getOverallPitchSeverity([])).toBe('none');
  });

  it('returns "high" for 2+ high severity signals', () => {
    const signals: PitchSignal[] = [
      { timestamp: '0:30', startSeconds: 30, text: '', type: 'course', severity: 'high' },
      { timestamp: '1:30', startSeconds: 90, text: '', type: 'coaching', severity: 'high' },
    ];

    expect(getOverallPitchSeverity(signals)).toBe('high');
  });

  it('returns "medium" for 1 high severity signal', () => {
    const signals: PitchSignal[] = [
      { timestamp: '0:30', startSeconds: 30, text: '', type: 'course', severity: 'high' },
    ];

    expect(getOverallPitchSeverity(signals)).toBe('medium');
  });

  it('returns "medium" for 3+ medium severity signals', () => {
    const signals: PitchSignal[] = [
      { timestamp: '0:30', startSeconds: 30, text: '', type: 'sponsor', severity: 'medium' },
      { timestamp: '1:30', startSeconds: 90, text: '', type: 'affiliate', severity: 'medium' },
      { timestamp: '2:30', startSeconds: 150, text: '', type: 'sponsor', severity: 'medium' },
    ];

    expect(getOverallPitchSeverity(signals)).toBe('medium');
  });

  it('returns "low" for only low severity signals', () => {
    const signals: PitchSignal[] = [
      { timestamp: '0:30', startSeconds: 30, text: '', type: 'cta', severity: 'low' },
      { timestamp: '1:30', startSeconds: 90, text: '', type: 'download', severity: 'low' },
    ];

    expect(getOverallPitchSeverity(signals)).toBe('low');
  });
});
