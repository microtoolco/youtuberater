// YouTube utility functions

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
    // Try to get transcript using a public transcript service
    // This uses the youtube-transcript approach
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`
    );
    const html = await response.text();

    // Extract captions URL from the page
    const captionsMatch = html.match(/"captions":.*?"captionTracks":\[(.*?)\]/);
    if (!captionsMatch) {
      console.log("No captions found for video");
      return null;
    }

    // Parse the captions data
    const captionsData = captionsMatch[1];
    const baseUrlMatch = captionsData.match(/"baseUrl":"(.*?)"/);
    if (!baseUrlMatch) return null;

    // Decode the URL
    const captionsUrl = baseUrlMatch[1].replace(/\\u0026/g, "&");

    // Fetch the transcript
    const transcriptResponse = await fetch(captionsUrl);
    const transcriptXml = await transcriptResponse.text();

    // Parse XML and extract text
    const textMatches = transcriptXml.matchAll(/<text[^>]*>(.*?)<\/text>/g);
    const texts: string[] = [];

    for (const match of textMatches) {
      // Decode HTML entities
      const text = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, " ");
      texts.push(text);
    }

    return texts.join(" ");
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return null;
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
