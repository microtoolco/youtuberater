import { describe, it, expect } from 'vitest';
import {
  parseCaptionsXml,
  mergeShortSegments,
  combineToFullText,
} from '@/lib/transcript/parsers/captionsXmlParser';

describe('parseCaptionsXml', () => {
  it('parses basic XML captions', () => {
    const xml = `
      <transcript>
        <text start="0" dur="2.5">Hello everyone</text>
        <text start="2.5" dur="3">Welcome to my channel</text>
      </transcript>
    `;

    const segments = parseCaptionsXml(xml);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual({
      startSeconds: 0,
      durationSeconds: 2.5,
      startTimestamp: '0:00',
      text: 'Hello everyone',
    });
    expect(segments[1]).toEqual({
      startSeconds: 2.5,
      durationSeconds: 3,
      startTimestamp: '0:02',
      text: 'Welcome to my channel',
    });
  });

  it('handles missing duration attribute', () => {
    const xml = `
      <transcript>
        <text start="10">This has no duration</text>
      </transcript>
    `;

    const segments = parseCaptionsXml(xml);

    expect(segments).toHaveLength(1);
    expect(segments[0].durationSeconds).toBe(2); // Default
  });

  it('decodes HTML entities', () => {
    const xml = `
      <transcript>
        <text start="0" dur="2">It&apos;s &amp; it&quot;s &lt;great&gt;</text>
      </transcript>
    `;

    const segments = parseCaptionsXml(xml);

    expect(segments[0].text).toBe("It's & it\"s <great>");
  });

  it('decodes numeric HTML entities', () => {
    const xml = `
      <transcript>
        <text start="0" dur="2">Quote: &#34;Hello&#34; &#x27;World&#x27;</text>
      </transcript>
    `;

    const segments = parseCaptionsXml(xml);

    expect(segments[0].text).toBe('Quote: "Hello" \'World\'');
  });

  it('handles newlines in text', () => {
    const xml = `
      <transcript>
        <text start="0" dur="2">Line one\nLine two\n\nLine three</text>
      </transcript>
    `;

    const segments = parseCaptionsXml(xml);

    expect(segments[0].text).toBe('Line one Line two Line three');
  });

  it('skips empty text segments', () => {
    const xml = `
      <transcript>
        <text start="0" dur="2">Valid text</text>
        <text start="2" dur="1">   </text>
        <text start="3" dur="2">Another valid</text>
      </transcript>
    `;

    const segments = parseCaptionsXml(xml);

    expect(segments).toHaveLength(2);
    expect(segments[0].text).toBe('Valid text');
    expect(segments[1].text).toBe('Another valid');
  });

  it('handles decimal timestamps correctly', () => {
    const xml = `
      <transcript>
        <text start="65.5" dur="2.75">At one minute five</text>
        <text start="3661.25" dur="1.5">At one hour one minute</text>
      </transcript>
    `;

    const segments = parseCaptionsXml(xml);

    expect(segments[0].startTimestamp).toBe('1:05');
    expect(segments[1].startTimestamp).toBe('1:01:01');
  });

  it('returns empty array for invalid XML', () => {
    expect(parseCaptionsXml('')).toEqual([]);
    expect(parseCaptionsXml('not xml')).toEqual([]);
    expect(parseCaptionsXml('<invalid>')).toEqual([]);
  });
});

describe('mergeShortSegments', () => {
  it('merges consecutive segments with small gaps', () => {
    const segments = [
      { startSeconds: 0, durationSeconds: 1, startTimestamp: '0:00', text: 'Hello' },
      { startSeconds: 1.2, durationSeconds: 1, startTimestamp: '0:01', text: 'world' },
      { startSeconds: 2.3, durationSeconds: 1, startTimestamp: '0:02', text: 'how are you' },
    ];

    const merged = mergeShortSegments(segments, 0.5);

    expect(merged).toHaveLength(1);
    expect(merged[0].text).toBe('Hello world how are you');
  });

  it('does not merge segments with large gaps', () => {
    const segments = [
      { startSeconds: 0, durationSeconds: 1, startTimestamp: '0:00', text: 'First segment' },
      { startSeconds: 5, durationSeconds: 1, startTimestamp: '0:05', text: 'Second segment' },
    ];

    const merged = mergeShortSegments(segments, 0.5);

    expect(merged).toHaveLength(2);
  });

  it('preserves start timestamp from first segment', () => {
    const segments = [
      { startSeconds: 10, durationSeconds: 1, startTimestamp: '0:10', text: 'Hello' },
      { startSeconds: 11.2, durationSeconds: 1, startTimestamp: '0:11', text: 'world' },
    ];

    const merged = mergeShortSegments(segments, 0.5);

    expect(merged[0].startTimestamp).toBe('0:10');
    expect(merged[0].startSeconds).toBe(10);
  });

  it('returns empty array for empty input', () => {
    expect(mergeShortSegments([])).toEqual([]);
  });

  it('filters out very short segments', () => {
    const segments = [
      { startSeconds: 0, durationSeconds: 1, startTimestamp: '0:00', text: 'Valid segment here' },
      { startSeconds: 5, durationSeconds: 1, startTimestamp: '0:05', text: 'Short' }, // < 10 chars
      { startSeconds: 10, durationSeconds: 1, startTimestamp: '0:10', text: 'Another valid segment' },
    ];

    const merged = mergeShortSegments(segments, 0.5, 10);

    expect(merged).toHaveLength(2);
    expect(merged[0].text).toBe('Valid segment here');
    expect(merged[1].text).toBe('Another valid segment');
  });
});

describe('combineToFullText', () => {
  it('combines all segments into a single string', () => {
    const segments = [
      { startSeconds: 0, durationSeconds: 1, startTimestamp: '0:00', text: 'Hello' },
      { startSeconds: 1, durationSeconds: 1, startTimestamp: '0:01', text: 'world' },
      { startSeconds: 2, durationSeconds: 1, startTimestamp: '0:02', text: 'this is a test' },
    ];

    const fullText = combineToFullText(segments);

    expect(fullText).toBe('Hello world this is a test');
  });

  it('collapses multiple spaces', () => {
    const segments = [
      { startSeconds: 0, durationSeconds: 1, startTimestamp: '0:00', text: 'Hello  world' },
      { startSeconds: 1, durationSeconds: 1, startTimestamp: '0:01', text: '  how are you  ' },
    ];

    const fullText = combineToFullText(segments);

    expect(fullText).toBe('Hello world how are you');
  });

  it('returns empty string for empty array', () => {
    expect(combineToFullText([])).toBe('');
  });
});
