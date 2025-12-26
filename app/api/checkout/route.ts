import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface CheckoutRequest {
  variantId: string;
}

interface LemonSqueezyCheckoutResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      url: string;
      store_id: number;
      variant_id: number;
    };
  };
}

export async function POST(request: Request) {
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

    // Parse request body
    const body: CheckoutRequest = await request.json();
    const { variantId } = body;

    if (!variantId) {
      return NextResponse.json(
        { error: "Missing variantId in request body" },
        { status: 400 }
      );
    }

    // Validate environment variable
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    if (!apiKey) {
      console.error("LEMON_SQUEEZY_API_KEY not configured");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    // Create checkout session with Lemon Squeezy
    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: process.env.LEMON_SQUEEZY_STORE_ID || "",
              },
            },
            variant: {
              data: {
                type: "variants",
                id: variantId,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Lemon Squeezy API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: response.status }
      );
    }

    const data: LemonSqueezyCheckoutResponse = await response.json();

    // Return checkout URL
    return NextResponse.json({
      checkoutUrl: data.data.attributes.url,
    });
  } catch (error) {
    console.error("Unexpected error in checkout API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
