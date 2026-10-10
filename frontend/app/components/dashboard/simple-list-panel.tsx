"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchListWithFallback } from "../../lib/fetch-with-fallback";
import { dateText, personName, text, type RecordValue } from "../../lib/record-utils";
import { PreviewNotice } from "./preview-notice";
import { StatusBadge } from "./status-badge";

type Column = {
  header: string;
  cell: (item: RecordValue) => string;
};

export function SimpleListPanel({
  title,
  description,
  apiPath,
  mockItems,
  columns,
  searchPlaceholder,
}: {
  title: string;
  description: string;
  apiPath: string;
  mockItems: RecordValue[];
  columns: Column[];
  searchPlaceholder?: string;
}) {
  const [items, setItems] = useState<RecordValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchListWithFallback(apiPath, mockItems);
    setItems(result.data);
    setUsingMock(result.source === "mock");
    setLoading(false);
  }, [apiPath, mockItems]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [items, query]);

  return (
    <>
      <PreviewNotice show={usingMock} />
      <section className="workflow-panel panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Workspace / {title}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button className="button secondary" type="button" onClick={() => void load()}>
            Refresh
          </button>
        </div>
        <div className="workflow-toolbar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}...`}
            aria-label={`Search ${title}`}
          />
        </div>
        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No records found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.header}>{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={String(item._id ?? index)}>
                    {columns.map((col) => (
                      <td key={col.header}>{col.cell(item)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export function appointmentColumns(): Column[] {
  return [
    {
      header: "Visitor",
      cell: (item) => personName(item.visitor, "Visitor"),
    },
    {
      header: "Host",
      cell: (item) => personName(item.hostEmployee, "—"),
    },
    {
      header: "Purpose",
      cell: (item) => text(item.purpose),
    },
    {
      header: "Time",
      cell: (item) => dateText(item.startAt),
    },
    {
      header: "Status",
      cell: (item) => text(item.status, "pending").replaceAll("_", " "),
    },
  ];
}

export function notificationColumns(): Column[] {
  return [
    { header: "Title", cell: (item) => text(item.title) },
    { header: "Message", cell: (item) => text(item.message) },
    { header: "When", cell: (item) => dateText(item.createdAt) },
    {
      header: "Status",
      cell: (item) => (item.read ? "Read" : "Unread"),
    },
  ];
}

export function userColumns(): Column[] {
  return [
    { header: "User", cell: (item) => text(item.name) },
    { header: "Email", cell: (item) => text(item.email) },
    { header: "Employee ID", cell: (item) => text(item.employeeId) },
    { header: "Department", cell: (item) => personName(item.department) },
    { header: "Role", cell: (item) => text(item.role) },
    {
      header: "Last login",
      cell: (item) => dateText(item.lastLoginAt),
    },
  ];
}

export function departmentColumns(): Column[] {
  return [
    { header: "Department", cell: (item) => text(item.name) },
    { header: "Code", cell: (item) => text(item.code) },
    { header: "Head", cell: (item) => personName(item.head) },
    {
      header: "Members",
      cell: (item) => String(item.memberCount ?? "—"),
    },
    { header: "Status", cell: (item) => text(item.status, "active") },
  ];
}

export function auditColumns(): Column[] {
  return [
    { header: "Date", cell: (item) => dateText(item.createdAt) },
    { header: "User", cell: (item) => personName(item.user) },
    { header: "Action", cell: (item) => text(item.action) },
    { header: "Module", cell: (item) => text(item.module) },
    { header: "Description", cell: (item) => text(item.description) },
    { header: "IP", cell: (item) => text(item.ip) },
  ];
}

export function NotificationStatusCell({ value }: { value: string }) {
  return <StatusBadge>{value}</StatusBadge>;
}
