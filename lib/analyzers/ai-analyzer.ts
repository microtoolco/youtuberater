// YouTube Rater - AI-Powered Content Analysis

import { VideoMetadata, ContentInsights, GranularMetrics, GreenFlag } from './types';

// Lazy-load Groq client only when needed and API key is available
let groqClient: any = null;

async function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  if (!groqClient) {
    const Groq = (await import('groq-sdk')).default;
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export async function analyzeWithAI(
  video: VideoMetadata,
  transcript?: string
): Promise<ContentInsights> {
  // Check if AI is available
  const groq = await getGroqClient();
  if (!groq) {
    console.log('GROQ_API_KEY not set, using fallback analysis');
    return generateFallbackInsights(video);
  }

  const contentToAnalyze = transcript
    ? `Title: ${video.title}\n\nDescription: ${video.description}\n\nTranscript: ${transcript.slice(0, 8000)}`
    : `Title: ${video.title}\n\nDescription: ${video.description}\n\nTags: ${video.tags.join(', ')}`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a YouTube video analyst. Analyze the video content and extract structured insights. Be critical and honest - identify both value and manipulation tactics. Return valid JSON only.`
        },
        {
          role: 'user',
          content: `Analyze this YouTube video and return a JSON object with these exact fields:

${contentToAnalyze}

Return this exact JSON structure:
{
  "summary": "2-3 sentence summary of what the video actually delivers",
  "targetAudience": "Who this video is best suited for",
  "contentType": "tutorial|review|opinion|news|entertainment|sales_pitch|educational|motivational",
  "keyPoints": ["Main point 1", "Main point 2", "...up to 5 key points"],
  "actionableSteps": ["Step 1 if applicable", "Step 2", "..."],
  "toolsMentioned": ["Any tools, software, products mentioned"],
  "resourcesLinked": ["Any resources, links, or references mentioned"],
  "valueProposition": "What value does this video actually provide?",
  "uniqueInsights": ["Any genuinely unique or valuable insights"],
  "potentialBias": ["Any biases, sponsorships, or conflicts of interest"],
  "monetizationMethods": ["How the creator monetizes - ads, courses, affiliates, etc"],
  "callToActions": ["Subscribe", "Buy my course", "Link in bio", etc],
  "affiliateIndicators": ["Any affiliate links or sponsored content indicators"],
  "contentWarnings": ["Outdated info", "Requires prior knowledge", etc],
  "factCheckFlags": ["Claims that seem dubious or unverified"]
}

Be thorough but concise. If transcript is not available, analyze based on title, description, and tags.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '{}';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: parsed.summary || 'Unable to generate summary',
      targetAudience: parsed.targetAudience || 'General audience',
      contentType: parsed.contentType || 'unknown',
      keyPoints: parsed.keyPoints || [],
      actionableSteps: parsed.actionableSteps || [],
      toolsMentioned: parsed.toolsMentioned || [],
      resourcesLinked: parsed.resourcesLinked || [],
      valueProposition: parsed.valueProposition || 'Not determined',
      uniqueInsights: parsed.uniqueInsights || [],
      potentialBias: parsed.potentialBias || [],
      monetizationMethods: parsed.monetizationMethods || [],
      callToActions: parsed.callToActions || [],
      affiliateIndicators: parsed.affiliateIndicators || [],
      contentWarnings: parsed.contentWarnings || [],
      factCheckFlags: parsed.factCheckFlags || [],
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return generateFallbackInsights(video);
  }
}

