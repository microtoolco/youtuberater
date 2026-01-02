// Transcript Module - Main exports

// Types
export * from './types';

// Service
export { TranscriptService, getTranscriptService } from './TranscriptService';

// Cache
export { TranscriptCache, getTranscriptCache } from './cache/TranscriptCache';

// Insights
export { extractTranscriptInsights } from './insights';
export {
  extractKeyMoments,
  extractSteps,
  extractTools,
  extractPitchSignals,
  calculateContentDensity,
} from './insights';

// Utils
export { extractVideoId, parseYouTubeUrl, formatTimestamp, buildWatchUrl } from './utils/youtubeUrl';
export { createLogger } from './utils/logger';
export { checkRateLimit, getClientIp } from './utils/rateLimiter';

// Parsers
export { parseCaptionsXml, mergeShortSegments, combineToFullText } from './parsers/captionsXmlParser';
