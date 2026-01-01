/**
 * AssemblyAI Integration for YouTube Transcription
 *
 * Transcribes any YouTube video - works even without captions.
 * Cost: ~$0.00025/second ($0.90/hour of audio)
 */

interface Word {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

interface TranscriptResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text?: string;
  words?: Word[];
  error?: string;
}

export interface TimestampedSegment {
  time: number;
  text: string;
}

const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2";

/**
 * Check if AssemblyAI is configured
 */
export function isAssemblyAIConfigured(): boolean {
  return !!process.env.ASSEMBLYAI_API_KEY;
}

/**
 * Transcribe a YouTube video using AssemblyAI
 *
 * @param videoUrl - Full YouTube URL
 * @returns Transcript text or null if failed
 */
export async function transcribeWithAssemblyAI(
  videoUrl: string
): Promise<string | null> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    console.error("ASSEMBLYAI_API_KEY not configured");
    return null;
  }

  try {
    console.log("Starting AssemblyAI transcription for:", videoUrl);

    // Step 1: Submit the YouTube URL for transcription
    const submitResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: videoUrl,
      }),
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.text();
      console.error("AssemblyAI submit failed:", error);
      return null;
    }

    const submitData: TranscriptResponse = await submitResponse.json();
    const transcriptId = submitData.id;

    console.log("AssemblyAI job submitted, ID:", transcriptId);

    // Step 2: Poll for completion (max 5 minutes)
    const maxAttempts = 60; // 60 * 5 seconds = 5 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const pollResponse = await fetch(
        `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
        {
          headers: {
            "Authorization": apiKey,
          },
        }
      );

      if (!pollResponse.ok) {
        console.error("AssemblyAI poll failed:", pollResponse.status);
        return null;
      }

      const pollData: TranscriptResponse = await pollResponse.json();

      if (pollData.status === "completed") {
        console.log("AssemblyAI transcription complete, length:", pollData.text?.length);
        return pollData.text || null;
      }

      if (pollData.status === "error") {
        console.error("AssemblyAI transcription error:", pollData.error);
        return null;
      }

      console.log("AssemblyAI status:", pollData.status, "attempt:", attempts + 1);
      attempts++;
    }

    console.error("AssemblyAI transcription timed out");
    return null;
  } catch (error) {
    console.error("AssemblyAI error:", error);
    return null;
  }
}

/**
 * Transcribe a YouTube video and return timestamped segments
 * Groups words into ~5 second segments for analysis
 */
export async function transcribeWithTimestamps(
  videoUrl: string
): Promise<TimestampedSegment[] | null> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    console.error("ASSEMBLYAI_API_KEY not configured");
    return null;
  }

  try {
    console.log("Starting AssemblyAI timestamped transcription for:", videoUrl);

    // Submit with word timestamps enabled
    const submitResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: videoUrl,
      }),
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.text();
      console.error("AssemblyAI submit failed:", error);
      return null;
    }

    const submitData: TranscriptResponse = await submitResponse.json();
    const transcriptId = submitData.id;

    console.log("AssemblyAI job submitted, ID:", transcriptId);

    // Poll for completion
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const pollResponse = await fetch(
        `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
        {
          headers: {
            "Authorization": apiKey,
          },
        }
      );

      if (!pollResponse.ok) {
        console.error("AssemblyAI poll failed:", pollResponse.status);
        return null;
      }

      const pollData: TranscriptResponse = await pollResponse.json();

      if (pollData.status === "completed" && pollData.words) {
        console.log("AssemblyAI transcription complete, words:", pollData.words.length);

        // Group words into ~5 second segments
        const segments: TimestampedSegment[] = [];
        let currentSegment: { time: number; words: string[] } | null = null;

        for (const word of pollData.words) {
          const wordTimeSeconds = word.start / 1000;

          if (!currentSegment) {
            currentSegment = { time: wordTimeSeconds, words: [word.text] };
          } else if (wordTimeSeconds - currentSegment.time > 5) {
            // Start new segment every ~5 seconds
            segments.push({
              time: currentSegment.time,
              text: currentSegment.words.join(' '),
            });
            currentSegment = { time: wordTimeSeconds, words: [word.text] };
          } else {
            currentSegment.words.push(word.text);
          }
        }

        // Push final segment
        if (currentSegment && currentSegment.words.length > 0) {
          segments.push({
            time: currentSegment.time,
            text: currentSegment.words.join(' '),
          });
        }

        return segments;
      }

      if (pollData.status === "error") {
        console.error("AssemblyAI transcription error:", pollData.error);
        return null;
      }

      console.log("AssemblyAI status:", pollData.status, "attempt:", attempts + 1);
      attempts++;
    }

    console.error("AssemblyAI transcription timed out");
    return null;
  } catch (error) {
    console.error("AssemblyAI error:", error);
    return null;
  }
}
