// Pitch Extractor - Identify sales pitches, CTAs, and monetization signals

import { TranscriptSegment, PitchSignal } from '../types';

// Pitch patterns with severity
const PITCH_PATTERNS: Array<{
  pattern: RegExp;
  type: PitchSignal['type'];
  severity: PitchSignal['severity'];
}> = [
  // Course/coaching (high severity - primary monetization)
  { pattern: /\b(my|our)\s+(course|program|coaching|mentorship|masterclass)\b/i, type: 'course', severity: 'high' },
  { pattern: /\b(enroll|sign\s*up|join)\s+(now|today|my|the)\b/i, type: 'course', severity: 'high' },
  { pattern: /\b(limited\s+spots?|spots?\s+are\s+(limited|filling))\b/i, type: 'course', severity: 'high' },
  { pattern: /\b(discount|off|save)\s+\$?\d+/i, type: 'course', severity: 'medium' },
  { pattern: /\bcode\s+["']?\w+["']?\s+(for|to\s+get)/i, type: 'course', severity: 'medium' },

  // Sponsor content (medium severity)
  { pattern: /\b(sponsored?\s+by|brought\s+to\s+you\s+by)\b/i, type: 'sponsor', severity: 'medium' },
  { pattern: /\b(thanks?\s+to|shout\s*out\s+to)\s+\w+\s+(for\s+sponsor)/i, type: 'sponsor', severity: 'medium' },
  { pattern: /\bthis\s+(video|episode)\s+is\s+sponsored\b/i, type: 'sponsor', severity: 'medium' },

  // Affiliate content (medium severity)
  { pattern: /\b(affiliate|referral)\s+(link|code)\b/i, type: 'affiliate', severity: 'medium' },
  { pattern: /\b(using\s+)?(my|our)\s+(link|code)\s+(in\s+the\s+description)?\b/i, type: 'affiliate', severity: 'medium' },
  { pattern: /\bi\s+(get|earn|receive)\s+(a\s+)?commission\b/i, type: 'affiliate', severity: 'low' },
  { pattern: /\bfull\s+disclosure\b/i, type: 'affiliate', severity: 'low' },

  // Downloads/lead magnets (low-medium severity)
  { pattern: /\b(free\s+)?(download|pdf|template|checklist|guide)\s+(in\s+the\s+description|below)\b/i, type: 'download', severity: 'low' },
  { pattern: /\bgrab\s+(your|the|my)\s+(free\s+)?\w+\b/i, type: 'download', severity: 'low' },
  { pattern: /\b(get|download)\s+(your|the)\s+(free\s+)?\b/i, type: 'download', severity: 'low' },

  // Generic CTAs (low severity)
  { pattern: /\b(subscribe|hit\s+the\s+bell|like\s+this\s+video)\b/i, type: 'cta', severity: 'low' },
  { pattern: /\b(link\s+in\s+(the\s+)?description|check\s+the\s+description)\b/i, type: 'cta', severity: 'low' },
  { pattern: /\b(follow\s+me|connect\s+with\s+me)\s+(on|at)\b/i, type: 'cta', severity: 'low' },
  { pattern: /\b(leave\s+a\s+comment|comment\s+below)\b/i, type: 'cta', severity: 'low' },

  // Coaching signals (medium-high severity)
  { pattern: /\b(book|schedule)\s+(a\s+)?(call|consultation|session)\b/i, type: 'coaching', severity: 'high' },
  { pattern: /\b(work\s+with\s+me|hire\s+me|let\s+me\s+help)\b/i, type: 'coaching', severity: 'medium' },
  { pattern: /\b(one\s*-?\s*on\s*-?\s*one|1:1|private)\s+(coaching|mentoring|session)\b/i, type: 'coaching', severity: 'medium' },
];

export function extractPitchSignals(segments: TranscriptSegment[]): PitchSignal[] {
  const signals: PitchSignal[] = [];
  const seenTimestamps = new Set<number>();

  for (const segment of segments) {
    const text = segment.text;

    for (const { pattern, type, severity } of PITCH_PATTERNS) {
      if (pattern.test(text)) {
        // Avoid clustering - skip if we have a signal within 20 seconds
        const nearbySignal = [...seenTimestamps].some(
          ts => Math.abs(ts - segment.startSeconds) < 20
        );

        if (nearbySignal) {
          continue;
        }

        signals.push({
          timestamp: segment.startTimestamp,
          startSeconds: segment.startSeconds,
          text: cleanText(text, 150),
          type,
          severity,
        });

        seenTimestamps.add(segment.startSeconds);
        break; // One signal per segment
      }
    }
  }

  // Sort by timestamp
  signals.sort((a, b) => a.startSeconds - b.startSeconds);

  // Deduplicate similar signals that are close together
  return deduplicateSignals(signals);
}

function cleanText(text: string, maxLength: number): string {
  let cleaned = text.replace(/\s+/g, ' ').trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim() + '...';
  }

  return cleaned;
}

function deduplicateSignals(signals: PitchSignal[]): PitchSignal[] {
  const result: PitchSignal[] = [];

  for (const signal of signals) {
    // Check if we already have a similar signal nearby
    const duplicate = result.some(
      existing =>
        existing.type === signal.type &&
        Math.abs(existing.startSeconds - signal.startSeconds) < 60
    );

    if (!duplicate) {
      result.push(signal);
    }
  }

  return result;
}

/**
 * Calculate pitch density (signals per minute)
 */
export function calculatePitchDensity(
  signals: PitchSignal[],
  videoDurationSeconds: number
): number {
  if (videoDurationSeconds <= 0) return 0;

  const minutes = videoDurationSeconds / 60;
  return signals.length / minutes;
}

/**
 * Get overall pitch severity
 */
export function getOverallPitchSeverity(
  signals: PitchSignal[]
): 'none' | 'low' | 'medium' | 'high' {
  if (signals.length === 0) return 'none';

  const highCount = signals.filter(s => s.severity === 'high').length;
  const mediumCount = signals.filter(s => s.severity === 'medium').length;

  if (highCount >= 2) return 'high';
  if (highCount >= 1 || mediumCount >= 3) return 'medium';
  return 'low';
}
