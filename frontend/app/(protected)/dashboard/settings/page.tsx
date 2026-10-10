"use client";

import { useAuth } from "../../../lib/auth/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Settings</h1>
          <p className="subheading">Profile and workspace preferences.</p>
        </div>
      </div>
      <section className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <h2>Profile</h2>
            <p>Demo session details</p>
          </div>
        </div>
        <dl className="settings-list">
          <div>
            <dt>Name</dt>
            <dd>{user?.name ?? "—"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{user?.role ?? "—"}</dd>
          </div>
        </dl>
      </section>
      <section className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <h2>Appearance</h2>
            <p>Use the theme toggle in the header for light or dark mode.</p>
          </div>
        </div>
        <p className="subheading">
          Notification preferences and account security will connect to the backend
          in a future release.
        </p>
      </section>
    </>
  );
}
