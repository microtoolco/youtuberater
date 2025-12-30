/**
 * YouTube Transcription Service
 *
 * Uses multiple fallback methods to transcribe any YouTube video:
 * 1. Try free transcript APIs (Kome.ai, etc.)
 * 2. Use RapidAPI YouTube audio extraction + AssemblyAI
 */

interface TranscriptResult {
  success: boolean;
  transcript?: string;
  error?: string;
}

/**
 * Try to get transcript from Kome.ai (free API)
 */
async function tryKomeAI(videoId: string): Promise<string | null> {
  try {
    console.log("Trying Kome.ai transcript API for:", videoId);

    const response = await fetch("https://api.kome.ai/api/tools/youtube-transcripts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_id: videoId,
        format: true,
      }),
    });

    if (!response.ok) {
      console.log("Kome.ai returned status:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.transcript) {
      let transcript = "";
      if (Array.isArray(data.transcript)) {
        transcript = data.transcript.map((t: { text?: string } | string) =>
          typeof t === "string" ? t : t.text || ""
        ).join(" ");
      } else {
        transcript = String(data.transcript);
      }

      // Clean up
      transcript = transcript
        .replace(/\[.*?\]/g, "") // Remove [Music], etc.
        .replace(/\s+/g, " ")
        .trim();

      if (transcript.length > 100) {
        console.log("Kome.ai success, length:", transcript.length);
        return transcript;
      }
    }

    return null;
  } catch (error) {
    console.log("Kome.ai error:", error);
    return null;
  }
}

/**
 * Try Superpowered YouTube transcript API
 */
async function trySuperpowered(videoId: string): Promise<string | null> {
  try {
    console.log("Trying Superpowered transcript API for:", videoId);

    const response = await fetch(`https://api.superpowered.ai/v1/youtube/transcript?video_id=${videoId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log("Superpowered returned status:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.transcript && data.transcript.length > 100) {
      console.log("Superpowered success, length:", data.transcript.length);
      return data.transcript;
    }

    return null;
  } catch (error) {
    console.log("Superpowered error:", error);
    return null;
  }
}

/**
 * Use RapidAPI to extract audio URL, then transcribe with AssemblyAI
 */
async function tryRapidAPIWithAssemblyAI(videoId: string): Promise<string | null> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const assemblyKey = process.env.ASSEMBLYAI_API_KEY;

  if (!rapidApiKey || !assemblyKey) {
    console.log("RapidAPI or AssemblyAI key not configured");
    return null;
  }

  try {
    console.log("Trying RapidAPI audio extraction for:", videoId);

    // Step 1: Get audio URL from RapidAPI
    const audioResponse = await fetch(
      `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "youtube-mp36.p.rapidapi.com",
        },
      }
    );

    if (!audioResponse.ok) {
      console.log("RapidAPI audio extraction failed:", audioResponse.status);
      return null;
    }

    const audioData = await audioResponse.json();

    if (!audioData.link) {
      console.log("RapidAPI no audio link in response");
      return null;
    }

    console.log("Got audio URL, sending to AssemblyAI");

    // Step 2: Send audio URL to AssemblyAI
    const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        "Authorization": assemblyKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioData.link,
      }),
    });

    if (!transcriptResponse.ok) {
      console.log("AssemblyAI submit failed:", transcriptResponse.status);
      return null;
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    console.log("AssemblyAI job submitted:", transcriptId);

    // Step 3: Poll for completion (max 5 minutes)
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const pollResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            "Authorization": assemblyKey,
          },
        }
      );

      if (!pollResponse.ok) {
        console.log("AssemblyAI poll failed");
        return null;
      }

      const pollData = await pollResponse.json();

      if (pollData.status === "completed" && pollData.text) {
        console.log("AssemblyAI transcription complete, length:", pollData.text.length);
        return pollData.text;
      }

      if (pollData.status === "error") {
        console.log("AssemblyAI error:", pollData.error);
        return null;
      }

      console.log("AssemblyAI status:", pollData.status, "attempt:", attempts + 1);
      attempts++;
    }

    console.log("AssemblyAI timed out");
    return null;
  } catch (error) {
    console.log("RapidAPI + AssemblyAI error:", error);
    return null;
  }
}

/**
 * Main transcription function - tries multiple methods
 */
export async function transcribeVideo(videoId: string, videoUrl: string): Promise<TranscriptResult> {
  console.log("Starting transcription for:", videoId);

  // Method 1: Try Kome.ai (free, fast)
  let transcript = await tryKomeAI(videoId);
  if (transcript) {
    return { success: true, transcript };
  }

  // Method 2: Try Superpowered (free tier)
  transcript = await trySuperpowered(videoId);
  if (transcript) {
    return { success: true, transcript };
  }

  // Method 3: RapidAPI audio extraction + AssemblyAI
  transcript = await tryRapidAPIWithAssemblyAI(videoId);
  if (transcript) {
    return { success: true, transcript };
  }

  return {
    success: false,
    error: "All transcription methods failed. This video may have restrictions.",
  };
}

/**
 * Check if any transcription service is configured
 */
export function isTranscriptionConfigured(): boolean {
  // Kome.ai and Superpowered are free, always available
  // RapidAPI + AssemblyAI need keys
  return true; // Always try the free ones first
}
