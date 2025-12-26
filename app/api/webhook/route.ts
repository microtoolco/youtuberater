import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      store_id: number;
      customer_id: number;
      product_id: number;
      variant_id: number;
      product_name: string;
      variant_name: string;
      user_email: string;
      status: string;
      status_formatted: string;
      card_brand: string | null;
      card_last_four: string | null;
      renews_at: string | null;
      ends_at: string | null;
      trial_ends_at: string | null;
      created_at: string;
      updated_at: string;
    };
  };
}

// Verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Map variant to plan type
function getplanFromVariant(variantName: string): "free" | "monthly" | "lifetime" {
  const lowerName = variantName.toLowerCase();
  if (lowerName.includes("lifetime")) {
    return "lifetime";
  } else if (lowerName.includes("monthly") || lowerName.includes("month")) {
    return "monthly";
  }
  return "free";
}

export async function POST(request: Request) {
  try {
    // Get webhook secret
    const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("LEMON_SQUEEZY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    if (!signature) {
      console.error("Missing webhook signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    // Verify webhook signature
    if (!verifySignature(rawBody, signature, webhookSecret)) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload: WebhookPayload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;

    // Only handle subscription events
    if (
      eventName !== "subscription_created" &&
      eventName !== "subscription_updated"
    ) {
      return NextResponse.json({ message: "Event ignored" });
    }

    // Extract user information
    const customData = payload.meta.custom_data;
    const userId = customData?.user_id;
    const userEmail = payload.data.attributes.user_email;

    if (!userId && !userEmail) {
      console.error("No user identifier in webhook payload");
      return NextResponse.json(
        { error: "Missing user identifier" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabase = await createClient();

    // Find user by ID or email
    let targetUserId = userId;
    if (!targetUserId && userEmail) {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", userEmail)
        .single();

      if (userError || !userData) {
        console.error("User not found:", userEmail);
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      targetUserId = userData.id;
    }

    // Determine plan type from variant name
    const variantName = payload.data.attributes.variant_name;
    const plan = getplanFromVariant(variantName);
    const customerId = payload.data.attributes.customer_id;
    const subscriptionStatus = payload.data.attributes.status;

    // Update user plan in database
    const updateData: {
      plan: "free" | "monthly" | "lifetime";
      lemon_customer_id: number;
      updated_at: string;
    } = {
      plan: subscriptionStatus === "active" ? plan : "free",
      lemon_customer_id: customerId,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", targetUserId);

    if (updateError) {
      console.error("Failed to update user plan:", updateError);
      return NextResponse.json(
        { error: "Failed to update user plan" },
        { status: 500 }
      );
    }

    console.log(
      `Successfully updated user ${targetUserId} to plan: ${updateData.plan}`
    );

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Unexpected error in webhook API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
