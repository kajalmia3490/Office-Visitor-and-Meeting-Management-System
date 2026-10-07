"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api-client";

type Section = "Visitors" | "Meetings" | "Meeting rooms" | "Active visitors";
type RecordValue = Record<string, unknown>;

const demoItems: Record<Section, RecordValue[]> = {
  Visitors: [
    { _id: "demo-visitor-1", fullName: "Olivia Martin", organization: "Acme Corporation", email: "olivia@example.com", phone: "+1 555 0101", status: "expected" },
    { _id: "demo-visitor-2", fullName: "Ethan Miller", organization: "Vertex Labs", email: "ethan@example.com", phone: "+1 555 0102", status: "checked_in" },
  ],
  Meetings: [
    { _id: "demo-meeting-1", title: "Q4 Product Planning", startAt: "2026-10-08T10:30:00.000Z", endAt: "2026-10-08T11:30:00.000Z", room: { name: "Atlas · 3rd floor" }, status: "scheduled" },
    { _id: "demo-meeting-2", title: "Design review", startAt: "2026-10-08T13:00:00.000Z", endAt: "2026-10-08T14:00:00.000Z", room: { name: "Focus room 2" }, status: "scheduled" },
  ],
  "Meeting rooms": [
    { _id: "demo-room-1", name: "Atlas", roomNumber: "301", location: "3rd floor", capacity: 10, status: "available" },
    { _id: "demo-room-2", name: "Focus room 2", roomNumber: "F2", location: "2nd floor", capacity: 6, status: "available" },
  ],
  "Active visitors": [
    { _id: "demo-visit-1", visitor: { fullName: "Sophia Davis", organization: "Northstar Inc." }, status: "checked_in", checkInAt: "2026-10-08T08:45:00.000Z" },
  ],
};

function asRecord(value: unknown): RecordValue {
  return typeof value === "object" && value !== null ? value as RecordValue : {};
}

function listPayload(value: unknown): RecordValue[] {
  if (Array.isArray(value)) return value as RecordValue[];
  const record = (value ?? {}) as RecordValue;
  return (record.items ?? record.results ?? record.data ?? []) as RecordValue[];
}

