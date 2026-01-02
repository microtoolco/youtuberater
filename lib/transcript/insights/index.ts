// Transcript Insights - Main extractor that combines all insight types

import { TranscriptData, TranscriptInsights, LIMITS } from '../types';
import { extractKeyMoments } from './keyMomentsExtractor';
import { extractSteps } from './stepsExtractor';
import { extractTools } from './toolsExtractor';
import { extractPitchSignals } from './pitchExtractor';
import { calculateContentDensity } from './contentDensityCalculator';

/**
 * Extract all insights from transcript data
 */
export function extractTranscriptInsights(
  transcript: TranscriptData,
  videoDurationSeconds: number
): TranscriptInsights {
  const { segments } = transcript;

  // Run all extractors
  const keyMoments = extractKeyMoments(segments, videoDurationSeconds);
  const steps = extractSteps(segments);
  const tools = extractTools(segments);
  const pitchSignals = extractPitchSignals(segments);
  const contentDensity = calculateContentDensity(segments, videoDurationSeconds);

  return {
    keyMoments: keyMoments.slice(0, LIMITS.MAX_KEY_MOMENTS),
    steps,
    tools,
    pitchSignals,
    contentDensity,
    extractedAt: new Date().toISOString(),
  };
}

// Re-export individual extractors for testing
export { extractKeyMoments } from './keyMomentsExtractor';
export { extractSteps } from './stepsExtractor';
export { extractTools } from './toolsExtractor';
export { extractPitchSignals, calculatePitchDensity, getOverallPitchSeverity } from './pitchExtractor';
export { calculateContentDensity, calculateContentQualityScore } from './contentDensityCalculator';
