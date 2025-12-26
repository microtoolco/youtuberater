// YouTube utility functions
import { YoutubeTranscript } from "youtube-transcript";

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function getVideoInfo(videoId: string): Promise<{
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  duration: string;
} | null> {
  try {
    // Use YouTube oEmbed API (no API key needed)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) return null;

    const data = await response.json();

    return {
      title: data.title,
      description: "", // oEmbed doesn't include description
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelName: data.author_name,
      duration: "", // Would need YouTube Data API for this
    };
  } catch {
    return null;
  }
}

export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    // Use youtube-transcript library which handles auto-generated captions
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en", // Prefer English
    });

    if (!transcriptItems || transcriptItems.length === 0) {
      console.log("No transcript items found for video:", videoId);
      return null;
    }

    // Combine all transcript segments into one string
    const fullTranscript = transcriptItems
      .map((item) => item.text)
      .join(" ")
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    if (!fullTranscript) {
      console.log("Empty transcript for video:", videoId);
      return null;
    }

    return fullTranscript;
  } catch (error) {
    console.error("Error fetching transcript:", error);

    // Try without language preference as fallback
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcriptItems || transcriptItems.length === 0) {
        return null;
      }

      const fullTranscript = transcriptItems
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      return fullTranscript || null;
    } catch (fallbackError) {
      console.error("Fallback transcript fetch also failed:", fallbackError);
      return null;
    }
  }
}

export async function searchVideos(query: string): Promise<Array<{
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
}>> {
  // For MVP, we'll use a simple approach
  // In production, you'd use YouTube Data API v3

  // For now, return empty - user needs to provide URL
  // TODO: Implement YouTube Data API search
  return [];
}
