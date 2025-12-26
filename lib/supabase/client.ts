import { createBrowserClient } from "@supabase/ssr";

// Lazy-initialize to avoid build errors when env vars not set
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return a placeholder during build if env vars not available
  if (!url || !key) {
    // During SSR/build, return a mock that won't be used
    if (typeof window === "undefined") {
      return createBrowserClient(
        "https://placeholder.supabase.co",
        "placeholder-key"
      );
    }
    throw new Error("Supabase environment variables are not configured");
  }

  client = createBrowserClient(url, key);
  return client;
}
