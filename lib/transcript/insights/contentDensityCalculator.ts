// Content Density Calculator - Measure actionable content per minute

import { TranscriptSegment, ContentDensity } from '../types';

// Patterns that indicate actionable content
const ACTIONABLE_PATTERNS = [
  // Step markers
  /\b(step|phase)\s*#?\d+/i,
  /\b(first|second|third|next|then|finally)\s*,?\s*(you|we)/i,

  // Imperative verbs (commands/instructions)
  /\b(do|use|build|create|make|click|install|set\s*up|configure|open|go\s+to|navigate|select|choose|add|remove|copy|paste|download|upload|start|begin|stop|run|execute|type|enter|write|read|check|verify|test|try|ensure|make\s+sure)\s+/i,

  // "You should/need to" patterns
  /\byou\s+(should|need\s+to|must|have\s+to|want\s+to|can)\s+/i,
  /\b(you'll|you will)\s+(need|want|have)\s+to\s+/i,

  // "Here's how" patterns
  /\bhere'?s?\s+(how|what)\s+(to|you)/i,
  /\bthe\s+(way|trick|secret)\s+(to|is)/i,

  // Direct instructions
  /\b(remember\s+to|don'?t\s+forget\s+to|always|never)\s+/i,
  /\b(make\s+sure|be\s+sure)\s+to\s+/i,

  // Tips and recommendations
  /\b(I\s+recommend|my\s+recommendation|pro\s+tip)\b/i,
];

export function calculateContentDensity(
  segments: TranscriptSegment[],
  videoDurationSeconds: number
): ContentDensity {
  let actionableCount = 0;

  for (const segment of segments) {
    const text = segment.text;

    for (const pattern of ACTIONABLE_PATTERNS) {
      if (pattern.test(text)) {
        actionableCount++;
        break; // Count each segment once
      }
    }
  }

  const minutes = videoDurationSeconds / 60;
  const densityPerMinute = minutes > 0 ? actionableCount / minutes : 0;

  return {
    actionableStatementsPerMinute: Math.round(densityPerMinute * 10) / 10,
    totalActionableStatements: actionableCount,
    videoDurationMinutes: Math.round(minutes * 10) / 10,
    grade: gradeContentDensity(densityPerMinute),
  };
}

function gradeContentDensity(densityPerMinute: number): ContentDensity['grade'] {
  // Grading scale:
  // A: 3+ actionable statements per minute (highly instructional)
  // B: 2-3 per minute (good educational content)
  // C: 1-2 per minute (moderate value)
  // D: 0.5-1 per minute (low density)
  // F: <0.5 per minute (entertainment/filler)

  if (densityPerMinute >= 3) return 'A';
  if (densityPerMinute >= 2) return 'B';
  if (densityPerMinute >= 1) return 'C';
  if (densityPerMinute >= 0.5) return 'D';
  return 'F';
}

/**
 * Calculate content quality score (0-100) based on multiple factors
 */
export function calculateContentQualityScore(
  density: ContentDensity,
  segmentCount: number,
  videoDurationSeconds: number
): number {
  let score = 0;

  // Density contributes 40 points
  switch (density.grade) {
    case 'A': score += 40; break;
    case 'B': score += 32; break;
    case 'C': score += 24; break;
    case 'D': score += 16; break;
    case 'F': score += 8; break;
  }

  // Segment coverage (do we have transcript for most of the video?)
  // Assuming ~5 words per segment, ~150 words per minute
  const expectedSegments = (videoDurationSeconds / 60) * 30; // ~30 segments per minute
  const coverage = Math.min(1, segmentCount / expectedSegments);
  score += coverage * 30; // Up to 30 points for coverage

  // Total actionable content (absolute value matters too)
  if (density.totalActionableStatements >= 20) score += 30;
  else if (density.totalActionableStatements >= 10) score += 20;
  else if (density.totalActionableStatements >= 5) score += 10;

  return Math.min(100, Math.round(score));
}
