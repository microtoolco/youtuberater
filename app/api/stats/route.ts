import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Stats } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get user data from users table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("plan, credits")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Get total guides count
    const { count: totalGuides, error: totalError } = await supabase
      .from("guides")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (totalError) {
      console.error("Total guides count error:", totalError);
      return NextResponse.json(
        { error: "Failed to fetch total guides" },
        { status: 500 }
      );
    }

    // Get guides created this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { count: thisMonth, error: monthError } = await supabase
      .from("guides")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    if (monthError) {
      console.error("This month guides count error:", monthError);
      return NextResponse.json(
        { error: "Failed to fetch monthly guides" },
        { status: 500 }
      );
    }

    // Calculate credits remaining based on plan
    const plan = profile.plan || "free";
    let creditsRemaining = 0;
    let monthlyLimit: number | undefined;

    switch (plan) {
      case "free":
        // Free plan uses credits field (total limit of 3)
        creditsRemaining = Math.max(0, 3 - (totalGuides || 0));
        break;
      case "monthly":
        // Monthly plan: 50 guides per month
        monthlyLimit = 50;
        creditsRemaining = Math.max(0, 50 - (thisMonth || 0));
        break;
      case "lifetime":
        // Lifetime plan: 100 guides per month
        monthlyLimit = 100;
        creditsRemaining = Math.max(0, 100 - (thisMonth || 0));
        break;
      default:
        creditsRemaining = 0;
    }

    const stats: Stats = {
      totalGuides: totalGuides || 0,
      creditsRemaining,
      thisMonth: thisMonth || 0,
      plan,
      monthlyLimit,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Unexpected error in stats API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
