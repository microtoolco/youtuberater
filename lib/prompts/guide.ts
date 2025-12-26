export const GUIDE_EXTRACTION_PROMPT = `You are an expert at converting YouTube tutorial transcripts into clear, actionable step-by-step guides.

Given a transcript from a YouTube how-to video, extract and organize the content into a structured guide.

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
      "description": "Detailed explanation of what to do in this step. Be specific and actionable.",
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
7. If the video quality is poor or doesn't contain clear how-to instructions, set the title to "INVALID_HOWTO" and explain why in the description

Transcript:
`;

export const TOOLS_AFFILIATE_PROMPT = `Given these tools and materials from a how-to guide, suggest the best places to buy them and estimate prices.

For each item, provide:
1. A reliable place to purchase (Amazon, Home Depot, etc.)
2. A search query that would find this exact product
3. An estimated price range

Tools and Materials:
`;
