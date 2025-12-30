export type SkillLevel = "beginner" | "functional" | "fluent" | "expert";

export const SKILL_LEVEL_INFO: Record<SkillLevel, { label: string; description: string }> = {
  beginner: {
    label: "Beginner",
    description: "Detailed explanations for every step, assumes no prior knowledge"
  },
  functional: {
    label: "Functional",
    description: "Clear instructions with key concepts explained"
  },
  fluent: {
    label: "Fluent",
    description: "Concise steps for those familiar with the basics"
  },
  expert: {
    label: "Expert",
    description: "Minimal explanations, just the essential steps"
  }
};

export interface User {
  id: string;
  email: string;
  plan: "free" | "monthly" | "lifetime";
  credits: number;
  lemon_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Guide {
  id: string;
  user_id: string;
  video_url: string;
  video_id: string;
  video_title: string;
  video_thumbnail: string;
  channel_name: string;
  duration: string;
  guide_content: GuideContent;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

export interface GuideContent {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  toolsAndMaterials: ToolItem[];
  steps: GuideStep[];
  tips: string[];
  warnings: string[];
}

export interface ToolItem {
  name: string;
  description?: string;
  required: boolean;
  affiliateLink?: string;
  buyLink?: string;
  estimatedPrice?: string;
}

export interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  timestamp?: string;
  tips?: string[];
  warnings?: string[];
}

export interface VideoSearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
}

export interface ConversionRequest {
  videoUrl?: string;
  searchQuery?: string;
}

export interface ConversionResponse {
  success: boolean;
  guideId?: string;
  guide?: GuideContent;
  videoInfo?: {
    title: string;
    thumbnail: string;
    channel: string;
    duration: string;
  };
  error?: string;
  suggestions?: VideoSearchResult[];
}

export interface Stats {
  totalGuides: number;
  creditsRemaining: number;
  thisMonth: number;
  plan?: string;
  monthlyLimit?: number;
}
