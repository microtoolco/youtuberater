import { describe, it, expect } from 'vitest';
import { extractTools } from '@/lib/transcript/insights/toolsExtractor';
import { TranscriptSegment } from '@/lib/transcript/types';

function makeSegment(startSeconds: number, text: string): TranscriptSegment {
  const minutes = Math.floor(startSeconds / 60);
  const seconds = Math.floor(startSeconds % 60);
  return {
    startSeconds,
    durationSeconds: 5,
    startTimestamp: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    text,
  };
}

describe('extractTools', () => {
  it('detects known tools by name', () => {
    const segments = [
      makeSegment(30, 'Today I will show you how to use Figma for design'),
      makeSegment(60, 'We will also use GitHub for version control'),
    ];

    const tools = extractTools(segments);

    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('Figma');
    expect(toolNames).toContain('GitHub');
  });

  it('returns first mention timestamp for each tool', () => {
    const segments = [
      makeSegment(30, 'Open up Notion'),
      makeSegment(60, 'Go back to Notion and create a page'),
      makeSegment(90, 'Export from Notion'),
    ];

    const tools = extractTools(segments);

    // Should only have one entry for Notion with the first timestamp
    const notionTools = tools.filter(t => t.name.toLowerCase() === 'notion');
    expect(notionTools).toHaveLength(1);
    expect(notionTools[0].startSeconds).toBe(30);
    expect(notionTools[0].timestamp).toBe('0:30');
  });

  it('categorizes tools correctly', () => {
    const segments = [
      makeSegment(30, 'We use Stripe for payments'),
      makeSegment(60, 'YouTube is great for hosting'),
    ];

    const tools = extractTools(segments);

    const stripe = tools.find(t => t.name.toLowerCase() === 'stripe');
    const youtube = tools.find(t => t.name.toLowerCase() === 'youtube');

    expect(stripe?.category).toBe('service');
    expect(youtube?.category).toBe('platform');
  });

  it('handles special capitalization cases', () => {
    const segments = [
      makeSegment(30, 'Use chatgpt for writing'),
      makeSegment(60, 'Deploy on github'),
      makeSegment(90, 'Edit in vscode'),
    ];

    const tools = extractTools(segments);

    const names = tools.map(t => t.name);
    expect(names).toContain('ChatGPT');
    expect(names).toContain('GitHub');
    expect(names).toContain('VS Code');
  });

  it('extracts context around tool mention', () => {
    const segments = [
      makeSegment(30, 'I really love using Notion for project management and organizing my notes'),
    ];

    const tools = extractTools(segments);
    const notion = tools.find(t => t.name.toLowerCase() === 'notion');

    expect(notion?.context).toContain('Notion');
    expect(notion?.context.length).toBeGreaterThan(0);
  });

  it('ignores false positives', () => {
    const segments = [
      makeSegment(30, 'This is what you need to know'),
      makeSegment(60, 'Now we will do the next step'),
    ];

    const tools = extractTools(segments);

    // Should not detect "This", "Now", etc as tools
    const toolNames = tools.map(t => t.name.toLowerCase());
    expect(toolNames).not.toContain('this');
    expect(toolNames).not.toContain('now');
    expect(toolNames).not.toContain('next');
  });

  it('detects AI tools', () => {
    const segments = [
      makeSegment(30, 'Let me show you how to use chatgpt'),
      makeSegment(60, 'Or you could use claude instead'),
      makeSegment(90, 'For images try midjourney'),
    ];

    const tools = extractTools(segments);

    const names = tools.map(t => t.name.toLowerCase());
    expect(names.some(n => n.includes('chatgpt') || n.includes('gpt'))).toBe(true);
    expect(names.some(n => n.includes('claude'))).toBe(true);
    expect(names.some(n => n.includes('midjourney'))).toBe(true);
  });

  it('returns tools sorted by first appearance', () => {
    const segments = [
      makeSegment(60, 'First we use Notion'),
      makeSegment(30, 'Start with Figma'),
      makeSegment(90, 'Then GitHub'),
    ];

    const tools = extractTools(segments);

    // Even though segments are out of order in array, tools should be sorted by startSeconds
    expect(tools[0].startSeconds).toBeLessThanOrEqual(tools[1].startSeconds);
    if (tools.length > 2) {
      expect(tools[1].startSeconds).toBeLessThanOrEqual(tools[2].startSeconds);
    }
  });

  it('returns empty array when no tools found', () => {
    const segments = [
      makeSegment(30, 'just talking about random stuff'),
      makeSegment(60, 'nothing specific mentioned here'),
    ];

    const tools = extractTools(segments);

    expect(tools).toEqual([]);
  });

  it('handles tools with dots in name', () => {
    const segments = [
      makeSegment(30, 'Check out copy.ai for writing'),
      makeSegment(60, 'Or use cal.com for scheduling'),
    ];

    const tools = extractTools(segments);

    const names = tools.map(t => t.name);
    expect(names.some(n => n.toLowerCase().includes('copy.ai'))).toBe(true);
    expect(names.some(n => n.toLowerCase().includes('cal.com'))).toBe(true);
  });
});
