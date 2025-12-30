import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractVideoId, getVideoInfo, getTranscript } from "@/lib/youtube";
import { generateGuide } from "@/lib/groq";
import { isN8nConfigured, getTranscriptFromN8n, transcribeWithN8n } from "@/lib/n8n";
import { z } from "zod";
import type { SkillLevel } from "@/types";

const requestSchema = z.object({
  videoUrl: z.string().url(),
  skillLevel: z.enum(["beginner", "functional", "fluent", "expert"]).optional().default("functional"),
});

// Plan limits
const PLAN_LIMITS = {
  free: 3,
  monthly: 50,
  lifetime: 100,
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("credits, plan")
      .eq("id", user.id)
      .single();

    const plan = profile?.plan || "free";
    const credits = profile?.credits ?? 3;
    const isPro = plan === "monthly" || plan === "lifetime";

    // Check limits
    if (plan === "free") {
      if (credits <= 0) {
        return NextResponse.json({
          error: "No credits remaining. Upgrade to Pro for more guides!",
          needsUpgrade: true,
        }, { status: 403 });
      }
    } else {
      // Check monthly usage for paid plans
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("guides")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 50;
      if ((count || 0) >= limit) {
        return NextResponse.json({
          error: `Monthly limit reached (${limit} guides). Resets next month.`,
        }, { status: 403 });
      }
    }

    // Parse request
    const body = await request.json();
    const { videoUrl, skillLevel } = requestSchema.parse(body);

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({
        error: "Invalid YouTube URL. Please provide a valid YouTube video link.",
      }, { status: 400 });
    }

    // Get video info
    const videoInfo = await getVideoInfo(videoId);
    if (!videoInfo) {
      return NextResponse.json({
        error: "Could not fetch video information. Please check the URL.",
      }, { status: 400 });
    }

    // Get transcript - try YouTube captions first
    let transcript = await getTranscript(videoId);
    let usedN8n = false;

    // If no captions available, try n8n fallback
    if (!transcript) {
      // Check if n8n is configured
      if (!isN8nConfigured()) {
        return NextResponse.json({
          error: "This video doesn't have captions. Please try a video with captions or auto-generated subtitles enabled.",
          noTranscript: true,
        }, { status: 400 });
      }

      // For free users, prompt upgrade
      if (!isPro) {
        return NextResponse.json({
          error: "This video doesn't have captions. Upgrade to Pro to transcribe any video!",
          noTranscript: true,
          needsUpgrade: true,
        }, { status: 400 });
      }

      // Pro users: try n8n transcript extraction
      console.log("No captions found, trying n8n for Pro user:", user.id);

      // First try to get transcript via n8n (faster, cheaper)
      transcript = await getTranscriptFromN8n(videoId, videoUrl);

      // If that fails, try Whisper transcription via n8n
      if (!transcript) {
        console.log("n8n transcript failed, trying Whisper via n8n");
        transcript = await transcribeWithN8n(videoId, videoUrl);
        usedN8n = true;
      }

      if (!transcript) {
        return NextResponse.json({
          error: "Could not extract transcript from this video. Please try a different video.",
          noTranscript: true,
        }, { status: 400 });
      }
    }

    // Generate guide using AI with skill level
    const guide = await generateGuide(transcript, videoInfo.title, skillLevel as SkillLevel);

    if (!guide || guide.title === "INVALID_HOWTO") {
      return NextResponse.json({
        error: guide?.description || "This video doesn't appear to be a how-to tutorial. Try a different video.",
        notHowTo: true,
      }, { status: 400 });
    }

    // Save to database
    const { data: savedGuide, error: saveError } = await supabase
      .from("guides")
      .insert({
        user_id: user.id,
        video_url: videoUrl,
        video_id: videoId,
        video_title: videoInfo.title,
        video_thumbnail: videoInfo.thumbnail,
        channel_name: videoInfo.channelName,
        duration: videoInfo.duration || "",
        guide_content: guide,
        status: "completed",
        used_whisper: usedN8n,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving guide:", saveError);
      // Still return the guide even if save fails
    }

    // Deduct credit for free users
    if (plan === "free") {
      await supabase
        .from("users")
        .update({ credits: credits - 1 })
        .eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      guideId: savedGuide?.id,
      guide,
      videoInfo: {
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        channel: videoInfo.channelName,
        duration: videoInfo.duration,
      },
      usedN8n,
    });

  } catch (error) {
    console.error("Conversion error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid request. Please provide a valid YouTube URL.",
      }, { status: 400 });
    }

    return NextResponse.json({
      error: "Failed to generate guide. Please try again.",
    }, { status: 500 });
  }
}
