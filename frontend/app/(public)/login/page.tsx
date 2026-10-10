"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "../../lib/auth/auth-context";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../../lib/auth/demo-config";
import { readSession } from "../../lib/auth/session";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, status } = useAuth();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated" || readSession()) {
      const next = searchParams.get("next") || "/dashboard";
      router.replace(next);
    }
  }, [status, router, searchParams]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = login(email, password);
    if (message) {
      setError(message);
      return;
    }
    const next = searchParams.get("next") || "/dashboard";
    router.replace(next);
  }

  return (
    <main className="login-page">
      <div className="login-card panel">
        <div className="brand login-brand">
          <span className="brand-mark">O</span>
          <span>
            Office<span className="brand-accent">Flow</span>
          </span>
        </div>
        <h1>Sign in</h1>
        <p className="subheading">Use the demo credentials below to explore the workspace.</p>
        <div className="demo-credentials">
          <p className="eyebrow">Demo access</p>
          <p>
            <strong>Email:</strong> {DEMO_EMAIL}
          </p>
          <p>
            <strong>Password:</strong> {DEMO_PASSWORD}
          </p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="button primary login-submit" type="submit">
            Sign in
          </button>
        </form>
        <p className="login-footer">
          <Link href="/marketing">Back to marketing site</Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="loading-state auth-loading">
            <span className="spinner" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthProvider>
  );
}
