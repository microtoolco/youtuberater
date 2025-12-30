/**
 * n8n Integration for YouTube transcript extraction
 *
 * This calls an n8n webhook to extract transcripts from videos
 * that don't have captions available.
 *
 * n8n can use yt-dlp or other tools that work better than
 * browser-based libraries.
 */

interface N8nTranscriptResponse {
  success: boolean;
  transcript?: string;
  error?: string;
  duration?: number;
}

/**
 * Check if n8n webhook is configured
 */
export function isN8nConfigured(): boolean {
  return !!process.env.N8N_WEBHOOK_URL;
}

/**
 * Get transcript from n8n webhook
 *
 * @param videoId - YouTube video ID
 * @param videoUrl - Full YouTube URL
 * @returns Transcript text or null if failed
 */
export async function getTranscriptFromN8n(
  videoId: string,
  videoUrl: string
): Promise<string | null> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("N8N_WEBHOOK_URL not configured");
    return null;
  }

  try {
    console.log("Calling n8n webhook for transcript:", videoId);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId,
        videoUrl,
        action: "get_transcript",
      }),
    });

    if (!response.ok) {
      console.error("n8n webhook returned error status:", response.status);
      return null;
    }

    const data: N8nTranscriptResponse = await response.json();

    if (!data.success || !data.transcript) {
      console.error("n8n webhook failed:", data.error);
      return null;
    }

    console.log("Successfully got transcript from n8n, length:", data.transcript.length);
    return data.transcript;
  } catch (error) {
    console.error("Failed to call n8n webhook:", error);
    return null;
  }
}

/**
 * Get transcript with Whisper via n8n
 * This downloads audio and transcribes it using Whisper
 *
 * @param videoId - YouTube video ID
 * @param videoUrl - Full YouTube URL
 * @returns Transcript text or null if failed
 */
export async function transcribeWithN8n(
  videoId: string,
  videoUrl: string
): Promise<string | null> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("N8N_WEBHOOK_URL not configured");
    return null;
  }

  try {
    console.log("Calling n8n webhook for Whisper transcription:", videoId);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId,
        videoUrl,
        action: "transcribe_whisper",
      }),
    });

    if (!response.ok) {
      console.error("n8n webhook returned error status:", response.status);
      return null;
    }

    const data: N8nTranscriptResponse = await response.json();

    if (!data.success || !data.transcript) {
      console.error("n8n Whisper transcription failed:", data.error);
      return null;
    }

    console.log("Successfully got Whisper transcript from n8n, length:", data.transcript.length);
    return data.transcript;
  } catch (error) {
    console.error("Failed to call n8n webhook for Whisper:", error);
    return null;
  }
}
