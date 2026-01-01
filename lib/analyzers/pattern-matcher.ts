// YouTube Rater - Red Flag Pattern Matcher

import { RedFlag, RedFlagType, VideoMetadata } from './types';

// Gatekeeping language patterns
const GATEKEEPING_PATTERNS = [
  { pattern: /how i made \$[\d,]+/i, description: 'Income claim in title' },
  { pattern: /secret (method|strategy|trick|formula)/i, description: '"Secret method" language' },
  { pattern: /no one is telling you/i, description: 'Conspiracy framing' },
  { pattern: /what they don't want you to know/i, description: 'Hidden knowledge claim' },
  { pattern: /revealed|exposing|exposed/i, description: 'Revelation language' },
  { pattern: /\$[\d,]+\s*(per|a|\/)\s*(day|month|week|hour)/i, description: 'Specific income promise' },
  { pattern: /quit (my|your) (job|9-5)/i, description: 'Quit your job promise' },
  { pattern: /passive income/i, description: 'Passive income claim' },
];

// Course/pitch patterns in description
const COURSE_PITCH_PATTERNS = [
  { pattern: /sign up for my (course|program|coaching|mentorship)/i, description: 'Direct course pitch' },
  { pattern: /limited spots/i, description: 'Scarcity tactic' },
  { pattern: /link in (description|bio)/i, description: 'Funnel redirect' },
  { pattern: /free (training|webinar|masterclass)/i, description: 'Lead magnet funnel' },
  { pattern: /discount code/i, description: 'Affiliate marketing' },
  { pattern: /use code .{2,20} for/i, description: 'Promo code push' },
];

// Wealth flex indicators in title
const WEALTH_FLEX_PATTERNS = [
  { pattern: /lamborghini|ferrari|porsche|bentley|rolls royce/i, description: 'Luxury car mention' },
  { pattern: /mansion|penthouse/i, description: 'Luxury property mention' },
  { pattern: /rolex|richard mille/i, description: 'Luxury watch mention' },
  { pattern: /millionaire|billionaire/i, description: 'Wealth status claim' },
];

export function detectRedFlags(video: VideoMetadata): RedFlag[] {
  const flags: RedFlag[] = [];
  const text = `${video.title} ${video.description}`.toLowerCase();
  const titleOnly = video.title.toLowerCase();

  // 1. Check for 10:01 video length (ad threshold gaming)
  if (video.durationSeconds >= 601 && video.durationSeconds <= 620) {
    flags.push({
      type: 'length_gaming',
      severity: 'medium',
      description: `Video is ${formatDuration(video.durationSeconds)} (ad threshold gaming)`,
      points: 8,
    });
  }

  // 2. Check for disabled comments
  if (video.commentCount === null || video.commentCount === 0) {
    flags.push({
      type: 'disabled_comments',
      severity: 'high',
      description: 'Comments are disabled (hiding feedback)',
      points: 15,
    });
  }

  // 3. Check for gatekeeping language
  for (const { pattern, description } of GATEKEEPING_PATTERNS) {
    if (pattern.test(titleOnly)) {
      flags.push({
        type: 'gatekeeping',
        severity: 'high',
        description,
        points: 12,
      });
      break; // Only flag once for gatekeeping
    }
  }

  // 4. Check for course/pitch indicators
  let coursePitchCount = 0;
  for (const { pattern, description } of COURSE_PITCH_PATTERNS) {
    if (pattern.test(video.description)) {
      coursePitchCount++;
      if (coursePitchCount === 1) {
        flags.push({
          type: 'course_pitch',
          severity: 'medium',
          description: `Course/pitch detected: ${description}`,
          points: 10,
        });
      }
    }
  }

  // 5. Check for wealth flex
  for (const { pattern, description } of WEALTH_FLEX_PATTERNS) {
    if (pattern.test(titleOnly)) {
      flags.push({
        type: 'wealth_flex',
        severity: 'medium',
        description,
        points: 8,
      });
      break;
    }
  }

  // 6. Check engagement ratio
  if (video.viewCount > 1000) {
    const engagementRatio = video.likeCount / video.viewCount;
    if (engagementRatio < 0.01) {
      flags.push({
        type: 'low_engagement',
        severity: 'low',
        description: `Low engagement: ${(engagementRatio * 100).toFixed(1)}% like ratio`,
        points: 5,
      });
    }
  }

  // 7. Check for clickbait patterns
  const clickbaitPatterns = [
    /you won't believe/i,
    /shocking/i,
    /gone wrong/i,
    /\(not clickbait\)/i,
    /must watch/i,
    /changed my life/i,
  ];

  for (const pattern of clickbaitPatterns) {
    if (pattern.test(titleOnly)) {
      flags.push({
        type: 'clickbait',
        severity: 'low',
        description: 'Clickbait language detected in title',
        points: 5,
      });
      break;
    }
  }

  return flags;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateRedFlagPenalty(flags: RedFlag[]): number {
  const totalPoints = flags.reduce((sum, flag) => sum + flag.points, 0);
  return Math.min(totalPoints, 25); // Cap at 25 points
}
