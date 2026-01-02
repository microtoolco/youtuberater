// Tools Extractor - Identify tools, software, and products mentioned

import { TranscriptSegment, ToolMention } from '../types';

// Common SaaS/tools keywords
const KNOWN_TOOLS = new Set([
  // Productivity
  'notion', 'airtable', 'trello', 'asana', 'monday', 'clickup', 'todoist',
  'evernote', 'obsidian', 'roam', 'logseq', 'craft',

  // Design
  'figma', 'canva', 'photoshop', 'illustrator', 'sketch', 'invision',
  'framer', 'webflow', 'squarespace', 'wix', 'wordpress',

  // Development
  'github', 'gitlab', 'bitbucket', 'vscode', 'cursor', 'replit', 'codepen',
  'vercel', 'netlify', 'heroku', 'aws', 'azure', 'firebase', 'supabase',

  // Marketing
  'mailchimp', 'convertkit', 'hubspot', 'salesforce', 'zapier', 'make',
  'buffer', 'hootsuite', 'later', 'planoly', 'sprout',

  // Video/Audio
  'youtube', 'vimeo', 'loom', 'descript', 'riverside', 'streamyard',
  'obs', 'premiere', 'davinci', 'capcut', 'audacity',

  // AI
  'chatgpt', 'claude', 'midjourney', 'dall-e', 'stable diffusion',
  'jasper', 'copy.ai', 'writesonic', 'grammarly',

  // Business
  'stripe', 'paypal', 'gumroad', 'teachable', 'kajabi', 'thinkific',
  'shopify', 'etsy', 'amazon', 'ebay',

  // Communication
  'slack', 'discord', 'zoom', 'teams', 'meet', 'calendly', 'cal.com',

  // Analytics
  'google analytics', 'mixpanel', 'amplitude', 'hotjar', 'clarity',
]);

// Patterns for detecting tools/products
const TOOL_PATTERNS = [
  // "using X", "with X", "in X"
  /\b(using|with|in|on|through|via)\s+([A-Z][a-zA-Z0-9.]+(?:\s+[A-Z][a-zA-Z0-9.]+)?)\b/g,

  // "X is a", "X allows", "X lets"
  /\b([A-Z][a-zA-Z0-9.]+(?:\s+[A-Z][a-zA-Z0-9.]+)?)\s+(is\s+a|allows|lets|helps|enables)/g,

  // URLs (extract domain)
  /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\.(com|io|co|app|dev|ai|so|xyz)/gi,
];

// Words that look like tools but aren't
const FALSE_POSITIVES = new Set([
  'this', 'that', 'which', 'what', 'how', 'when', 'where', 'who', 'why',
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'the', 'a', 'an',
  'now', 'next', 'then', 'here', 'there', 'step', 'tip', 'first', 'second',
  'okay', 'right', 'so', 'well', 'just', 'really', 'actually', 'basically',
]);

export function extractTools(segments: TranscriptSegment[]): ToolMention[] {
  const toolMap = new Map<string, ToolMention>();

  for (const segment of segments) {
    const text = segment.text;
    const lowerText = text.toLowerCase();

    // Check for known tools
    for (const tool of KNOWN_TOOLS) {
      if (lowerText.includes(tool)) {
        const normalizedName = normalizeName(tool);
        if (!toolMap.has(normalizedName)) {
          toolMap.set(normalizedName, {
            name: capitalizeToolName(tool),
            timestamp: segment.startTimestamp,
            startSeconds: segment.startSeconds,
            context: extractContext(text, tool),
            category: categorize(tool),
          });
        }
      }
    }

    // Look for capitalized product names
    const capitalizedPattern = /\b([A-Z][a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)?)\b/g;
    let match;
    while ((match = capitalizedPattern.exec(text)) !== null) {
      const name = match[1];
      const lowerName = name.toLowerCase();

      // Skip false positives and short names
      if (
        FALSE_POSITIVES.has(lowerName) ||
        name.length < 3 ||
        KNOWN_TOOLS.has(lowerName)
      ) {
        continue;
      }

      // Check if it looks like a product (appears multiple times or has product context)
      if (isLikelyProduct(name, text)) {
        const normalizedName = normalizeName(name);
        if (!toolMap.has(normalizedName)) {
          toolMap.set(normalizedName, {
            name,
            timestamp: segment.startTimestamp,
            startSeconds: segment.startSeconds,
            context: extractContext(text, name),
            category: 'software',
          });
        }
      }
    }
  }

  // Convert to array and sort by first mention
  return Array.from(toolMap.values())
    .sort((a, b) => a.startSeconds - b.startSeconds);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function capitalizeToolName(name: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'chatgpt': 'ChatGPT',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'youtube': 'YouTube',
    'vscode': 'VS Code',
    'dall-e': 'DALL-E',
    'aws': 'AWS',
    'obs': 'OBS',
    'cal.com': 'Cal.com',
    'copy.ai': 'Copy.ai',
  };

  const lower = name.toLowerCase();
  if (specialCases[lower]) {
    return specialCases[lower];
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
}

function categorize(tool: string): ToolMention['category'] {
  const lower = tool.toLowerCase();

  const categories: Record<string, ToolMention['category']> = {
    // Software
    'figma': 'software', 'vscode': 'software', 'photoshop': 'software',

    // Services
    'stripe': 'service', 'paypal': 'service', 'mailchimp': 'service',

    // Platforms
    'youtube': 'platform', 'shopify': 'platform', 'teachable': 'platform',

    // Resources
    'chatgpt': 'service', 'claude': 'service',
  };

  return categories[lower] || 'software';
}

function extractContext(text: string, toolName: string): string {
  const lowerText = text.toLowerCase();
  const lowerTool = toolName.toLowerCase();
  const index = lowerText.indexOf(lowerTool);

  if (index === -1) {
    return text.slice(0, 100);
  }

  // Get surrounding context
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + toolName.length + 70);

  let context = text.slice(start, end).trim();

  if (start > 0) {
    context = '...' + context;
  }
  if (end < text.length) {
    context = context + '...';
  }

  return context;
}

function isLikelyProduct(name: string, context: string): boolean {
  const lower = context.toLowerCase();

  // Context clues that suggest it's a product
  const productClues = [
    `using ${name.toLowerCase()}`,
    `with ${name.toLowerCase()}`,
    `${name.toLowerCase()} is`,
    `${name.toLowerCase()} allows`,
    `${name.toLowerCase()} helps`,
    `${name.toLowerCase()} lets`,
    `in ${name.toLowerCase()}`,
    `${name.toLowerCase()}.com`,
  ];

  return productClues.some(clue => lower.includes(clue));
}
