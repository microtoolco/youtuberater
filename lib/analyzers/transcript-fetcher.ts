// YouTube Rater - Transcript Fetcher

export async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    // Try using youtube-transcript package
    const { YoutubeTranscript } = await import('youtube-transcript');

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      return null;
    }

    // Combine transcript segments
    const transcript = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return transcript;
  } catch (error) {
    console.log('Transcript not available:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function fetchTranscriptWithTimestamps(videoId: string): Promise<Array<{time: number; text: string}> | null> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript');

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      return null;
    }

    return transcriptItems.map(item => ({
      time: item.offset / 1000,
      text: item.text,
    }));
  } catch (error) {
    console.log('Transcript with timestamps not available');
    return null;
  }
}

export interface IntroAnalysis {
  skipToTimestamp: number;
  skipToFormatted: string;
  introLength: number;
  confidence: 'high' | 'medium' | 'low';
  detectionReason: string;
}

export async function detectIntroEnd(videoId: string, videoDurationSeconds: number): Promise<IntroAnalysis | null> {
  // Try YouTube's built-in captions first
  let timestampedTranscript = await fetchTranscriptWithTimestamps(videoId);

  // Fallback to AssemblyAI if YouTube captions unavailable
  if (!timestampedTranscript || timestampedTranscript.length === 0) {
    console.log('YouTube captions unavailable, trying AssemblyAI...');
    try {
      const { transcribeWithTimestamps, isAssemblyAIConfigured } = await import('@/lib/assemblyai');
      if (isAssemblyAIConfigured()) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        timestampedTranscript = await transcribeWithTimestamps(videoUrl);
      }
    } catch (error) {
      console.log('AssemblyAI fallback failed:', error);
    }
  }

  if (!timestampedTranscript || timestampedTranscript.length === 0) {
    return null;
  }

  // Transition phrases that signal the start of main content
  const transitionPhrases = [
    // Direct topic starts
    /so (let's|let us) (get into|dive into|talk about|start|begin)/i,
    /let's (get|jump) (right )?into (it|this)/i,
    /without (further|any more) (ado|delay)/i,
    /getting (right |straight )?into (it|this|the)/i,

    // Content introduction
    /in (this|today's) video/i,
    /today (we're|i'm|we will|i will) (going to|gonna)/i,
    /what (we're|i'm) going to (cover|learn|discuss|show)/i,
    /here's (what|how)/i,
    /the (first|main) thing/i,

    // Numbered starts
    /(step|tip|point|number) (one|1|#1)/i,
    /first( up)?[,:]? /i,
    /starting (with|off)/i,

    // Tutorial signals
    /here's how (to|you)/i,
    /the way (to|you)/i,
    /you (need|want) to (start|begin|first)/i,

    // Post-intro signals
    /now (that|let's)/i,
    /alright,? so/i,
    /okay,? so/i,
    /so,? (anyway|anyways)/i,
  ];

  // Intro filler phrases (suggests we're still in intro)
  const introFillerPhrases = [
    /make sure (to|you) (subscribe|like|hit)/i,
    /hit (the|that) (like|subscribe|notification)/i,
    /before (we|i) (get started|begin|start|dive)/i,
    /quick (shoutout|announcement|reminder)/i,
    /sponsored by/i,
    /brought to you by/i,
    /if you're new (here|to)/i,
    /welcome (back )?(to|everyone)/i,
    /hey (guys|everyone|everybody)/i,
    /what's (up|going on)/i,
  ];

  let bestMatch: { time: number; confidence: 'high' | 'medium' | 'low'; reason: string } | null = null;

  // Build a rolling window of text to catch phrases split across segments
  for (let i = 0; i < timestampedTranscript.length; i++) {
    const segment = timestampedTranscript[i];

    // Skip if we're too far into the video (intros are usually in first 20% or 3 minutes max)
    const maxIntroTime = Math.min(videoDurationSeconds * 0.2, 180);
    if (segment.time > maxIntroTime) break;

    // Build context window (current + next 2 segments)
    const windowText = timestampedTranscript
      .slice(i, Math.min(i + 3, timestampedTranscript.length))
      .map(s => s.text)
      .join(' ')
      .toLowerCase();

    // Check if we're still in intro filler
    const isStillIntro = introFillerPhrases.some(pattern => pattern.test(windowText));

    // Check for transition to main content
    for (const pattern of transitionPhrases) {
      if (pattern.test(windowText)) {
        // Skip if this is preceded by intro filler in same window
        if (isStillIntro && segment.time < 30) continue;

        // Determine confidence based on context
        let confidence: 'high' | 'medium' | 'low' = 'medium';
        let reason = 'Transition phrase detected';

        // High confidence indicators
        if (/let's (get|dive|jump) (right )?into/i.test(windowText) ||
            /without (further|any more) ado/i.test(windowText) ||
            /(step|tip|number) (one|1)/i.test(windowText)) {
          confidence = 'high';
          reason = 'Strong transition phrase detected';
        }

        // Boost confidence if this comes after intro filler in previous segments
        if (i > 0) {
          const prevText = timestampedTranscript
            .slice(Math.max(0, i - 3), i)
            .map(s => s.text)
            .join(' ');
          if (introFillerPhrases.some(p => p.test(prevText))) {
            confidence = 'high';
            reason = 'Transition after intro content detected';
          }
        }

        // Only update if this is a better match (higher confidence or earlier with same confidence)
        if (!bestMatch ||
            (confidence === 'high' && bestMatch.confidence !== 'high') ||
            (confidence === bestMatch.confidence && segment.time < bestMatch.time)) {
          bestMatch = { time: segment.time, confidence, reason };

          // If we found a high confidence match after 10 seconds, we're probably good
          if (confidence === 'high' && segment.time > 10) break;
        }
      }
    }
  }

  // Fallback: If no transition found but video is long, estimate intro end
  if (!bestMatch && videoDurationSeconds > 300) {
    // For longer videos without clear transitions, look for content density change
    // Default to ~30 seconds as a reasonable intro length estimate
    const estimatedIntroEnd = Math.min(30, videoDurationSeconds * 0.05);
    bestMatch = {
      time: estimatedIntroEnd,
      confidence: 'low',
      reason: 'Estimated based on video length (no clear transition detected)',
    };
  }

  if (!bestMatch || bestMatch.time < 5) {
    return null; // No significant intro detected
  }

  return {
    skipToTimestamp: Math.round(bestMatch.time),
    skipToFormatted: formatTimestamp(bestMatch.time),
    introLength: Math.round(bestMatch.time),
    confidence: bestMatch.confidence,
    detectionReason: bestMatch.reason,
  };
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
