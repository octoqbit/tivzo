"use client";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  CalendarDays,
  Users,
  ScanLine,
  Settings as SettingsIcon,
  Plus,
  ChevronDown,
  Sun,
  Moon,
  Search,
  MoreHorizontal,
  Archive,
  LifeBuoy,
  PanelLeftClose,
  Ticket,
  Menu,
  X,
  ExternalLink,
  Copy,
  Download,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { Brand } from "./brand";
import { useTheme } from "@/lib/tivzo/use-theme";
import { EventRecord, View } from "@/lib/tivzo/types";
import { useWorkspace } from "@/lib/tivzo/use-workspace";
import { EventCard } from "./event-card";
import EventForm from "./event-form";
import Dialog from "./dialog";
import Registration from "./registration";
import Scanner from "./scanner";
import Auth from "./auth";
import { Guests, Team, Settings, Archives } from "./sections";
const nav = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "guests", label: "Guest list", icon: Users },
  { id: "scanner", label: "Check-in", icon: ScanLine },
  { id: "team", label: "Team", icon: Users },
] as const;
export default function Tivzo() {
  const w = useWorkspace();
  const [view, setView] = useState<View>("overview");
  const [dark, setDark] = useTheme();
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [preview, setPreview] = useState<EventRecord | null>(null);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [scanEvent, setScanEvent] = useState("");
  const [mutating, setMutating] = useState(false);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const control = new AbortController();
    void context
      .registerTool(
        {
          name: "navigate_workspace",
          title: "Navigate Tivzo",
          description:
            "Open an existing Tivzo workspace section. Does not modify event or attendance records.",
          inputSchema: {
            type: "object",
            properties: {
              section: {
                type: "string",
                enum: [
                  "overview",
                  "events",
                  "guests",
                  "scanner",
                  "team",
                  "settings",
                  "archives",
                ],
              },
            },
            required: ["section"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: (input: unknown) => {
            const section = (input as { section?: View })?.section;
            if (
              !section ||
              ![
                "overview",
                "events",
                "guests",
                "scanner",
                "team",
                "settings",
                "archives",
              ].includes(section)
            )
              throw new Error("Unknown workspace section");
            setView(section);
            return { section };
          },
        },
        { signal: control.signal },
      )
      .catch(() => {});
    return () => control.abort();
  }, []);
  const total = w.events.reduce((n, e) => n + e.registered, 0);
  const published = w.events.filter((e) => e.status === "published");
  const checked = w.events.reduce((n, e) => n + e.checked, 0);
  const available = published.reduce(
    (n, e) => n + Math.max(0, e.capacity - e.registered),
    0,
  );
  const visible = w.events.filter(
    (e) =>
      (filter === "all" || e.status === filter) &&
      `${e.name} ${e.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  const title = {
    overview: "Your events. In focus.",
    events: "Make room for something great.",
    guests: "Everyone on the list.",
    scanner: "Every welcome starts here.",
    team: "Better, together.",
    archives: "Every event has a story.",
    settings: "Your space. Your way.",
  }[view];
  const subtitle = {
    overview: "A little less managing. A lot more making memories.",
    events: "From the first idea to the final guest. All your events, here.",
    guests: "Find your guests, see who’s arrived, and take your list with you.",
    scanner: "Open the camera once. Welcome guests without another tap.",
    team: "The people who make it all happen.",
    archives: "Your past events, preserved for what comes next.",
    settings: "Make Tivzo work the way you do.",
  }[view];
  function navigate(v: View) {
    setView(v);
    setMenu(false);
    setQuery("");
    setFilter("all");
  }
  if (w.ready && !w.demo && !w.signedIn) return <Auth workspace={w} />;
  if (preview)
    return <Registration event={preview} onBack={() => setPreview(null)} />;
  return (
    <div className="app-shell">
      {menu && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={"sidebar " + (menu ? "is-open" : "")}>
        <div className="brand-row">
          <a href="/" aria-label="Tivzo home">
            <Brand />
          </a>
          <button
            className="icon-button muted mobile-close"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <PanelLeftClose size={17} />
          </button>
        </div>
        <button className="workspace" onClick={() => navigate("settings")}>
          <span className="workspace-avatar">{w.org.name[0] || "T"}</span>
          <span>
            <strong>{w.org.name}</strong>
            <small>
              {w.org.role === "scanner"
                ? "Volunteer workspace"
                : "Organizer workspace"}
            </small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav
            .filter(
              (n) =>
                w.org.role !== "scanner" ||
                ["overview", "events", "scanner"].includes(n.id),
            )
            .map((n) => (
              <button
                key={n.id}
                className={"nav-item " + (view === n.id ? "selected" : "")}
                aria-current={view === n.id ? "page" : undefined}
                onClick={() => navigate(n.id)}
              >
                <n.icon size={18} />
                {n.label}
                {n.id === "events" && (
                  <span className="nav-count">{w.events.length}</span>
                )}
              </button>
            ))}
        </nav>
        <div className="nav-label lower">MANAGE</div>
        {w.org.role !== "scanner" && (
          <button
            className={"nav-item " + (view === "archives" ? "selected" : "")}
            onClick={() => navigate("archives")}
          >
            <Archive size={18} />
            Archives
          </button>
        )}
        <button
          className={"nav-item " + (view === "settings" ? "selected" : "")}
          onClick={() => navigate("settings")}
        >
          <SettingsIcon size={18} />
          Settings
        </button>
        <div className="sidebar-bottom">
          {w.demo && (
            <div className="demo-card">
              <span className="eyebrow">YOUR PLAYGROUND</span>
              <strong>Make yourself at home.</strong>
              <p>
                Explore with sample data.
                <br />
                Demo changes reset on refresh.
              </p>
              <button
                className="sample-label"
                onClick={() => navigate("settings")}
              >
                View launch setup
              </button>
            </div>
          )}
          <button className="nav-item" onClick={() => navigate("settings")}>
            <LifeBuoy size={18} />
            Help & setup
          </button>
          <div className="profile">
            <span className="avatar">
              {w.demo ? "AY" : w.email.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <strong>{w.demo ? "Ashutosh Yadav" : w.email}</strong>
              <small>{w.demo ? "Demo organizer" : w.org.role}</small>
            </span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>
              {nav.find((n) => n.id === view)?.label ||
                view.charAt(0).toUpperCase() + view.slice(1)}
            </strong>
          </div>
          <div className="top-actions">
            <span className="sample-label">
              {w.demo
                ? "Sample data"
                : w.error
                  ? "Update failed"
                  : "Live workspace"}
            </span>
            <button
              className="icon-button"
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="avatar small"
              aria-label="Account settings"
              onClick={() => navigate("settings")}
            >
              {w.demo ? "AY" : w.email.slice(0, 2).toUpperCase()}
            </button>
          </div>
        </header>
        <main className="content">
          {w.error && (
            <div className="notice error-message" role="alert">
              {w.error}
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {view === "overview"
                  ? "LET’S MAKE IT HAPPEN"
                  : "THE TIVZO WORKSPACE"}
              </div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {["overview", "events"].includes(view) &&
              w.org.role !== "scanner" && (
                <button
                  className="button primary"
                  onClick={() => setCreating(true)}
                >
                  <Plus size={18} />
                  Create event
                </button>
              )}
          </div>
          {!w.ready && <p className="notice">Checking workspace connection…</p>}
          {view === "overview" && (
            <div className="stat-grid">
              {[
                {
                  label: "Total registrations",
                  value: total.toLocaleString(),
                  detail: "Across your events",
                  icon: Ticket,
                },
                {
                  label: "Published events",
                  value: String(published.length).padStart(2, "0"),
                  detail: "Ready for their next chapter",
                  icon: CalendarDays,
                },
                {
                  label: "Available places",
                  value: available.toLocaleString(),
                  detail: "Across published events",
                  icon: Users,
                },
                {
                  label: "Checked in",
                  value: String(checked),
                  detail: w.demo
                    ? "Sample attendance"
                    : w.updated
                      ? "Updated " + w.updated.toLocaleTimeString()
                      : "Waiting for attendance",
                  icon: ScanLine,
                },
              ].map((s) => (
                <div className="stat" key={s.label}>
                  <div className="stat-label">
                    {s.label}
                    <s.icon size={17} />
                  </div>
                  <div className="stat-value">{s.value}</div>
                  <span className="stat-detail">{s.detail}</span>
                </div>
              ))}
            </div>
          )}
          {["overview", "events"].includes(view) && (
            <section className="events-section">
              <div className="section-heading">
                <div>
                  <h2>
                    {view === "overview" ? "On the calendar" : "Your events"}{" "}
                    <span className="count">{w.events.length}</span>
                  </h2>
                  <p>The experiences you’re bringing to life.</p>
                </div>
                <div className="search-field">
                  <Search size={16} />
                  <input
                    aria-label="Search events"
                    placeholder="Search events…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              {view === "events" && (
                <div className="filter-tabs">
                  {[
                    { id: "all", label: "All events" },
                    { id: "published", label: "Published" },
                    { id: "draft", label: "Drafts" },
                    { id: "closed", label: "Closed" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      className={filter === t.id ? "active" : ""}
                      aria-pressed={filter === t.id}
                      onClick={() => setFilter(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="event-grid">
                {visible.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onOpen={() => setSelected(e)}
                  />
                ))}
              </div>
              {!visible.length && (
                <div className="empty-state">
                  <CalendarDays size={35} />
                  <h2>
                    {query
                      ? "No matching events."
                      : "A blank calendar. Endless possibilities."}
                  </h2>
                  <p>
                    {query
                      ? "Try another event name."
                      : "Create your first event to get started."}
                  </p>
                  {!query && w.org.role !== "scanner" && (
                    <button
                      className="button primary"
                      onClick={() => setCreating(true)}
                    >
                      Create event
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
          {view === "overview" && (
            <div className="overview-bottom">
              <section className="panel">
                <div className="section-heading">
                  <h2>{w.demo ? "Recent registrations" : "At a glance"}</h2>
                  {w.org.role !== "scanner" && (
                    <button
                      className="text-button"
                      onClick={() => navigate("guests")}
                    >
                      View guest list
                    </button>
                  )}
                </div>
                {w.demo
                  ? ["Isha Kapoor", "Kabir Shah", "Meera Nair"].map((n, i) => (
                      <div className="activity-row" key={n}>
                        <span className={"avatar tint-" + i}>
                          {n
                            .split(" ")
                            .map((x) => x[0])
                            .join("")}
                        </span>
                        <div>
                          <strong>{n}</strong>
                          <small>
                            Registered for{" "}
                            {i === 1 ? "After Hours" : "FORM / 26"}
                          </small>
                        </div>
                        <span className="muted">Sample</span>
                      </div>
                    ))
                  : w.events.slice(0, 3).map((e) => (
                      <div className="activity-row" key={e.id}>
                        <CalendarDays size={20} />
                        <div>
                          <strong>{e.name}</strong>
                          <small>
                            {e.registered} registered · {e.checked} checked in
                          </small>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => setSelected(e)}
                        >
                          Manage
                        </button>
                      </div>
                    ))}
                {!w.demo && !w.events.length && (
                  <p className="empty-copy">
                    Your events and attendance will appear here.
                  </p>
                )}
              </section>
              <section className="entry-panel">
                <div className="entry-icon">
                  <ScanLine size={26} />
                </div>
                <span className="eyebrow">AT THE DOOR</span>
                <h2>
                  A warm welcome.
                  <br />
                  Without the wait.
                </h2>
                <p>
                  Open the scanner. Point at a ticket.
                  <br />
                  We’ll take it from there.
                </p>
                <button
                  className="button secondary"
                  onClick={() => navigate("scanner")}
                >
                  <ScanLine size={17} />
                  Open check-in
                </button>
                <span className="muted entry-foot">
                  Designed for 5 scanning phones
                </span>
              </section>
            </div>
          )}
          {view === "guests" && <Guests workspace={w} notify={setToast} />}{" "}
          {view === "scanner" && (
            <Scanner workspace={w} initialEvent={scanEvent} />
          )}{" "}
          {view === "team" && <Team workspace={w} notify={setToast} />}{" "}
          {view === "settings" && (
            <Settings
              workspace={w}
              dark={dark}
              setDark={setDark}
              notify={setToast}
            />
          )}{" "}
          {view === "archives" && <Archives workspace={w} notify={setToast} />}
          <footer className="page-footer">
            <span>Tivzo · Good things bring people together.</span>
            <span>
              {w.demo
                ? "Preview workspace · No live registrations"
                : "Made for your next big thing."}
            </span>
          </footer>
        </main>
      </div>
      {creating && (
        <EventForm
          demo={w.demo}
          onClose={() => setCreating(false)}
          onSave={async (e) => {
            const event = await w.createEvent(e);
            setSelected(event);
            setToast(
              w.demo
                ? "Demo event created. Changes reset on refresh."
                : "Your event draft is ready.",
            );
          }}
        />
      )}
      {selected && (
        <Dialog title={selected.name} onClose={() => setSelected(null)}>
          <div className="form-body">
            <div className="event-summary">
              <span
                className={
                  "badge " + (selected.status === "published" ? "live" : "")
                }
              >
                {selected.status}
              </span>
              <p>{selected.description}</p>
              <span>
                {selected.date} · {selected.time} IST · {selected.venue}
              </span>
            </div>
            <div className="detail-stats">
              <div>
                <strong>{selected.registered}</strong>
                <span>Registered</span>
              </div>
              <div>
                <strong>{selected.checked}</strong>
                <span>Checked in</span>
              </div>
              <div>
                <strong>{selected.capacity}</strong>
                <span>Capacity</span>
              </div>
            </div>
            <div className="detail-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setPreview(selected);
                  setSelected(null);
                }}
              >
                <ExternalLink size={16} />
                Preview registration
              </button>
              <button
                className="button secondary"
                disabled={selected.status !== "published"}
                onClick={async () => {
                  if (w.demo) {
                    setToast(
                      "Demo events are preview-only. Connect Supabase to share real registration links.",
                    );
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(
                      `${location.origin}/events/${selected.slug}`,
                    );
                    setToast("Registration link copied.");
                  } catch {
                    setToast(
                      "Could not copy. Open the event page and copy its address.",
                    );
                  }
                }}
              >
                <Copy size={16} />
                Copy event link
              </button>
              <button
                className="button secondary"
                disabled={selected.status !== "published"}
                onClick={() => {
                  setScanEvent(selected.id);
                  setSelected(null);
                  navigate("scanner");
                }}
              >
                <ScanLine size={16} />
                Open check-in
              </button>
              {w.org.role !== "scanner" && (
                <button
                  className="button secondary"
                  onClick={() =>
                    w
                      .exportGuests(selected.id)
                      .then((n) => setToast(`Exported ${n} guests.`))
                      .catch((e) => setToast(e.message))
                  }
                >
                  <Download size={16} />
                  Export guests
                </button>
              )}
            </div>
            {w.demo && (
              <p className="notice">
                Sample event. Changes stay in this preview until you refresh.
              </p>
            )}
          </div>
          {w.org.role !== "scanner" && (
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setSelected(null)}
              >
                Done
              </button>
              <button
                className="button primary"
                disabled={mutating || selected.status === "closed"}
                onClick={async () => {
                  setMutating(true);
                  try {
                    const status =
                      selected.status === "draft" ? "published" : "closed";
                    await w.updateEvent(selected.id, { status });
                    setSelected({ ...selected, status });
                    setToast(
                      status === "published"
                        ? "Event published."
                        : "Event closed to registration and scanning.",
                    );
                  } catch (e) {
                    setToast(e instanceof Error ? e.message : "Update failed.");
                  } finally {
                    setMutating(false);
                  }
                }}
              >
                {mutating
                  ? "Saving…"
                  : selected.status === "draft"
                    ? "Publish event"
                    : selected.status === "published"
                      ? "Close event"
                      : "Event closed"}
              </button>
            </div>
          )}
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
