/**
 * AssemblyAI Integration for YouTube Transcription
 *
 * Transcribes any YouTube video - works even without captions.
 * Cost: ~$0.00025/second ($0.90/hour of audio)
 */

interface TranscriptResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text?: string;
  error?: string;
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
