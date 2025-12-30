// Whisper transcription for videos without captions (Pro users only)
import OpenAI from "openai";
import play from "play-dl";

// Lazy-initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Transcribe a YouTube video using Whisper API
 * This is used as a fallback when no captions are available
 *
 * @param videoId - YouTube video ID
 * @returns Transcribed text or null if failed
 */
export async function transcribeWithWhisper(videoId: string): Promise<string | null> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Get video info
    const videoInfo = await play.video_info(videoUrl);
    const duration = videoInfo.video_details.durationInSec;

    if (!duration) {
      throw new Error("Could not determine video duration");
    }

    // Limit to 30 minutes to control costs (30 min × $0.006 = $0.18 max)
    if (duration > 1800) {
      console.log("Video too long for Whisper transcription:", duration, "seconds");
      throw new Error("Video is too long (max 30 minutes for transcription)");
    }

    // Get audio stream
    const stream = await play.stream(videoUrl, { quality: 2 }); // quality 2 = audio only

    if (!stream || !stream.stream) {
      throw new Error("No audio stream available");
    }

    // Download audio to buffer
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.stream.on("end", () => resolve());
      stream.stream.on("error", reject);
    });

    const audioBuffer = Buffer.concat(chunks);

    if (audioBuffer.length === 0) {
      throw new Error("Empty audio buffer");
    }

    // Convert buffer to File object for OpenAI
    const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    // Transcribe with Whisper
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
      response_format: "text",
    });

    if (!transcription || typeof transcription !== "string") {
      throw new Error("Empty transcription result");
    }

    return transcription;
  } catch (error) {
    console.error("Whisper transcription failed:", error);
    throw error;
  }
}

/**
 * Check if Whisper is configured
 */
export function isWhisperConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Estimate Whisper cost for a video
 * @param durationSeconds - Video duration in seconds
 * @returns Estimated cost in USD
 */
export function estimateWhisperCost(durationSeconds: number): number {
  const minutes = Math.ceil(durationSeconds / 60);
  return minutes * 0.006; // $0.006 per minute
}
