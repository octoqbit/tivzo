import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const schema = z.object({
  eventId: z.string().uuid(),
  key: z.string().uuid(),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  challenge: z.string().max(2048),
});
const reply = (
  error: string,
  status: number,
  headers?: Record<string, string>,
) =>
  Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY,
    secret = process.env.TURNSTILE_SECRET_KEY;
  if (!url || !key || !secret)
    return reply(
      "Registration is not open yet. Please check back shortly.",
      503,
    );
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return reply("Please register from the event page.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return reply("Invalid request.", 415);
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply("Missing registration details.", 400);
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8192) {
        await reader.cancel();
        return reply("Registration details are too long.", 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let position = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, position);
      position += chunk.length;
    }
    const text = new TextDecoder().decode(bytes);
    const parsed = schema.safeParse(JSON.parse(text));
    if (!parsed.success)
      return reply("Check your name and email, then try again.", 400);
    const body = parsed.data;
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const args = {
      p_event_id: body.eventId,
      p_name: body.name,
      p_email: body.email,
      p_token: body.token,
      p_key: body.key,
    };
    const { data: receipt, error: receiptError } = await db
      .rpc("registration_receipt", args)
      .abortSignal(AbortSignal.timeout(5000));
    if (receiptError)
      return reply(
        "Registration is temporarily unavailable. Please retry.",
        503,
      );
    if (receipt)
      return Response.json(receipt, {
        headers: { "Cache-Control": "no-store" },
      });
    const { data: admitted, error: admissionError } = await db
      .rpc("registration_admission", { p_event: body.eventId })
      .abortSignal(AbortSignal.timeout(5000));
    if (admissionError)
      return reply(
        "Registration is busy. Your details have not been confirmed; please retry.",
        503,
      );
    if (!admitted)
      return reply(
        "A lot of people are joining. Please wait 10 seconds and try again.",
        429,
        { "Retry-After": "10" },
      );
    const verification = (await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: body.challenge,
          idempotency_key: body.key,
        }),
        signal: AbortSignal.timeout(8000),
      },
    ).then((r) => r.json())) as { success: boolean; hostname?: string };
    if (
      !verification.success ||
      verification.hostname !== new URL(request.url).hostname
    )
      return reply("Please complete the security check again.", 400);
    const { data, error } = await db
      .rpc("register_guest", {
        p_event_id: body.eventId,
        p_name: body.name,
        p_email: body.email,
        p_token: body.token,
        p_key: body.key,
      })
      .abortSignal(AbortSignal.timeout(8000));
    if (error) {
      const safe = [
        "This event is full.",
        "Registration is closed.",
        "Request key does not match the original registration.",
      ];
      return reply(
        safe.includes(error.message)
          ? error.message
          : "Could not confirm registration. Retry with the same details.",
        safe.includes(error.message) ? 409 : 503,
      );
    }
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return reply(
      "Could not confirm registration. Your details are still here; please retry.",
      503,
    );
  }
}
