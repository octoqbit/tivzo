"use client";
import { useState } from "react";
import { Brand } from "./brand";
import { Workspace } from "@/lib/tivzo/use-workspace";
export default function Auth({ workspace: w }: { workspace: Workspace }) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div className="auth-wrap">
      <a href="/" aria-label="Tivzo home">
        <Brand />
      </a>
      <div className="auth-card">
        <div className="eyebrow">WELCOME TO TIVZO</div>
        <h1>{signup ? "A place for your events." : "Good to see you."}</h1>
        <p>
          {signup
            ? "Create your staff account. Guests don’t need one."
            : "Sign in to manage events or start scanning."}
        </p>
        <p className="field-hint">
          Read our <a href="/privacy">Privacy Policy</a> and{" "}
          <a href="/terms">Terms of Service</a>.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            const f = new FormData(e.currentTarget);
            const input = {
              email: String(f.get("email")),
              password: String(f.get("password")),
            };
            const result = signup
              ? await w.client!.auth.signUp(input)
              : await w.client!.auth.signInWithPassword(input);
            setBusy(false);
            if (result.error) setMessage(result.error.message);
            else if (signup && !result.data.session)
              setMessage(
                "Check your email to confirm your account, then sign in.",
              );
          }}
        >
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </label>
          {message && (
            <div className="notice" role="status">
              {message}
            </div>
          )}
          <button className="button primary full" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
          </button>
        </form>
        <button
          className="text-button"
          onClick={() => {
            setSignup(!signup);
            setMessage("");
          }}
        >
          {signup
            ? "Already have an account? Sign in"
            : "New to Tivzo? Create an account"}
        </button>
      </div>
    </div>
  );
}