function generateFallbackInsights(video: VideoMetadata): ContentInsights {
  // Fallback analysis using heuristics when AI is unavailable
  const description = video.description.toLowerCase();
  const title = video.title.toLowerCase();

  const toolsMentioned: string[] = [];
  const commonTools = ['notion', 'canva', 'figma', 'shopify', 'wordpress', 'wix', 'stripe', 'paypal', 'mailchimp', 'hubspot'];
  commonTools.forEach(tool => {
    if (description.includes(tool) || title.includes(tool)) {
      toolsMentioned.push(tool.charAt(0).toUpperCase() + tool.slice(1));
    }
  });

  const callToActions: string[] = [];
  if (description.includes('subscribe')) callToActions.push('Subscribe to channel');
  if (description.includes('link in')) callToActions.push('Check links in description');
  if (description.includes('course') || description.includes('program')) callToActions.push('Course/program promotion');
  if (description.includes('free') && description.includes('download')) callToActions.push('Free download offer');

  const monetizationMethods: string[] = [];
  if (description.includes('affiliate') || description.includes('commission')) monetizationMethods.push('Affiliate marketing');
  if (description.includes('sponsor')) monetizationMethods.push('Sponsorship');
  if (description.includes('course') || description.includes('coaching')) monetizationMethods.push('Course/coaching sales');
  if (description.includes('patreon') || description.includes('membership')) monetizationMethods.push('Membership/Patreon');

  return {
    summary: `A ${Math.floor(video.durationSeconds / 60)} minute video about "${video.title}" by ${video.channelTitle}.`,
    targetAudience: 'General audience interested in this topic',
    contentType: detectContentType(video),
    keyPoints: extractKeyPointsFromDescription(video.description),
    actionableSteps: [],
    toolsMentioned,
    resourcesLinked: extractLinks(video.description),
    valueProposition: 'Analysis based on metadata only - watch for full assessment',
    uniqueInsights: [],
    potentialBias: monetizationMethods.length > 0 ? ['Creator has monetization incentives'] : [],
    monetizationMethods,
    callToActions,
    affiliateIndicators: [],
    contentWarnings: video.durationSeconds < 120 ? ['Short video - may lack depth'] : [],
    factCheckFlags: [],
  };
}

function detectContentType(video: VideoMetadata): string {
  const title = video.title.toLowerCase();
  const desc = video.description.toLowerCase();

  if (title.includes('tutorial') || title.includes('how to') || title.includes('guide')) return 'tutorial';
  if (title.includes('review')) return 'review';
  if (title.includes('opinion') || title.includes('thoughts on')) return 'opinion';
  if (title.includes('news') || title.includes('update')) return 'news';
  if (desc.includes('course') || desc.includes('sign up') || desc.includes('enroll')) return 'sales_pitch';
  return 'educational';
}

function extractKeyPointsFromDescription(description: string): string[] {
  const lines = description.split('\n').filter(line => line.trim().length > 10);
  const points: string[] = [];

  for (const line of lines) {
    // Look for numbered lists or bullet points
    if (/^[\d•\-\*]/.test(line.trim())) {
      const cleaned = line.replace(/^[\d•\-\*\.\)]+\s*/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 200) {
        points.push(cleaned);
      }
    }
    if (points.length >= 5) break;
  }

  return points;
}

function extractLinks(description: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const matches = description.match(urlRegex) || [];
  return matches.slice(0, 5).map(url => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  });
}

