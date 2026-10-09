"use client";
import { useState } from "react";
import { LoaderCircle, CalendarDays } from "lucide-react";
import Dialog from "./dialog";
import { EventRecord } from "@/lib/tivzo/types";
export default function EventForm({
  onClose,
  onSave,
  demo,
}: {
  onClose: () => void;
  onSave: (e: Partial<EventRecord>) => Promise<unknown>;
  demo: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accent, setAccent] = useState("orange");
  return (
    <Dialog title="Make something happen." onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          const name = String(f.get("name")).trim();
          try {
            await onSave({
              name,
              slug:
                name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "") +
                "-" +
                crypto.randomUUID().slice(0, 6),
              date: String(f.get("date")),
              time: String(f.get("time")),
              venue: String(f.get("venue")).trim(),
              category: String(f.get("category")),
              description: String(f.get("description")).trim(),
              capacity: Number(f.get("capacity")),
              status: "draft",
              accent,
            });
            onClose();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Could not save this event.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-body">
          <p className="form-intro">
            Start with the essentials. You can publish when everything is ready.
          </p>
          {demo && (
            <div className="notice">
              Demo event · Changes last until you refresh.
            </div>
          )}
          <label>
            Event name
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Give your next big thing a name"
              autoFocus
            />
          </label>
          <div className="form-grid">
            <label>
              Date
              <input
                name="date"
                type="date"
                required
                min={new Date().toLocaleDateString("en-CA")}
              />
            </label>
            <label>
              Time <span className="muted">(IST)</span>
              <input name="time" type="time" required defaultValue="17:00" />
            </label>
          </div>
          <label>
            Venue
            <input
              name="venue"
              required
              maxLength={150}
              placeholder="Where people come together"
            />
          </label>
          <div className="form-grid">
            <label>
              Category
              <select name="category">
                <option>Design & culture</option>
                <option>Music & community</option>
                <option>Technology</option>
                <option>Workshop</option>
                <option>Sports</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Capacity
              <input
                name="capacity"
                required
                type="number"
                min="1"
                max="10000"
                defaultValue="200"
              />
            </label>
          </div>
          <label>
            About your event
            <textarea
              name="description"
              required
              maxLength={2000}
              rows={3}
              placeholder="What should your guests look forward to?"
            />
          </label>
          <label>Event color</label>
          <div className="color-options">
            {["orange", "blue", "green"].map((c) => (
              <button
                aria-label={c}
                aria-pressed={accent === c}
                type="button"
                key={c}
                className={
                  "color-swatch " + c + (accent === c ? " active" : "")
                }
                onClick={() => setAccent(c)}
              />
            ))}
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <CalendarDays size={16} />
            )}
            Create draft
          </button>
        </div>
      </form>
    </Dialog>
  );
}
