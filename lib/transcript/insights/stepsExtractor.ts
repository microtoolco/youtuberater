// Steps Extractor - Identify ordered steps/process in transcript

import { TranscriptSegment, Step } from '../types';

// Patterns for step markers
const STEP_PATTERNS = [
  // Numbered steps
  { pattern: /\b(step|stage|phase)\s*#?(\d+)/i, getNumber: (m: RegExpMatchArray) => parseInt(m[2], 10) },
  { pattern: /\bnumber\s*#?(\d+)/i, getNumber: (m: RegExpMatchArray) => parseInt(m[1], 10) },

  // Ordinal steps
  { pattern: /\b(first|1st)\b/i, getNumber: () => 1 },
  { pattern: /\b(second|2nd)\b/i, getNumber: () => 2 },
  { pattern: /\b(third|3rd)\b/i, getNumber: () => 3 },
  { pattern: /\b(fourth|4th)\b/i, getNumber: () => 4 },
  { pattern: /\b(fifth|5th)\b/i, getNumber: () => 5 },
  { pattern: /\b(sixth|6th)\b/i, getNumber: () => 6 },
  { pattern: /\b(seventh|7th)\b/i, getNumber: () => 7 },
  { pattern: /\b(eighth|8th)\b/i, getNumber: () => 8 },
  { pattern: /\b(ninth|9th)\b/i, getNumber: () => 9 },
  { pattern: /\b(tenth|10th)\b/i, getNumber: () => 10 },
];

// Patterns that indicate sequence continuation
const SEQUENCE_PATTERNS = [
  /\b(next|then|after\s+that|following\s+that|now)\b/i,
  /\b(finally|lastly|last\s+but\s+not\s+least)\b/i,
];

// Skip patterns (not actual content steps)
const SKIP_CONTEXT = [
  /\bstep\s+outside\b/i,
  /\bstep\s+(back|away|up|down)\b/i,
  /\bfirst\s+(off|of\s+all),?\s+(I|let\s+me)\s+(want|need|would)\b/i,
  /\bfirst,?\s+(subscribe|like|hit)\b/i,
];

export function extractSteps(segments: TranscriptSegment[]): Step[] {
  const steps: Step[] = [];
  let implicitStepNumber = 0;
  let lastStepTime = -60; // Minimum gap between steps

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const text = segment.text;

    // Skip non-content markers
    if (SKIP_CONTEXT.some(p => p.test(text))) {
      continue;
    }

    // Look for explicit step markers
    let stepNumber: number | null = null;
    let matchedPattern = false;

    for (const { pattern, getNumber } of STEP_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        stepNumber = getNumber(match);
        matchedPattern = true;
        break;
      }
    }

    // If no explicit marker, look for sequence markers
    if (!matchedPattern) {
      for (const pattern of SEQUENCE_PATTERNS) {
        if (pattern.test(text)) {
          // Only count as a step if we're building on existing steps
          if (steps.length > 0 && segment.startSeconds - lastStepTime > 20) {
            implicitStepNumber = steps.length + 1;
            stepNumber = implicitStepNumber;
            matchedPattern = true;
          }
          break;
        }
      }
    }

    if (!matchedPattern || stepNumber === null) {
      continue;
    }

    // Avoid duplicates - if we have the same step number already, skip
    if (steps.some(s => s.number === stepNumber)) {
      continue;
    }

    // Minimum gap between steps (20 seconds)
    if (segment.startSeconds - lastStepTime < 20) {
      continue;
    }

    // Build step text (combine with next segment for context)
    let stepText = text;
    if (i + 1 < segments.length) {
      stepText += ' ' + segments[i + 1].text;
    }

    steps.push({
      number: stepNumber,
      timestamp: segment.startTimestamp,
      startSeconds: segment.startSeconds,
      text: cleanStepText(stepText, 200),
    });

    lastStepTime = segment.startSeconds;
  }

  // Sort by step number and clean up sequence
  steps.sort((a, b) => a.number - b.number);

  // Renumber if there are gaps
  return steps.map((step, index) => ({
    ...step,
    number: index + 1,
  }));
}

function cleanStepText(text: string, maxLength: number): string {
  // Remove step markers from the beginning
  let cleaned = text
    .replace(/^(step|stage|phase|number)\s*#?\d+:?\s*/i, '')
    .replace(/^(first|second|third|fourth|fifth|next|then|finally),?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim() + '...';
  }

  return cleaned;
}
