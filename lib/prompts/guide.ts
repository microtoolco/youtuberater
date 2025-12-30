import type { SkillLevel } from "@/types";

const SKILL_LEVEL_INSTRUCTIONS: Record<SkillLevel, string> = {
  beginner: `SKILL LEVEL: BEGINNER
- Explain every step in full detail as if the reader has never done anything like this before
- Define any technical terms when first used
- Include context like "this is important because..."
- Explain WHY each step is done, not just what to do
- Include helpful analogies when possible
- Break complex steps into smaller sub-steps
- Example: "Preheat your oven to 350°F (175°C). The preheat dial is typically located on the front of your oven - turn it clockwise until the indicator points to 350. Wait for the oven to reach temperature (usually 10-15 minutes, you may hear a beep or see a light turn off)."`,

  functional: `SKILL LEVEL: FUNCTIONAL
- Provide clear, complete instructions
- Explain key concepts but assume basic familiarity with common tools/terms
- Include important details and measurements
- Mention tips for better results
- Example: "Preheat your oven to 350°F (175°C). Allow 10-15 minutes for it to reach temperature."`,

  fluent: `SKILL LEVEL: FLUENT
- Write concise, efficient instructions
- Assume familiarity with basic techniques and terminology
- Focus on the unique aspects of this particular task
- Skip obvious details that experienced people would know
- Example: "Preheat oven to 350°F."`,

  expert: `SKILL LEVEL: EXPERT
- Provide minimal, essential-only instructions
- Assume deep knowledge of the subject area
- List only critical steps and non-obvious information
- Use technical terminology freely
- Focus on what makes this specific task unique
- Example: "350°F" (as a prerequisite, not even a step)`
};

export function getGuidePrompt(skillLevel: SkillLevel = "functional"): string {
  return `You are an expert at converting YouTube tutorial transcripts into clear, actionable step-by-step guides.

${SKILL_LEVEL_INSTRUCTIONS[skillLevel]}

Given a transcript from a YouTube how-to video, extract and organize the content into a structured guide TAILORED TO THE SKILL LEVEL ABOVE.

Your response MUST be valid JSON with this exact structure:
{
  "title": "Clear, descriptive title for the guide",
  "description": "Brief 1-2 sentence overview of what this guide teaches",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedTime": "Realistic time estimate (e.g., '30 minutes', '2 hours')",
  "toolsAndMaterials": [
    {
      "name": "Tool or material name",
      "description": "Brief description or specification if relevant",
      "required": true/false,
      "estimatedPrice": "$X-$Y (optional, if mentioned)"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Short step title",
      "description": "Step explanation ADAPTED TO THE SKILL LEVEL. Beginners need full detail, experts need minimal.",
      "tips": ["Optional helpful tips for this step"],
      "warnings": ["Optional safety warnings or common mistakes to avoid"]
    }
  ],
  "tips": ["General tips that apply to the whole project"],
  "warnings": ["Important safety warnings or things to avoid"]
}

IMPORTANT GUIDELINES:
1. Extract ALL tools and materials mentioned, even if briefly
2. Break down into clear, numbered steps - aim for 5-15 steps depending on complexity
3. Each step should be one discrete action
4. Include specific measurements, temperatures, times when mentioned
5. Add helpful tips the creator mentions
6. Include safety warnings where relevant
7. ADJUST THE DETAIL LEVEL OF EACH STEP BASED ON THE SKILL LEVEL
8. If the video quality is poor or doesn't contain clear how-to instructions, set the title to "INVALID_HOWTO" and explain why in the description

Transcript:
`;
}

// Keep the old export for backwards compatibility
export const GUIDE_EXTRACTION_PROMPT = getGuidePrompt("functional");

export const TOOLS_AFFILIATE_PROMPT = \`Given these tools and materials from a how-to guide, suggest the best places to buy them and estimate prices.

For each item, provide:
1. A reliable place to purchase (Amazon, Home Depot, etc.)
2. A search query that would find this exact product
3. An estimated price range

Tools and Materials:
\`;
