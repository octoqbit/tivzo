"use client";
import { useEffect, useRef, useState } from "react";
import {
  ScanLine,
  Camera,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  Pause,
  Wifi,
  ShieldCheck,
  Smartphone,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Workspace } from "@/lib/tivzo/use-workspace";
import { extractToken } from "@/lib/tivzo/client";
type Result = {
  status: string;
  name?: string;
  checked_at?: string;
  replayed?: boolean;
};
export default function Scanner({
  workspace: w,
  initialEvent,
}: {
  workspace: Workspace;
  initialEvent?: string;
}) {
  const [eventId, setEventId] = useState(
    initialEvent || w.events.find((e) => e.status === "published")?.id || "",
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sound, setSound] = useState(true);
  const [scans, setScans] = useState<Result[]>([]);
  const [online, setOnline] = useState(true);
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ stop: () => void } | null>(null);
  const processing = useRef(false);
  const lastSeen = useRef({ text: "", at: 0 });
  const mounted = useRef(true);
  const soundRef = useRef(true);
  const request = useRef<{ token: string; id: string; eventId: string } | null>(
    null,
  );
  const active = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);
  useEffect(() => {
    mounted.current = true;
    const on = () => setOnline(navigator.onLine);
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      mounted.current = false;
      active.current = false;
      controls.current?.stop();
      audio.current?.close();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  function beep(success: boolean) {
    if (!soundRef.current || !audio.current) return;
    const ctx = audio.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 880 : 240;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    navigator.vibrate?.(success ? 70 : [70, 40, 70]);
  }
  async function verify() {
    if (!request.current) return;
    processing.current = true;
    setPending(true);
    setError("");
    let outcome: Result | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = request.current;
        outcome = await w.checkIn(r.eventId, r.token, r.id);
        break;
      } catch (e) {
        if (attempt === 2) {
          if (mounted.current)
            setError(
              "Confirmation is still pending. Keep this guest here and retry when connected.",
            );
          return;
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    if (!mounted.current) return;
    if (outcome) {
      setResult(outcome);
      setPending(false);
      request.current = null;
      beep(outcome.status === "approved" && !outcome.replayed);
      if (outcome.status === "approved" && !outcome.replayed)
        setScans((old) => [outcome!, ...old].slice(0, 6));
      setTimeout(() => {
        if (mounted.current) {
          setResult(null);
          processing.current = false;
        }
      }, 1600);
    }
  }
  async function start() {
    setError("");
    if (w.demo) {
      setError(
        "The camera can read tickets, but live attendance needs your Supabase connection. Use the sample flow below to preview the experience.",
      );
    }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      active.current = true;
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 150,
        delayBetweenScanSuccess: 250,
      });
      const c = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
          },
          audio: false,
        },
        video.current!,
        (decoded) => {
          if (!active.current) return;
          if (!decoded) {
            if (Date.now() - lastSeen.current.at > 1500)
              lastSeen.current.text = "";
            return;
          }
          const raw = decoded.getText();
          if (processing.current) return;
          const same = raw === lastSeen.current.text;
          lastSeen.current = { text: raw, at: Date.now() };
          if (same) return;
          processing.current = true;
          const token = extractToken(raw);
          if (w.demo || !token) {
            setResult({ status: w.demo ? "demo" : "invalid" });
            setTimeout(() => {
              if (mounted.current) {
                processing.current = false;
                setResult(null);
              }
            }, 1600);
            return;
          }
          request.current = { eventId, token, id: crypto.randomUUID() };
          void verify();
        },
      );
      if (!active.current) {
        c.stop();
        return;
      }
      controls.current = c;
      setRunning(true);
    } catch (e) {
      active.current = false;
      setError(
        e instanceof Error && e.name === "NotAllowedError"
          ? "Camera access was denied. Allow camera access in your browser, then try again."
          : "Could not open the camera. Use HTTPS on a phone, check camera permissions, and close other camera apps.",
      );
    }
  }
  function pause() {
    active.current = false;
    controls.current?.stop();
    setRunning(false);
  }
  function sample() {
    if (processing.current) return;
    processing.current = true;
    setPending(true);
    setTimeout(() => {
      if (!mounted.current) return;
      setPending(false);
      setResult({ status: "sample", name: "Isha Kapoor" });
      beep(true);
      setTimeout(() => {
        if (mounted.current) {
          setResult(null);
          processing.current = false;
        }
      }, 1600);
    }, 500);
  }
  const good = result?.status === "approved";
  return (
    <>
      <div className="scanner-toolbar">
        <label>
          Event
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            disabled={running || pending}
          >
            {w.events
              .filter((e) => e.status === "published")
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
          </select>
        </label>
        <div className="scanner-connection">
          <Wifi size={15} />
          {online ? "Connection available" : "Offline — approval paused"}
        </div>
      </div>
      <div className="scanner-layout">
        <section className="camera-panel">
          <div className="camera-top">
            <span>
              <ScanLine size={16} />
              Entry scanner
            </span>
            <button
              className="icon-button"
              aria-label={sound ? "Mute scan sound" : "Enable scan sound"}
              onClick={() => setSound(!sound)}
            >
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
          <div className="camera-view">
            <video ref={video} muted playsInline autoPlay />
            <div className="scan-brackets">
              <span />
              <span />
              <span />
              <span />
            </div>
            {!running && !pending && !result && (
              <div className="camera-empty">
                <Camera size={42} strokeWidth={1.3} />
                <h2>Ready for a warm welcome.</h2>
                <p>
                  Start your camera, then hold a QR
                  <br />
                  inside the frame. No taps between tickets.
                </p>
              </div>
            )}
            {(pending || result) && (
              <div
                className={
                  "scan-result " +
                  (pending
                    ? "pending"
                    : good
                      ? "approved"
                      : result?.status === "sample"
                        ? "sample"
                        : "rejected")
                }
                role="status"
              >
                {pending ? (
                  <LoaderCircle className="spin" size={50} />
                ) : good || result?.status === "sample" ? (
                  <CheckCircle2 size={50} />
                ) : (
                  <XCircle size={50} />
                )}
                <h2>
                  {pending
                    ? "Checking ticket…"
                    : result?.status === "sample"
                      ? "Sample approval"
                      : good
                        ? result?.replayed
                          ? "Previously confirmed"
                          : "Entry approved"
                        : result?.status === "used"
                          ? "Already checked in"
                          : result?.status === "demo"
                            ? "Demo — no entry saved"
                            : result?.status === "closed"
                              ? "Event is closed"
                              : "Ticket not valid"}
                </h2>
                <p>
                  {pending
                    ? "Waiting for a saved confirmation"
                    : result?.name || "Please check with the organizer."}
                </p>
                {result?.replayed && (
                  <small>
                    Recovered receipt. Do not admit this ticket twice.
                  </small>
                )}
                {result?.status === "sample" && (
                  <small>Preview only · No attendance saved</small>
                )}
              </div>
            )}
          </div>
          <div className="camera-bottom">
            <span>
              {pending
                ? "Waiting for confirmation"
                : running
                  ? "Point. Scan. Welcome."
                  : "Camera is off"}
            </span>
            <button
              className="button secondary"
              onClick={running ? pause : start}
              disabled={!eventId || pending}
            >
              {running ? <Pause size={16} /> : <Camera size={16} />}{" "}
              {running ? "Pause camera" : "Start camera"}
            </button>
          </div>
          {error && (
            <div className="notice" role="alert">
              {error}
              {pending && (
                <button className="text-button" onClick={() => void verify()}>
                  Retry confirmation
                </button>
              )}
            </div>
          )}
          {w.demo && (
            <div className="demo-scanner-note">
              <span>Sample flow · no real admissions</span>
              <button
                className="text-button"
                onClick={sample}
                disabled={pending || running}
              >
                Preview automatic result
              </button>
            </div>
          )}
        </section>
        <aside>
          <div className="panel scan-session">
            <span className="eyebrow">THIS SESSION</span>
            <div className="session-total">
              {scans.length.toString().padStart(2, "0")}
            </div>
            <p>Guests welcomed by this phone</p>
            <div className="feature-line">
              <ShieldCheck size={17} />
              <span>One ticket. One entry.</span>
            </div>
            <div className="feature-line">
              <Smartphone size={17} />
              <span>Designed for 5 phones together</span>
            </div>
            <div className="feature-line">
              <CheckCircle2 size={17} />
              <span>Approval only after saving</span>
            </div>
            {w.demo && (
              <div className="notice">
                Preview mode. Shared attendance becomes available after setup.
              </div>
            )}
          </div>
          <div className="panel recent-scans">
            <h2>Latest on this phone</h2>
            {scans.length ? (
              scans.map((s, i) => (
                <div className="activity-row" key={i}>
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>{s.name}</strong>
                    <small>
                      {s.checked_at
                        ? new Date(s.checked_at).toLocaleTimeString()
                        : ""}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-copy">
                Confirmed check-ins will appear here.
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
