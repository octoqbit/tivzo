import { createClient, SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | null = null;
export async function getClient() {
  if (client) return client;
  const config = (await fetch("/api/config").then((r) => r.json())) as {
    configured: boolean;
    url: string;
    key: string;
  };
  if (!config.configured) return null;
  client = createClient(config.url, config.key);
  return client;
}
export function downloadFile(
  name: string,
  content: string,
  type = "text/plain",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvCell(value: unknown) {
  const raw = String(value ?? "");
  return (
    '"' +
    (/^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw).replaceAll('"', '""') +
    '"'
  );
}
export function ticketSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
export function extractToken(raw: string) {
  const token = raw.trim().replace(/^tivzo:/, "");
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}
