// YouTube Rater - Enhanced Analysis API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, fetchVideoMetadata } from '@/lib/analyzers/youtube-api';
import { calculateScore } from '@/lib/analyzers/score-calculator';
import { detectIntroEnd } from '@/lib/analyzers/transcript-fetcher';
import { VideoAnalysis } from '@/lib/analyzers/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Fetch video metadata from YouTube API
    const video = await fetchVideoMetadata(videoId);

    // Run analysis and intro detection in parallel
    const [scoreResult, introAnalysis] = await Promise.all([
      calculateScore(video),
      detectIntroEnd(videoId, video.durationSeconds),
    ]);

    const { analysis, transcript } = scoreResult;

    const response: VideoAnalysis = {
      success: true,
      videoId,
      video,
      analysis,
      hasTranscript: !!transcript,
      transcript: transcript ? transcript.slice(0, 500) + '...' : undefined,
      introAnalysis: introAnalysis || undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analysis error:', error);

    const message = error instanceof Error ? error.message : 'Analysis failed';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
