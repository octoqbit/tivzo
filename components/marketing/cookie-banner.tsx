"use client";
import { useEffect, useRef, useState } from "react";
const storageKey = "tivzo-storage-notice-v1";
const maxAge = 180 * 24 * 60 * 60 * 1000;
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("tivzo:cookie-settings"))}
    >
      Cookie settings
    </button>
  );
}
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      const valid =
        saved?.version === 1 &&
        saved?.choice === "essential-only" &&
        Number.isFinite(saved?.time) &&
        Date.now() - saved.time >= 0 &&
        Date.now() - saved.time < maxAge;
      setVisible(!valid);
    } catch {
      setVisible(true);
    }
    const reopen = () => {
      returnFocus.current = document.activeElement as HTMLElement;
      setVisible(true);
      requestAnimationFrame(() => panel.current?.focus());
    };
    window.addEventListener("tivzo:cookie-settings", reopen);
    return () => window.removeEventListener("tivzo:cookie-settings", reopen);
  }, []);
  function acknowledge() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 1,
          choice: "essential-only",
          time: Date.now(),
        }),
      );
    } catch {}
    setVisible(false);
    returnFocus.current?.focus();
  }
  if (!visible) return null;
  return (
    <section
      className="cookie-banner"
      aria-labelledby="cookie-title"
      ref={panel}
      tabIndex={-1}
    >
      <div>
        <h2 id="cookie-title">Small files. Clear choices.</h2>
        <p>
          We use storage for sign-in, security and settings you choose. No
          optional analytics or advertising trackers are enabled in Tivzo.{" "}
          <a href="/cookies">Read our cookie policy</a>.
        </p>
      </div>
      <button type="button" className="pixel-button" onClick={acknowledge}>
        Essential only
      </button>
    </section>
  );
}
