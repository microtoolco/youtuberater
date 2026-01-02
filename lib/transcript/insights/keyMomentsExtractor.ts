// Key Moments Extractor - Identify important moments in transcript

import { TranscriptSegment, KeyMoment, LIMITS } from '../types';

// Patterns that indicate valuable content
const KEY_MOMENT_PATTERNS = [
  // Tips and advice
  { pattern: /\b(tip|trick|hack|secret)\s*(:|is|#?\d+)?/i, type: 'tip' as const },
  { pattern: /\bhere'?s?\s+(how|what|a|the)\b/i, type: 'tip' as const },
  { pattern: /\b(pro\s*tip|quick\s*tip|hot\s*tip)/i, type: 'tip' as const },

  // Steps and process
  { pattern: /\b(step|phase)\s*#?\d+/i, type: 'step' as const },
  { pattern: /\b(first|second|third|fourth|fifth|next|then|finally|lastly)\s*,?\s*(you|we|I)/i, type: 'step' as const },
  { pattern: /\bdo\s+this\b/i, type: 'step' as const },

  // Insights and frameworks
  { pattern: /\b(framework|method|approach|strategy|technique|system)\b/i, type: 'framework' as const },
  { pattern: /\b(the\s+key|the\s+secret|the\s+trick)\s+(is|to)\b/i, type: 'insight' as const },
  { pattern: /\bmost\s+(people|beginners)\s+(don'?t|forget|miss)/i, type: 'insight' as const },

  // Warnings and mistakes
  { pattern: /\b(mistake|error|wrong|avoid|don'?t\s+do)\b/i, type: 'warning' as const },
  { pattern: /\b(common\s+)?(mistake|pitfall|trap)/i, type: 'warning' as const },
  { pattern: /\bnever\s+(do|use|make)\b/i, type: 'warning' as const },

  // Claims with numbers (often valuable data points)
  { pattern: /\$[\d,]+(\.\d+)?(\s*(per|a|an|k|K|m|M|million|thousand))?/i, type: 'claim' as const },
  { pattern: /\b\d+(\.\d+)?%\b/, type: 'claim' as const },
  { pattern: /\b(increased|grew|boosted|improved)\s+by\s+\d+/i, type: 'claim' as const },
];

// Patterns that indicate less valuable content (skip these)
const SKIP_PATTERNS = [
  /\b(subscribe|like|comment|notification|bell)\b/i,
  /\b(link\s+in\s+(the\s+)?description)\b/i,
  /\b(check\s+out|go\s+to)\s+(my|the|our)\s+(website|channel|course)/i,
  /\b(sponsor|affiliate|partnership)\b/i,
  /\b(welcome\s+(back|to)|hey\s+(guys|everyone))/i,
];

export function extractKeyMoments(
  segments: TranscriptSegment[],
  videoDurationSeconds: number
): KeyMoment[] {
  const moments: KeyMoment[] = [];
  const seenTimestamps = new Set<number>(); // Avoid duplicates close together

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const text = segment.text;

    // Skip low-value content
    if (SKIP_PATTERNS.some(p => p.test(text))) {
      continue;
    }

    // Check against key moment patterns
    for (const { pattern, type } of KEY_MOMENT_PATTERNS) {
      if (pattern.test(text)) {
        // Avoid clustering - skip if we have a moment within 30 seconds
        const nearbyMoment = [...seenTimestamps].some(
          ts => Math.abs(ts - segment.startSeconds) < 30
        );

        if (nearbyMoment) {
          continue;
        }

        // Build context (include next segment if available for more context)
        let contextText = text;
        if (i + 1 < segments.length) {
          contextText += ' ' + segments[i + 1].text;
        }

        moments.push({
          timestamp: segment.startTimestamp,
          startSeconds: segment.startSeconds,
          text: cleanText(contextText, 150),
          type,
        });

        seenTimestamps.add(segment.startSeconds);
        break; // Only one match per segment
      }
    }
  }

  // Score and sort moments
  const scored = moments.map(m => ({
    moment: m,
    score: scoreMoment(m, videoDurationSeconds),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Return top moments within limits
  const result = scored
    .slice(0, LIMITS.MAX_KEY_MOMENTS)
    .map(s => s.moment);

  // If we have too few, that's okay - don't pad with low quality
  return result;
}

function scoreMoment(moment: KeyMoment, videoDurationSeconds: number): number {
  let score = 0;

  // Type scoring
  switch (moment.type) {
    case 'step':
      score += 10;
      break;
    case 'framework':
      score += 8;
      break;
    case 'tip':
      score += 7;
      break;
    case 'warning':
      score += 6;
      break;
    case 'insight':
      score += 5;
      break;
    case 'claim':
      score += 3;
      break;
  }

  // Prefer moments in the middle of the video (more likely to be content, not intro/outro)
  const position = moment.startSeconds / videoDurationSeconds;
  if (position > 0.1 && position < 0.9) {
    score += 3;
  }
  if (position > 0.2 && position < 0.8) {
    score += 2;
  }

  // Longer text often means more context
  if (moment.text.length > 80) {
    score += 2;
  }

  return score;
}

function cleanText(text: string, maxLength: number): string {
  let cleaned = text
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim() + '...';
  }

  return cleaned;
}
