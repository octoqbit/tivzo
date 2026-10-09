"use client";
import { useTheme } from "@/lib/tivzo/use-theme";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Clock,
  Ticket,
  Download,
  Check,
  LoaderCircle,
  Sun,
  Moon,
} from "lucide-react";
import { Brand } from "./brand";
import { EventRecord, demoEvents } from "@/lib/tivzo/types";
import { getClient, ticketSecret } from "@/lib/tivzo/client";
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}
function Challenge({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id: string | undefined;
    let cancelled = false;
    const render = () => {
      if (!cancelled && ref.current && window.turnstile)
        id = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: onToken,
          "expired-callback": () => onToken(""),
        });
    };
    let script = document.querySelector<HTMLScriptElement>(
      "script[data-turnstile]",
    );
    if (window.turnstile) render();
    else {
      if (!script) {
        script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.dataset.turnstile = "true";
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }
    return () => {
      cancelled = true;
      if (id) window.turnstile?.remove(id);
      script?.removeEventListener("load", render);
    };
  }, [siteKey, onToken]);
  return <div ref={ref} />;
}
export default function Registration({
  event: provided,
  slug,
  onBack,
}: {
  event?: EventRecord;
  slug?: string;
  onBack?: () => void;
}) {
  const [event, setEvent] = useState<EventRecord | null>(provided || null);
  const [demo, setDemo] = useState(true);
  const [loading, setLoading] = useState(!provided);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<{
    name: string;
    id: string;
    token: string;
  } | null>(null);
  const [qr, setQr] = useState("");
  const [siteKey, setSiteKey] = useState("");
  const [challenge, setChallenge] = useState("");
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [dark, setDark] = useTheme();
  const attempt = useRef<{
    key: string;
    token: string;
    name: string;
    email: string;
  } | null>(null);
  useEffect(() => {
    if (provided) {
      getClient().then((c) => setDemo(!c));
      fetch("/api/config")
        .then((r) => r.json() as Promise<{ turnstileKey?: string }>)
        .then((c) => setSiteKey(c.turnstileKey || ""));
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([
      getClient(),
      fetch("/api/config").then(
        (r) => r.json() as Promise<{ turnstileKey?: string }>,
      ),
    ])
      .then(async ([client, cfg]) => {
        if (!active) return;
        setDemo(!client);
        setSiteKey(cfg.turnstileKey || "");
        if (client) {
          const { data, error } = await client.rpc("public_event", {
            p_slug: slug,
          });
          if (error) throw error;
          setEvent(data || null);
        } else setEvent(demoEvents.find((e) => e.slug === slug) || null);
        setLoading(false);
      })
      .catch(() => {
        setError("This event could not be loaded. Please try again.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, provided]);
  useEffect(() => {
    if (ticket)
      import("qrcode")
        .then((q) =>
          q.toDataURL("tivzo:" + ticket.token, {
            width: 360,
            margin: 3,
            errorCorrectionLevel: "M",
          }),
        )
        .then(setQr);
  }, [ticket]);
  async function register(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!event) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim(),
      email = String(f.get("email")).trim().toLowerCase();
    if (
      !attempt.current ||
      attempt.current.name !== name ||
      attempt.current.email !== email
    )
      attempt.current = {
        key: crypto.randomUUID(),
        token: ticketSecret(),
        name,
        email,
      };
    try {
      if (demo) {
        await new Promise((r) => setTimeout(r, 300));
        setTicket({
          name,
          id: "SAMPLE-" + attempt.current.key.slice(0, 6),
          token: attempt.current.token,
        });
        return;
      }
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ...attempt.current,
          challenge,
        }),
      });
      const data = (await response.json()) as { id: string; error?: string };
      if (!response.ok) {
        if (response.status === 400) {
          setChallenge("");
          setChallengeVersion((v) => v + 1);
        }
        throw new Error(data.error || "Please try again in a moment.");
      }
      setTicket({ name, id: data.id, token: attempt.current.token });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn’t confirm your registration. Retry with the same details.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="public-page">
      <header className="public-header">
        <a href="/" aria-label="Tivzo home">
          <Brand />
        </a>
        <span>GOOD THINGS BRING PEOPLE TOGETHER.</span>
        <button
          className="icon-button"
          aria-label="Toggle theme"
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </header>
      {onBack && (
        <button className="text-button public-back" onClick={onBack}>
          Back to your workspace
        </button>
      )}
      {loading ? (
        <div className="public-loading">
          <LoaderCircle className="spin" />
          Loading event…
        </div>
      ) : !event ? (
        <div className="empty-state">
          <Ticket size={40} />
          <h1>Nothing here just yet.</h1>
          <p>
            {error || "This event may be unpublished or the link is incorrect."}
          </p>
          <a href="/" className="button primary">
            Back to Tivzo
          </a>
        </div>
      ) : (
        <div className="public-grid">
          <div className="public-event">
            <div className={"event-art public-art " + event.accent}>
              <span className="art-top">
                <span>TIVZO PRESENTS</span>
                <span>{new Date(event.date + "T12:00:00").getFullYear()}</span>
              </span>
              <div className="public-art-title">{event.name}</div>
              <span className="art-bottom">
                <span>{event.category.toUpperCase()}</span>
                <span>BE PART OF IT.</span>
              </span>
            </div>
            <span className="eyebrow">{event.category}</span>
            <h1>{event.name}</h1>
            <div className="event-detail-lines">
              <span>
                <CalendarDays size={18} />
                {new Date(event.date + "T12:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </span>
              <span>
                <Clock size={18} />
                {event.time} IST
              </span>
              <span>
                <MapPin size={18} />
                {event.venue}
              </span>
            </div>
            <div className="event-about">
              <h2>Worth showing up for.</h2>
              <p>{event.description}</p>
            </div>
          </div>
          <section className="registration-card">
            {ticket ? (
              <>
                <span className="ticket-success">
                  <Check size={21} />
                </span>
                <span className="eyebrow">
                  {demo ? "YOUR SAMPLE TICKET" : "YOU’RE ON THE LIST"}
                </span>
                <h2>See you there, {ticket.name.split(" ")[0]}.</h2>
                <p>Keep this ticket handy at the entrance.</p>
                <div className="qr-ticket">
                  {qr ? (
                    <img
                      src={qr}
                      alt="Your event QR ticket"
                      width={240}
                      height={240}
                    />
                  ) : (
                    <LoaderCircle className="spin" />
                  )}
                  <strong>{ticket.name}</strong>
                  <span>{event.name}</span>
                  <small>{ticket.id.slice(0, 12).toUpperCase()}</small>
                </div>
                {demo && (
                  <div className="notice">
                    Sample ticket only. Not valid for admission.
                  </div>
                )}
                <a
                  className="button primary full"
                  href={qr}
                  download={`tivzo-${event.slug}-qr.png`}
                >
                  <Download size={17} />
                  Save QR ticket
                </a>
                <button
                  className="button secondary full"
                  onClick={() => window.print()}
                >
                  Print ticket / save PDF
                </button>
                <p className="privacy-note">
                  Your QR is your entry pass. Keep it private.
                </p>
              </>
            ) : (
              <>
                <span className="badge live">Free event</span>
                <h2>A place with your name on it.</h2>
                <p>Just a few details. No account needed.</p>
                {demo && (
                  <div className="notice">
                    Preview only. Use sample details; no registration is saved.
                  </div>
                )}
                <form onSubmit={register}>
                  <label>
                    Full name
                    <input
                      name="name"
                      autoComplete="name"
                      placeholder="Your name"
                      required
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      maxLength={254}
                    />
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" required />I agree to share these
                    details with the event organizer for registration and entry.{" "}
                    Read the{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      privacy policy
                    </a>
                    .
                  </label>
                  {!demo && siteKey && (
                    <Challenge
                      key={challengeVersion}
                      siteKey={siteKey}
                      onToken={setChallenge}
                    />
                  )}
                  <button
                    className="button primary full"
                    disabled={
                      busy ||
                      event.status !== "published" ||
                      (!demo && !challenge)
                    }
                  >
                    {busy ? (
                      <>
                        <LoaderCircle size={17} className="spin" />
                        Confirming…
                      </>
                    ) : event.status !== "published" ? (
                      "Registration is closed"
                    ) : demo ? (
                      "Preview my ticket"
                    ) : (
                      "Get my ticket"
                    )}
                  </button>
                  {!demo && !siteKey && (
                    <p className="notice">
                      Registration is being prepared. Please check back shortly.
                    </p>
                  )}
                  {error && (
                    <p className="error-message" role="alert">
                      {error}
                    </p>
                  )}
                </form>
                <div className="registration-note">
                  <Ticket size={18} />
                  <span>
                    Your QR ticket appears immediately after confirmation.
                  </span>
                </div>
                <p className="privacy-note">One ticket. One entry. All set.</p>
              </>
            )}
          </section>
        </div>
      )}
      <footer className="public-footer">
        Made for the moments that matter. <Brand />
      </footer>
    </div>
  );
}
