import { describe, it, expect } from 'vitest';
import { extractSteps } from '@/lib/transcript/insights/stepsExtractor';
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

describe('extractSteps', () => {
  it('extracts numbered steps', () => {
    const segments = [
      makeSegment(0, 'Today we will learn something'),
      makeSegment(30, 'Step 1 is to set up your environment'),
      makeSegment(60, 'Step 2 is to create the project'),
      makeSegment(90, 'Step 3 is to run the tests'),
    ];

    const steps = extractSteps(segments);

    expect(steps).toHaveLength(3);
    expect(steps[0].number).toBe(1);
    expect(steps[1].number).toBe(2);
    expect(steps[2].number).toBe(3);
  });

  it('extracts ordinal steps', () => {
    const segments = [
      makeSegment(0, 'Intro'),
      makeSegment(30, 'First, you need to install Node.js'),
      makeSegment(60, 'Second, create a new directory'),
      makeSegment(90, 'Third, initialize the project'),
    ];

    const steps = extractSteps(segments);

    expect(steps).toHaveLength(3);
    expect(steps[0].text).toContain('You need to install Node.js');
    expect(steps[1].text).toContain('Create a new directory');
    expect(steps[2].text).toContain('Initialize the project');
  });

  it('skips non-content step markers', () => {
    const segments = [
      makeSegment(0, 'First, subscribe to my channel!'),
      makeSegment(30, 'Now step back and think about it'),
      makeSegment(60, 'Step 1: Install dependencies'),
    ];

    const steps = extractSteps(segments);

    // Should skip the subscribe and "step back" phrases
    expect(steps.length).toBeLessThanOrEqual(1);
  });

  it('handles steps with "stage" keyword', () => {
    const segments = [
      makeSegment(0, 'Intro'),
      makeSegment(30, 'Stage 1: Planning'),
      makeSegment(60, 'Stage 2: Implementation'),
    ];

    const steps = extractSteps(segments);

    expect(steps).toHaveLength(2);
  });

  it('cleans step text by removing markers', () => {
    const segments = [
      makeSegment(30, 'Step 1: Set up your development environment'),
      makeSegment(60, 'Now we move on to more stuff'),
    ];

    const steps = extractSteps(segments);

    expect(steps[0].text).not.toMatch(/^step\s*1:?/i);
    expect(steps[0].text).toContain('Set up your development environment');
  });

  it('includes timestamp and startSeconds', () => {
    const segments = [
      makeSegment(65, 'Step 1: The first step'),
      makeSegment(95, 'More details here'),
    ];

    const steps = extractSteps(segments);

    expect(steps[0].timestamp).toBe('1:05');
    expect(steps[0].startSeconds).toBe(65);
  });

  it('renumbers steps to be sequential', () => {
    const segments = [
      makeSegment(30, 'Step 1: First'),
      makeSegment(60, 'Step 3: Third (skipping 2)'),
      makeSegment(90, 'Step 5: Fifth'),
    ];

    const steps = extractSteps(segments);

    expect(steps[0].number).toBe(1);
    expect(steps[1].number).toBe(2);
    expect(steps[2].number).toBe(3);
  });

  it('avoids duplicate step numbers', () => {
    const segments = [
      makeSegment(30, 'Step 1: First occurrence'),
      makeSegment(35, 'Step 1: Duplicate'),
      makeSegment(60, 'Step 2: Second step'),
    ];

    const steps = extractSteps(segments);

    // Should skip the duplicate
    expect(steps.filter(s => s.number === 1)).toHaveLength(1);
  });

  it('enforces minimum gap between steps', () => {
    const segments = [
      makeSegment(30, 'Step 1: First'),
      makeSegment(35, 'Step 2: Too close to first'),
      makeSegment(60, 'Step 3: Far enough'),
    ];

    const steps = extractSteps(segments);

    // Step 2 should be skipped due to 20-second minimum gap
    expect(steps).toHaveLength(2);
    expect(steps[0].number).toBe(1);
    expect(steps[1].number).toBe(2); // Renumbered from 3
  });

  it('returns empty array when no steps found', () => {
    const segments = [
      makeSegment(0, 'Just some random content'),
      makeSegment(30, 'More random content here'),
    ];

    const steps = extractSteps(segments);

    expect(steps).toEqual([]);
  });

  it('handles sequence markers like "next" and "then"', () => {
    const segments = [
      makeSegment(0, 'Step 1: Start here'),
      makeSegment(30, 'Details about step 1'),
      makeSegment(60, 'Next, configure the settings'),
      makeSegment(90, 'Then, deploy to production'),
    ];

    const steps = extractSteps(segments);

    expect(steps.length).toBeGreaterThanOrEqual(1);
  });
});
