"use client";
import { useEffect, useState, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { getClient, downloadFile, csvCell } from "./client";
import { demoEvents, demoGuests, EventRecord, Guest } from "./types";
export function useWorkspace() {
  const [events, setEvents] = useState<EventRecord[]>(demoEvents);
  const [guests, setGuests] = useState<Guest[]>(demoGuests);
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [demo, setDemo] = useState(true);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [org, setOrg] = useState({
    id: "",
    name: "Campus Collective",
    role: "organizer",
  });
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [updated, setUpdated] = useState<Date | null>(null);
  const refresh = useCallback(async (c: SupabaseClient) => {
    const { data, error: e } = await c.rpc("workspace_snapshot");
    if (e) {
      setError(e.message);
      return;
    }
    setEvents(data.events || []);
    setOrg(
      data.organization || { id: "", name: "My workspace", role: "scanner" },
    );
    setUpdated(new Date());
    setError("");
  }, []);
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    getClient()
      .then(async (c) => {
        if (!active) return;
        if (!c) {
          setReady(true);
          return;
        }
        setDemo(false);
        setEvents([]);
        setGuests([]);
        setClient(c);
        const { data } = await c.auth.getSession();
        if (!active) return;
        setSignedIn(!!data.session);
        setEmail(data.session?.user.email || "");
        if (data.session) await refresh(c);
        setReady(true);
        const { data: listener } = c.auth.onAuthStateChange(
          (_event, session) => {
            if (!active) return;
            setSignedIn(!!session);
            setEmail(session?.user.email || "");
            if (session) setTimeout(() => refresh(c), 0);
            else {
              setEvents([]);
              setGuests([]);
            }
          },
        );
        unsubscribe = () => listener.subscription.unsubscribe();
      })
      .catch(() => {
        setError("Could not check the connection. Refresh to try again.");
        setReady(true);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [refresh]);
  useEffect(() => {
    if (!client || !signedIn) return;
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => refresh(client), 400);
    };
    const channel = client
      .channel("workspace-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations" },
        update,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "check_ins" },
        update,
      )
      .subscribe();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh(client);
    }, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      client.removeChannel(channel);
    };
  }, [client, signedIn, refresh]);
  async function createEvent(input: Partial<EventRecord>) {
    if (demo) {
      const event = {
        ...input,
        id: crypto.randomUUID(),
        registered: 0,
        checked: 0,
      } as EventRecord;
      setEvents((old) => [event, ...old]);
      return event;
    }
    if (!client || !org.id) throw new Error("Create your workspace first.");
    const { data, error } = await client
      .from("events")
      .insert({ ...input, organization_id: org.id })
      .select()
      .single();
    if (error) throw error;
    await refresh(client);
    return { ...data, registered: 0, checked: 0 } as EventRecord;
  }
  async function updateEvent(id: string, changes: Partial<EventRecord>) {
    if (demo) {
      setEvents((old) =>
        old.map((e) => (e.id === id ? { ...e, ...changes } : e)),
      );
      return;
    }
    const { error } = await client!.from("events").update(changes).eq("id", id);
    if (error) throw error;
    await refresh(client!);
  }
  async function loadGuests(eventId: string, query = "", offset = 0) {
    if (demo)
      return guests
        .filter(
          (g) =>
            (eventId === "all" || g.event_id === eventId) &&
            `${g.name} ${g.email}`.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(offset, offset + 50);
    const { data, error } = await client!.rpc("list_guests", {
      p_event_id: eventId === "all" ? null : eventId,
      p_query: query,
      p_offset: offset,
    });
    if (error) throw error;
    return data as Guest[];
  }
  async function exportGuests(eventId: string) {
    let records: Guest[] = [];
    if (demo)
      records = guests.filter(
        (g) => eventId === "all" || g.event_id === eventId,
      );
    else {
      for (let offset = 0; ; offset += 50) {
        const page = await loadGuests(eventId, "", offset);
        records.push(...page);
        if (page.length < 50) break;
      }
    }
    const rows = [
      ["Name", "Email", "Event", "Registered at", "Checked in at"],
      ...records.map((g) => [
        g.name,
        g.email,
        events.find((e) => e.id === g.event_id)?.name || g.event_id,
        g.created_at,
        g.checked_at || "",
      ]),
    ];
    downloadFile(
      `tivzo-guests${demo ? "-sample" : ""}.csv`,
      rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
    return records.length;
  }
  async function checkIn(eventId: string, token: string, requestId: string) {
    if (demo)
      throw new Error(
        "Live check-in is unavailable in the demo. Connect Supabase first.",
      );
    const { data, error } = await client!
      .rpc("check_in_ticket", {
        p_event_id: eventId,
        p_token: token,
        p_request_id: requestId,
      })
      .abortSignal(AbortSignal.timeout(8000));
    if (error) throw error;
    refresh(client!);
    return data as {
      status: string;
      name?: string;
      checked_at?: string;
      replayed?: boolean;
    };
  }
  return {
    events,
    guests,
    client,
    demo,
    ready,
    signedIn,
    org,
    error,
    email,
    updated,
    refresh,
    createEvent,
    updateEvent,
    loadGuests,
    exportGuests,
    checkIn,
    setGuests,
    setEvents,
  };
}
export type Workspace = ReturnType<typeof useWorkspace>;
