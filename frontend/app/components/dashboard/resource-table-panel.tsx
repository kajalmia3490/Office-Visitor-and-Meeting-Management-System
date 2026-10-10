"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api-client";
import { fetchListWithFallback } from "../../lib/fetch-with-fallback";
import { mockMeetingRooms } from "../../lib/mock-data/rooms";
import { mockMeetings } from "../../lib/mock-data/meetings";
import { mockActiveVisits } from "../../lib/mock-data/visits";
import { mockVisitors } from "../../lib/mock-data/visitors";
import { asRecord, dateText, text, type RecordValue } from "../../lib/record-utils";
import { PreviewNotice } from "./preview-notice";
import { StatusBadge } from "./status-badge";

export type ResourceSection =
  | "Visitors"
  | "Meetings"
  | "Meeting rooms"
  | "Active visitors";

const mockBySection: Record<ResourceSection, RecordValue[]> = {
  Visitors: mockVisitors,
  Meetings: mockMeetings,
  "Meeting rooms": mockMeetingRooms,
  "Active visitors": mockActiveVisits,
};

function listPath(section: ResourceSection) {
  if (section === "Active visitors") return "/visits/active";
  if (section === "Visitors") return "/visitors?limit=100";
  if (section === "Meetings") return "/meetings?limit=100";
  return "/meeting-rooms?limit=100";
}

function apiBase(section: ResourceSection) {
  if (section === "Visitors") return "/visitors";
  if (section === "Meetings") return "/meetings";
  if (section === "Meeting rooms") return "/meeting-rooms";
  return "/visits";
}

export default function ResourceTablePanel({ section }: { section: ResourceSection }) {
  const [items, setItems] = useState<RecordValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecordValue | null>(null);

  const endpoint = apiBase(section);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const result = await fetchListWithFallback(
      listPath(section),
      mockBySection[section],
    );
    setItems(result.data);
    setUsingMock(result.source === "mock");
    setLoading(false);
  }, [section]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filteredItems = useMemo(() => {
    const normalized = query.toLowerCase();
    return items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(normalized),
    );
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
      await apiRequest(`/visits/${item._id}/check-out`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Check-out failed.");
    }
  }

  return (
    <>
      <PreviewNotice show={usingMock} />
      <section className="workflow-panel panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Workspace / {section}</p>
            <h2>{section}</h2>
            <p>Live records and actions for the office workflow.</p>
          </div>
          {section !== "Active visitors" && (
            <button
              className="button primary"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              ＋ Add{" "}
              {section === "Visitors"
                ? "visitor"
                : section === "Meetings"
                  ? "meeting"
                  : "room"}
            </button>
          )}
        </div>
        {message && <div className="preview-notice">{message}</div>}
        <div className="workflow-toolbar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${section.toLowerCase()}...`}
            aria-label={`Search ${section}`}
          />
          <button className="button secondary" type="button" onClick={() => void load()}>
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading records...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">No records found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name / title</th>
                  <th>Details</th>
                  <th>Status / time</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const visitor = asRecord(item.visitor);
                  const room = asRecord(item.room);
                  const host = asRecord(item.hostEmployee);
                  const label = text(
                    item.fullName ?? item.name ?? item.title ?? visitor.fullName,
                    "Untitled",
                  );
                  const details =
                    section === "Visitors"
                      ? text(item.organization ?? item.company, "Independent")
                      : section === "Meeting rooms"
                        ? `${text(item.roomNumber)} · ${text(item.location)}`
                        : text(room.name ?? host.fullName, "Room not assigned");
                  const status = text(item.status ?? item.visitStatus, "Scheduled").replaceAll(
                    "_",
                    " ",
                  );
                  return (
                    <tr key={String(item._id ?? label)}>
                      <td>
                        <div className="visitor-cell">
                          <span className="visitor-avatar">
                            {label.slice(0, 2).toUpperCase()}
                          </span>
                          <span>
                            <b>{label}</b>
                            <small>{details}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        {section === "Meetings"
                          ? `${dateText(item.startAt)} · ${text(room.name)}`
                          : details}
                      </td>
                      <td>
                        <StatusBadge>{status}</StatusBadge>
                      </td>
                      <td>
                        <div className="workflow-actions">
                          {section === "Active visitors" && (
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => void checkOut(item)}
                            >
                              Check out
                            </button>
                          )}
                          {section !== "Active visitors" && (
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => {
                                setEditing(item);
                                setShowForm(true);
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {section !== "Active visitors" && (
                            <button
                              className="text-button danger"
                              type="button"
                              onClick={() => void remove(item)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {showForm && (
          <WorkflowForm
            section={section}
            item={editing}
            onClose={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false);
              void load();
            }}
            onError={setMessage}
          />
        )}
      </section>
    </>
  );
}

function WorkflowForm({
  section,
  item,
  onClose,
  onSaved,
  onError,
}: {
  section: ResourceSection;
  item: RecordValue | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(String(item?.fullName ?? item?.title ?? item?.name ?? ""));
  const [email, setEmail] = useState(String(item?.email ?? ""));
  const [phone, setPhone] = useState(String(item?.phone ?? ""));
  const [organization, setOrganization] = useState(String(item?.organization ?? ""));
  const [room, setRoom] = useState(String(item?.room ?? item?.roomNumber ?? ""));
  const [startAt, setStartAt] = useState(String(item?.startAt ?? "").slice(0, 16));
  const [endAt, setEndAt] = useState(String(item?.endAt ?? "").slice(0, 16));
  const [capacity, setCapacity] = useState(String(item?.capacity ?? 8));
  const [saving, setSaving] = useState(false);

  const path =
    section === "Visitors"
      ? "/visitors"
      : section === "Meetings"
        ? "/meetings"
        : "/meeting-rooms";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const body =
        section === "Visitors"
          ? { fullName: name, email, phone, organization }
          : section === "Meetings"
            ? {
                title: name,
                room,
                startAt: new Date(startAt).toISOString(),
                endAt: new Date(endAt).toISOString(),
              }
            : { name, roomNumber: room, capacity: Number(capacity) };
      await apiRequest(item?._id ? `${path}/${item._id}` : path, {
        method: item?._id ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="workflow-modal panel" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{item ? "Edit" : "Create"}</p>
            <h2>{section}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <label>
          Name / title
          <input required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        {section === "Visitors" && (
          <>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Phone
              <input required value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <label>
              Organization
              <input
                value={organization}
                onChange={(event) => setOrganization(event.target.value)}
              />
            </label>
          </>
        )}
        {section === "Meetings" && (
          <>
            <label>
              Room ID
              <input required value={room} onChange={(event) => setRoom(event.target.value)} />
            </label>
            <label>
              Start
              <input
                required
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
              />
            </label>
            <label>
              End
              <input
                required
                type="datetime-local"
                value={endAt}
                onChange={(event) => setEndAt(event.target.value)}
              />
            </label>
          </>
        )}
        {section === "Meeting rooms" && (
          <>
            <label>
              Room number
              <input required value={room} onChange={(event) => setRoom(event.target.value)} />
            </label>
            <label>
              Capacity
              <input
                required
                type="number"
                min="1"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
              />
            </label>
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
