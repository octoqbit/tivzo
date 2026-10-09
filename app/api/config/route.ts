export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  return Response.json(
    {
      configured: !!(url && key),
      url: url || null,
      key: key || null,
      turnstileKey: process.env.TURNSTILE_SITE_KEY || null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
