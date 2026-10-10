"use client";

import { useCallback, useEffect, useState } from "react";
import { PreviewNotice } from "../../../components/dashboard/preview-notice";
import { fetchWithFallback } from "../../../lib/fetch-with-fallback";
import { mockReportCards, mockReportRows } from "../../../lib/mock-data/reports";

export default function ReportsPage() {
  const [usingMock, setUsingMock] = useState(false);
  const [summary, setSummary] = useState(mockReportRows);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchWithFallback("/reports/visitors", mockReportRows);
    setSummary(Array.isArray(result.data) ? result.data : mockReportRows);
    setUsingMock(result.source === "mock");
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Insights</p>
          <h1>Reports</h1>
          <p className="subheading">Operational summaries and export-ready views.</p>
        </div>
        <button className="button secondary" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      <PreviewNotice show={usingMock} />
      <section className="report-card-grid">
        {mockReportCards.map((card) => (
          <article className="panel report-card" key={card.id}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <button className="text-button" type="button">Open report →</button>
          </article>
        ))}
      </section>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>Visitor summary</h2>
            <p>Snapshot for the selected reporting period</p>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading report...
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Period</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.value}</td>
                    <td>{row.period}</td>
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
