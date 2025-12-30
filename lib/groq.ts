import Groq from "groq-sdk";
import { getGuidePrompt } from "@/lib/prompts/guide";
import type { GuideContent, SkillLevel } from "@/types";

// Lazy-initialize Groq client to avoid build errors when env var not set
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

/**
 * Generates a structured guide from a YouTube video transcript using Groq AI
 *
 * @param transcript - The full transcript text from the YouTube video
 * @param videoTitle - The title of the YouTube video
 * @param skillLevel - The user's skill level for detail adjustment
 * @returns Promise<GuideContent> - Structured guide content
 * @throws Error if API call fails or response is invalid
 */
export async function generateGuide(
  transcript: string,
  videoTitle: string,
  skillLevel: SkillLevel = "functional"
): Promise<GuideContent> {
  try {
    // Validate inputs
    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcript cannot be empty");
    }

    if (!videoTitle || videoTitle.trim().length === 0) {
      throw new Error("Video title cannot be empty");
    }

    // Construct the full prompt with transcript, video title, and skill level
    const fullPrompt = `${getGuidePrompt(skillLevel)}

Video Title: ${videoTitle}

${transcript}

Remember: Return ONLY valid JSON. No markdown code blocks, no explanations, just the JSON object.`;

    // Call Groq API with llama-3.3-70b-versatile model
    const completion = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a precise JSON generator that converts YouTube tutorial transcripts into structured guides. Always return valid JSON without markdown formatting.",
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      temperature: 0.3, // Low temperature for consistent, focused output
      max_tokens: 4000, // Sufficient for detailed guides
      response_format: { type: "json_object" }, // Ensure JSON response
    });

    // Extract response content
    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response content received from Groq API");
    }

    // Parse JSON response
    let guideContent: GuideContent;
    try {
      guideContent = JSON.parse(responseContent) as GuideContent;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", responseContent);
      throw new Error(
        `Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
      );
    }

    // Validate the parsed content has required fields
    if (!guideContent.title || !guideContent.steps || !Array.isArray(guideContent.steps)) {
      throw new Error("AI response missing required fields (title, steps)");
    }

    // Check if the video was deemed invalid for how-to content
    if (guideContent.title === "INVALID_HOWTO") {
      throw new Error(
        `This video does not appear to be a valid how-to tutorial: ${guideContent.description}`
      );
    }

    // Ensure required arrays exist (with defaults if missing)
    guideContent.toolsAndMaterials = guideContent.toolsAndMaterials || [];
    guideContent.tips = guideContent.tips || [];
    guideContent.warnings = guideContent.warnings || [];

    // Validate steps structure
    if (guideContent.steps.length === 0) {
      throw new Error("Guide must contain at least one step");
    }

    // Ensure each step has required fields
    guideContent.steps = guideContent.steps.map((step, index) => ({
      ...step,
      stepNumber: step.stepNumber || index + 1,
      tips: step.tips || [],
      warnings: step.warnings || [],
    }));

    // Validate difficulty level
    const validDifficulties = ["beginner", "intermediate", "advanced"];
    if (!validDifficulties.includes(guideContent.difficulty)) {
      console.warn(
        `Invalid difficulty level: ${guideContent.difficulty}, defaulting to 'intermediate'`
      );
      guideContent.difficulty = "intermediate";
    }

    return guideContent;
  } catch (error) {
    // Log error details for debugging
    console.error("Error generating guide with Groq:", error);

    // Re-throw with more context if it's not already our custom error
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to generate guide from transcript");
  }
}

/**
 * Validates the Groq API configuration
 *
 * @returns boolean - True if API key is configured
 */
export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 0;
}

/**
 * Tests the Groq API connection with a simple request
 *
 * @returns Promise<boolean> - True if connection successful
 */
export async function testGroqConnection(): Promise<boolean> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: "Respond with just the word 'OK'",
        },
      ],
      max_tokens: 10,
    });

    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Groq connection test failed:", error);
    return false;
  }
}
