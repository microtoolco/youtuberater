// Caption XML Parser - Parse YouTube's timedtext XML format

import { TranscriptSegment } from '../types';
import { formatTimestamp } from '../utils/youtubeUrl';

interface RawCaptionSegment {
  start: string;
  dur?: string;
  text: string;
}

/**
 * Parse YouTube's timedtext XML format into transcript segments
 */
export function parseCaptionsXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];

  // Extract all <text> elements with their attributes
  const textRegex = /<text\s+start="([^"]+)"(?:\s+dur="([^"]*)")?[^>]*>([^<]*)<\/text>/g;
  let match: RegExpExecArray | null;

  while ((match = textRegex.exec(xml)) !== null) {
    const startStr = match[1];
    const durStr = match[2] || '0';
    const rawText = match[3];

    const startSeconds = parseFloat(startStr);
    const durationSeconds = parseFloat(durStr) || 2; // Default 2s if not specified

    if (isNaN(startSeconds)) {
      continue;
    }

    // Decode HTML entities and clean text
    const text = decodeHtmlEntities(rawText).trim();

    if (!text) {
      continue;
    }

    segments.push({
      startSeconds,
      durationSeconds,
      startTimestamp: formatTimestamp(startSeconds),
      text,
    });
  }

  return segments;
}

/**
 * Decode common HTML entities in caption text
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Merge consecutive short segments for better readability
 * Combines segments that are within the time threshold
 */
export function mergeShortSegments(
  segments: TranscriptSegment[],
  maxGapSeconds: number = 0.5,
  minSegmentLength: number = 10
): TranscriptSegment[] {
  if (segments.length === 0) return [];

  const merged: TranscriptSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];
    const gap = next.startSeconds - (current.startSeconds + current.durationSeconds);

    // Merge if gap is small and combined text isn't too long
    if (gap <= maxGapSeconds && current.text.length < 200) {
      current.text += ' ' + next.text;
      current.durationSeconds = (next.startSeconds + next.durationSeconds) - current.startSeconds;
    } else {
      // Only add if text is meaningful
      if (current.text.length >= minSegmentLength || merged.length === 0) {
        merged.push(current);
      }
      current = { ...next };
    }
  }

  // Add last segment
  if (current.text.length >= minSegmentLength || merged.length === 0) {
    merged.push(current);
  }

  return merged;
}

/**
 * Combine all segments into full text
 */
export function combineToFullText(segments: TranscriptSegment[]): string {
  return segments
    .map(s => s.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