export function calculateGranularMetrics(video: VideoMetadata): GranularMetrics {
  const likeToViewRatio = video.viewCount > 0 ? (video.likeCount / video.viewCount) * 100 : 0;
  const commentToViewRatio = video.viewCount > 0 && video.commentCount
    ? (video.commentCount / video.viewCount) * 100
    : 0;

  const getEngagementGrade = (): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (likeToViewRatio >= 5) return 'A';
    if (likeToViewRatio >= 3) return 'B';
    if (likeToViewRatio >= 2) return 'C';
    if (likeToViewRatio >= 1) return 'D';
    return 'F';
  };

  const calculateClickbaitScore = (): number => {
    let score = 0;
    const title = video.title.toLowerCase();

    // Clickbait indicators
    if (title === title.toUpperCase() && title.length > 10) score += 20;
    if (/\b(shocking|insane|unbelievable|you won't believe)\b/i.test(title)) score += 25;
    if (/!{2,}/.test(video.title)) score += 15;
    if (/\?{2,}/.test(video.title)) score += 10;
    if (/\b(secret|revealed|exposed)\b/i.test(title)) score += 20;
    if (/\$[\d,]+/.test(title)) score += 15;
    if (/(😱|🤯|💰|🔥){2,}/.test(video.title)) score += 15;

    return Math.min(100, score);
  };

  const calculateDescriptionQuality = (): number => {
    let score = 50;
    const desc = video.description;

    if (desc.length > 500) score += 15;
    if (desc.length > 1000) score += 10;
    if (/\d{1,2}:\d{2}/.test(desc)) score += 15; // Has timestamps
    if (desc.includes('http')) score += 5; // Has links
    if (desc.split('\n').length > 5) score += 5; // Well formatted

    // Negative signals
    if (desc.length < 100) score -= 20;
    if (/sign up|enroll now|limited time/i.test(desc)) score -= 10;

    return Math.max(0, Math.min(100, score));
  };

  const hasTimestamps = /\d{1,2}:\d{2}/.test(video.description);
  const hasChapters = hasTimestamps && video.description.split(/\d{1,2}:\d{2}/).length > 3;

  return {
    likeToViewRatio: Math.round(likeToViewRatio * 100) / 100,
    commentToViewRatio: Math.round(commentToViewRatio * 100) / 100,
    engagementGrade: getEngagementGrade(),
    titleClickbaitScore: calculateClickbaitScore(),
    descriptionQuality: calculateDescriptionQuality(),
    contentDensityEstimate: Math.min(100, Math.round((video.likeCount / video.durationSeconds) * 10)),
    channelConsistency: 'Unknown',
    uploadFrequency: 'Unknown',
    isShortForm: video.durationSeconds < 60,
    hasChapters,
    hasTimestamps,
    estimatedAdBreaks: Math.floor(video.durationSeconds / 480), // Every 8 mins
  };
}

export function detectGreenFlags(video: VideoMetadata, metrics: GranularMetrics): GreenFlag[] {
  const flags: GreenFlag[] = [];

  if (metrics.engagementGrade === 'A') {
    flags.push({
      type: 'high_engagement',
      description: `Excellent engagement: ${metrics.likeToViewRatio.toFixed(1)}% like ratio`,
      points: 10,
    });
  }

  if (metrics.hasTimestamps) {
    flags.push({
      type: 'has_timestamps',
      description: 'Video has timestamps for easy navigation',
      points: 5,
    });
  }

  if (metrics.hasChapters) {
    flags.push({
      type: 'has_chapters',
      description: 'Well-organized with chapter markers',
      points: 5,
    });
  }

  if (metrics.descriptionQuality >= 80) {
    flags.push({
      type: 'quality_description',
      description: 'Detailed, informative description',
      points: 5,
    });
  }

  if (video.commentCount && video.commentCount > 1000) {
    flags.push({
      type: 'active_discussion',
      description: `Active community: ${video.commentCount.toLocaleString()} comments`,
      points: 5,
    });
  }

  if (video.viewCount > 100000 && metrics.engagementGrade !== 'F') {
    flags.push({
      type: 'proven_content',
      description: 'Popular video with strong audience reception',
      points: 5,
    });
  }

  if (metrics.titleClickbaitScore < 20) {
    flags.push({
      type: 'honest_title',
      description: 'Straightforward, non-clickbait title',
      points: 5,
    });
  }

  return flags;
}

export function generateVerdict(
  video: VideoMetadata,
  score: number,
  insights: ContentInsights,
  metrics: GranularMetrics
): { watchTime: string; bestFor: string; skipIf: string; tldr: string } {
  const minutes = Math.floor(video.durationSeconds / 60);

  let watchTime: string;
  if (score >= 80) {
    watchTime = `Worth the full ${minutes} minutes`;
  } else if (score >= 60) {
    watchTime = metrics.hasTimestamps
      ? 'Use timestamps to skip to relevant sections'
      : `Worth watching at 1.5x speed (${Math.floor(minutes / 1.5)} min)`;
  } else if (score >= 40) {
    watchTime = 'Consider skimming or reading comments first';
  } else {
    watchTime = 'Time likely better spent elsewhere';
  }

  const bestFor = insights.targetAudience || 'Those interested in this topic';

  let skipIf = 'You prefer in-depth analysis';
  if (insights.contentType === 'sales_pitch') {
    skipIf = "You're not interested in buying a course/product";
  } else if (minutes < 5) {
    skipIf = 'You need comprehensive coverage of the topic';
  } else if (insights.contentWarnings.length > 0) {
    skipIf = insights.contentWarnings[0];
  }

  const tldr = insights.summary.length > 100
    ? insights.summary.substring(0, 100) + '...'
    : insights.summary;

  return { watchTime, bestFor, skipIf, tldr };
}
