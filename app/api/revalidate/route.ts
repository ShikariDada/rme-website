import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

/**
 * Content webhook target (spec §15): Sanity (or an operator) posts here after
 * publishing; tagged cached pages revalidate. Protect with
 * SANITY_REVALIDATE_SECRET via the x-revalidate-secret header.
 */
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "Revalidation not configured" }, { status: 501 });
  }
  const provided = request.headers.get("x-revalidate-secret");
  if (provided !== secret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let tags: string[] = ["content"];
  try {
    const body = (await request.json()) as { tags?: unknown };
    if (Array.isArray(body.tags)) {
      const clean = body.tags.filter((t): t is string => typeof t === "string" && t.length > 0 && t.length < 64);
      if (clean.length > 0) tags = clean.slice(0, 20);
    }
  } catch {
    // keep default tag
  }

  for (const tag of tags) revalidateTag(tag, "max");
  return Response.json({ ok: true, revalidated: tags });
}