function text(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function dateText(value: unknown) {
  if (!value) return "Time not set";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "Time not set" : date.toLocaleString();
}

export default function WorkflowPanel({ section }: { section: Section }) {
  const [items, setItems] = useState<RecordValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecordValue | null>(null);

  const endpoint = section === "Visitors" ? "/visitors" : section === "Meetings" ? "/meetings" : "/meeting-rooms";

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const path = section === "Active visitors" ? "/visits/active" : `${endpoint}?limit=100`;
      setItems(listPayload(await apiRequest(path)));
    } catch {
      setMessage("Demo data is shown because the live API is not connected yet.");
      setItems(demoItems[section]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, section]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filteredItems = useMemo(() => {
    const normalized = query.toLowerCase();
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(normalized));
  }, [items, query]);

  async function remove(item: RecordValue) {
    if (!item._id || !window.confirm("Delete this record?")) return;
    try {
      await apiRequest(`${endpoint}/${item._id}`, { method: "DELETE" });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  async function checkOut(item: RecordValue) {
    if (!item._id) return;
    try {
      await apiRequest(`/visits/${item._id}/check-out`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Check-out failed.");
    }
  }

  return (
    <section className="workflow-panel panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Workspace / {section}</p>
          <h2>{section}</h2>
          <p>Live records and actions for the office workflow.</p>
        </div>
        {section !== "Active visitors" && (
          <button className="button primary" onClick={() => { setEditing(null); setShowForm(true); }}>＋ Add {section === "Visitors" ? "visitor" : section === "Meetings" ? "meeting" : "room"}</button>
        )}
      </div>
      {message && <div className="preview-notice">{message}</div>}
      <div className="workflow-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${section.toLowerCase()}...`} aria-label={`Search ${section}`} />
        <button className="button secondary" onClick={() => void load()}>Refresh</button>
      </div>
      {loading ? <div className="loading-state"><span className="spinner" />Loading records...</div> : filteredItems.length === 0 ? <div className="empty-state">No records found.</div> : (
        <div className="table-wrap"><table><thead><tr><th>Name / title</th><th>Details</th><th>Status / time</th><th /></tr></thead><tbody>
          {filteredItems.map((item) => {
            const visitor = asRecord(item.visitor);
            const room = asRecord(item.room);
            const host = asRecord(item.hostEmployee);
            const label = text(item.fullName ?? item.name ?? item.title ?? visitor.fullName, "Untitled");
            const details = section === "Visitors" ? text(item.organization ?? item.company, "Independent") : section === "Meeting rooms" ? `${text(item.roomNumber)} · ${text(item.location)}` : text(room.name ?? host.fullName, "Room not assigned");
            const status = text(item.status ?? item.visitStatus, "Scheduled").replaceAll("_", " ");
            return <tr key={String(item._id ?? label)}><td><div className="visitor-cell"><span className="visitor-avatar">{label.slice(0, 2).toUpperCase()}</span><span><b>{label}</b><small>{details}</small></span></div></td><td>{section === "Meetings" ? `${dateText(item.startAt)} · ${text(room.name)}` : details}</td><td><span className="badge badge-expected"><i />{status}</span></td><td><div className="workflow-actions">
              {section === "Active visitors" && <button className="text-button" onClick={() => void checkOut(item)}>Check out</button>}
              {section !== "Active visitors" && <button className="text-button" onClick={() => { setEditing(item); setShowForm(true); }}>Edit</button>}
              {section !== "Active visitors" && <button className="text-button danger" onClick={() => void remove(item)}>Delete</button>}
            </div></td></tr>;
          })}
        </tbody></table></div>
      )}
      {showForm && <WorkflowForm section={section} item={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load(); }} onError={setMessage} />}
    </section>
  );
}

function WorkflowForm({ section, item, onClose, onSaved, onError }: { section: Section; item: RecordValue | null; onClose: () => void; onSaved: () => void; onError: (message: string) => void }) {
  const [name, setName] = useState(String(item?.fullName ?? item?.title ?? item?.name ?? ""));
  const [email, setEmail] = useState(String(item?.email ?? ""));
  const [phone, setPhone] = useState(String(item?.phone ?? ""));
  const [organization, setOrganization] = useState(String(item?.organization ?? ""));
  const [room, setRoom] = useState(String(item?.room ?? item?.roomNumber ?? ""));
  const [startAt, setStartAt] = useState(String(item?.startAt ?? "").slice(0, 16));
  const [endAt, setEndAt] = useState(String(item?.endAt ?? "").slice(0, 16));
  const [capacity, setCapacity] = useState(String(item?.capacity ?? 8));
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = section === "Visitors" ? { fullName: name, email, phone, organization } : section === "Meetings" ? { title: name, room, startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString() } : { name, roomNumber: room, capacity: Number(capacity) };
      const path = section === "Visitors" ? "/visitors" : section === "Meetings" ? "/meetings" : "/meeting-rooms";
      await apiRequest(item?._id ? `${path}/${item._id}` : path, { method: item?._id ? "PATCH" : "POST", body: JSON.stringify(body) });
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-backdrop"><form className="workflow-modal panel" onSubmit={submit}><div className="panel-heading"><div><p className="eyebrow">{item ? "Edit" : "Create"}</p><h2>{section}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
    <label>Name / title<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
    {section === "Visitors" && <><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Phone<input required value={phone} onChange={(event) => setPhone(event.target.value)} /></label><label>Organization<input value={organization} onChange={(event) => setOrganization(event.target.value)} /></label></>}
    {section === "Meetings" && <><label>Room ID<input required value={room} onChange={(event) => setRoom(event.target.value)} /></label><label>Start<input required type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} /></label><label>End<input required type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} /></label></>}
    {section === "Meeting rooms" && <><label>Room number<input required value={room} onChange={(event) => setRoom(event.target.value)} /></label><label>Capacity<input required type="number" min="1" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label></>}
    <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button></div>
  </form></div>;
}
