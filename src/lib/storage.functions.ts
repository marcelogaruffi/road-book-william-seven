import { createServerFn } from "@tanstack/react-start";

// Public: returns signed URLs for files in the private roadbook-docs bucket.
// Road books are public anyway (anyone with the slug can read), so signing
// arbitrary paths in this bucket is acceptable for display.
export const signRoadbookFiles = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const data = d as { paths: string[] };
    if (!Array.isArray(data?.paths)) throw new Error("paths required");
    return { paths: data.paths.filter((p) => typeof p === "string" && p.length > 0).slice(0, 200) };
  })
  .handler(async ({ data }) => {
    if (data.paths.length === 0) return { urls: {} as Record<string, string> };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("roadbook-docs")
      .createSignedUrls(data.paths, 60 * 60 * 24 * 7); // 7 dias
    if (error) throw error;
    const urls: Record<string, string> = {};
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
    }
    return { urls };
  });
