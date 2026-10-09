"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Users,
  Archive,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  Plus,
  CheckCircle2,
  FileJson,
  LogOut,
} from "lucide-react";
import { Workspace } from "@/lib/tivzo/use-workspace";
import { Guest, EventRecord } from "@/lib/tivzo/types";
import { downloadFile } from "@/lib/tivzo/client";
export function Guests({
  workspace: w,
  notify,
}: {
  workspace: Workspace;
  notify: (s: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      w.loadGuests(filter, query, page * 50)
        .then((data) => {
          if (active) {
            setRows(data);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [filter, query, page, w.demo, w.updated]);
  return (
    <>
      <div className="list-toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            placeholder="Search name or email…"
            aria-label="Search guests"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          aria-label="Filter guests by event"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">All events</option>
          {w.events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <button
          className="button secondary"
          onClick={() =>
            w
              .exportGuests(filter)
              .then((n) =>
                notify(`Exported ${n} ${w.demo ? "sample " : ""}guests.`),
              )
              .catch((e) => notify(e.message))
          }
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Guest</th>
              <th>Event</th>
              <th>Registered</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g, i) => (
              <tr key={g.id}>
                <td>
                  <div className="guest-name">
                    <span className={"avatar tint-" + (i % 3)}>
                      {g.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span>
                      <strong>{g.name}</strong>
                      <small>{g.email}</small>
                    </span>
                  </div>
                </td>
                <td>
                  {w.events.find((e) => e.id === g.event_id)?.name || "Event"}
                </td>
                <td>
                  {new Date(g.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td>
                  <span className={"badge " + (g.checked_at ? "live" : "")}>
                    {g.checked_at ? "Checked in" : "Not arrived"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="table-status">Loading guests…</p>}
        {!loading && !rows.length && (
          <div className="empty-state">
            <Users size={32} />
            <h2>No guests found.</h2>
            <p>
              Try a different search, or share your event registration page.
            </p>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
        <div className="table-footer">
          <span>
            {w.demo
              ? "Sample guest list"
              : `${rows.length} guests on this page`}
          </span>
          <div>
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>{page + 1}</span>
            <button
              disabled={rows.length < 50}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
export function Team({
  workspace: w,
  notify,
}: {
  workspace: Workspace;
  notify: (s: string) => void;
}) {
  const [eventId, setEventId] = useState(w.events[0]?.id || "");
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<{ id: string; email: string }[]>([]);
  const [busy, setBusy] = useState(false);
  async function load() {
    if (w.demo) {
      setRows([
        { id: "sample1", email: "volunteer.one@example.com" },
        { id: "sample2", email: "volunteer.two@example.com" },
      ]);
      return;
    }
    if (!eventId) return;
    const { data, error } = await w.client!.rpc("list_event_staff", {
      p_event_id: eventId,
    });
    if (error) notify(error.message);
    else setRows(data || []);
  }
  useEffect(() => {
    void load();
  }, [eventId]);
  return (
    <div className="narrow-content">
      <div className="panel">
        <div className="section-heading">
          <div>
            <h2>Good events take good people.</h2>
            <p>Give volunteers access to check-in for their assigned event.</p>
          </div>
          <span className="badge">Scanner access</span>
        </div>
        <label>
          Event
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {w.events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <form
          className="inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (w.demo) {
              notify("Connect Supabase to assign a real volunteer.");
              return;
            }
            setBusy(true);
            const { error } = await w.client!.rpc("add_event_staff", {
              p_event_id: eventId,
              p_email: email,
            });
            setBusy(false);
            if (error) notify(error.message);
            else {
              setEmail("");
              await load();
              notify("Volunteer assigned.");
            }
          }}
        >
          <input
            aria-label="Volunteer account email"
            type="email"
            required
            placeholder="volunteer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="button primary" disabled={busy || !eventId}>
            <Plus size={16} />
            Assign volunteer
          </button>
        </form>
        <p className="field-hint">
          Volunteers need an existing Tivzo account. Assigning access does not
          send an email.
        </p>
        {rows.map((r, i) => (
          <div className="activity-row" key={r.id}>
            <span className="avatar">V{i + 1}</span>
            <div>
              <strong>{r.email}</strong>
              <small>Assigned volunteer{w.demo ? " · Sample" : ""}</small>
            </div>
            <ShieldCheck size={18} />
          </div>
        ))}
        {!rows.length && (
          <p className="empty-copy">
            No volunteers assigned to this event yet.
          </p>
        )}
      </div>
      <div className="note-card">
        <ShieldCheck size={23} />
        <div>
          <h3>Shared attendance. Individual access.</h3>
          <p>
            Use two phones day to day, and up to five when needed. Each
            volunteer signs in separately. Every successful scan belongs to the
            same event.
          </p>
        </div>
      </div>
    </div>
  );
}
export function Settings({
  workspace: w,
  dark,
  setDark,
  notify,
}: {
  workspace: Workspace;
  dark: boolean;
  setDark: (v: boolean) => void;
  notify: (s: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="settings-grid">
      <section className="panel">
        <h2>Your workspace</h2>
        <p className="section-copy">
          A home for your club and its next great event.
        </p>
        <label>
          Workspace name
          <input value={w.org.name} readOnly />
        </label>
        <label>
          Account
          <input readOnly value={w.demo ? "Sample organizer" : w.email} />
        </label>
        {!w.demo && !w.org.id && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const { error } = await w.client!.rpc("create_workspace", {
                p_name: name,
              });
              if (error) notify(error.message);
              else {
                await w.refresh(w.client!);
                notify("Workspace created.");
              }
            }}
          >
            <label>
              New workspace name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </label>
            <button className="button primary">Create workspace</button>
          </form>
        )}
        {!w.demo && (
          <button
            className="button secondary"
            onClick={() => w.client!.auth.signOut()}
          >
            <LogOut size={16} />
            Sign out
          </button>
        )}
      </section>
      <section className="panel">
        <h2>Make it yours</h2>
        <p className="section-copy">The same clear view, day or night.</p>
        <div className="theme-choices">
          <button
            className={!dark ? "active" : ""}
            aria-pressed={!dark}
            onClick={() => setDark(false)}
          >
            <Sun size={25} />
            <strong>Light</strong>
            <span>Clean and bright</span>
          </button>
          <button
            className={dark ? "active" : ""}
            aria-pressed={dark}
            onClick={() => setDark(true)}
          >
            <Moon size={25} />
            <strong>Dark</strong>
            <span>Easy on the eyes</span>
          </button>
        </div>
        <p className="field-hint">Your theme is remembered on this device.</p>
      </section>
      <section className="panel setup-panel">
        <div>
          <span className="eyebrow">LAUNCH READINESS</span>
          <h2>
            {w.demo
              ? "Your design is ready to explore."
              : "Your workspace is connected."}
          </h2>
          <p>
            {w.demo
              ? "You’re in a preview with sample data. Real registrations and shared attendance need the live connection."
              : "Review the launch checklist before your first event."}
          </p>
        </div>
        <div className="setup-steps">
          <div>
            <CheckCircle2 />
            <span>Event workspace & ticket previews</span>
            <span className="badge live">Ready</span>
          </div>
          <div>
            <span className="step-circle">2</span>
            <span>Supabase accounts & database</span>
            <span className="badge">
              {w.demo ? "Not connected" : "Connected"}
            </span>
          </div>
          <div>
            <span className="step-circle">3</span>
            <span>Registration protection & venue testing</span>
            <span className="badge">Before launch</span>
          </div>
          <div>
            <span className="step-circle">4</span>
            <span>Google Drive archive connection</span>
            <span className="badge">Not connected</span>
          </div>
        </div>
        <p className="field-hint">
          Setup instructions and database migrations are included in the
          project’s docs and supabase folders.
        </p>
      </section>
    </div>
  );
}
export function Archives({
  workspace: w,
  notify,
}: {
  workspace: Workspace;
  notify: (s: string) => void;
}) {
  const [busy, setBusy] = useState("");
  async function archive(e: EventRecord) {
    setBusy(e.id);
    try {
      const rows: Guest[] = [];
      for (let offset = 0; ; offset += 50) {
        const page = await w.loadGuests(e.id, "", offset);
        rows.push(...page);
        if (page.length < 50) break;
      }
      downloadFile(
        `tivzo-${e.slug}-report.json`,
        JSON.stringify(
          {
            format: "tivzo-event-report-v1",
            exported_at: new Date().toISOString(),
            sample: w.demo,
            event: e,
            guests: rows,
            note: "Reporting export only. Not a full restorable database archive; do not delete data based on this file.",
          },
          null,
          2,
        ),
        "application/json",
      );
      notify("Event report downloaded. Original data remains safe.");
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Export failed. Nothing was deleted.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div className="note-card">
        <Archive size={26} />
        <div>
          <h3>Keep the memories. Make room for more.</h3>
          <p>
            Completed events will be archived to your Google Drive before their
            detailed data is removed. Drive archiving and restore verification
            still need setup; deletion stays unavailable until then.
          </p>
        </div>
      </div>
      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Status</th>
              <th>Reports</th>
            </tr>
          </thead>
          <tbody>
            {w.events.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{e.name}</strong>
                  <small>{e.date}</small>
                </td>
                <td>
                  <span className="badge">
                    {e.status === "closed"
                      ? "Completed"
                      : e.status === "draft"
                        ? "Draft"
                        : "Upcoming"}
                  </span>
                </td>
                <td>
                  <button
                    className="button secondary"
                    disabled={busy === e.id || w.org.role === "scanner"}
                    onClick={() => archive(e)}
                  >
                    <FileJson size={16} />
                    {busy === e.id ? "Exporting…" : "Download report"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="field-hint">
        Reports are useful for analysis. They are not verified, restorable
        database backups.
      </p>
    </>
  );
}
