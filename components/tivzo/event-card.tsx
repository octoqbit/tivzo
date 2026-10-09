"use client";
import { CalendarDays, MapPin } from "lucide-react";
import { demoEvents, EventRecord } from "@/lib/tivzo/types";
export function EventCard({
  event: e,
  onOpen,
}: {
  event: EventRecord;
  onOpen: () => void;
}) {
  return (
    <article className="event-card">
      <button
        className={"event-art " + e.accent}
        onClick={onOpen}
        aria-label={"Open " + e.name}
      >
        <span className="art-top">
          <span>TIVZO PRESENTS</span>
          <span>{e.date.slice(0, 4)}</span>
        </span>
        <span className="art-title">
          {e.name === "FORM / 26" ? (
            <>
              FORM<span className="art-sub">/ 26</span>
            </>
          ) : e.name === "After Hours" ? (
            <>
              after
              <br />
              <i>hours.</i>
            </>
          ) : e.name === "Build Something." ? (
            <>
              build
              <br />
              something<span className="art-period">.</span>
            </>
          ) : (
            <span className="custom-art-title">{e.name}</span>
          )}
        </span>
        <span className="art-bottom">
          <span>{e.category.toUpperCase()}</span>
          <span>BE PART OF IT.</span>
        </span>
      </button>
      <div className="event-info">
        <div className="event-title-row">
          <h3>
            <button onClick={onOpen}>{e.name}</button>
          </h3>
          <span className={"badge " + (e.status === "published" ? "live" : "")}>
            {e.status === "published"
              ? "Published"
              : e.status === "closed"
                ? "Closed"
                : "Draft"}
          </span>
        </div>
        <div className="event-meta">
          <CalendarDays size={14} />
          {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          <span>·</span>
          {e.time}
        </div>
        <div className="event-meta">
          <MapPin size={14} />
          {e.venue}
        </div>
        <div className="capacity-line">
          <span>
            <strong>{e.registered}</strong> registered
          </span>
          <span>{e.capacity} capacity</span>
        </div>
        <div className="progress">
          <div style={{ width: `${(e.registered / e.capacity) * 100}%` }} />
        </div>
      </div>
    </article>
  );
}
