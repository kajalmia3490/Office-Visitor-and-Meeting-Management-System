"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  SESSION_CHANGE_EVENT,
  SESSION_STORAGE_KEY,
  isClientAuthenticated,
} from "../../lib/auth/session";

function useMarketingSignedIn(initialSignedIn = false) {
  const [signedIn, setSignedIn] = useState(initialSignedIn);

  const sync = useCallback(() => {
    setSignedIn(isClientAuthenticated());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => sync(), 0);
    const onSessionChange = () => sync();
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY || event.key === null) {
        sync();
      }
    };
    window.addEventListener(SESSION_CHANGE_EVENT, onSessionChange);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onSessionChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(SESSION_CHANGE_EVENT, onSessionChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onSessionChange);
    };
  }, [sync]);

  return signedIn;
}

export function MarketingNavActions({
  initialSignedIn = false,
}: {
  initialSignedIn?: boolean;
}) {
  const signedIn = useMarketingSignedIn(initialSignedIn);

  return (
    <div className="marketing-actions">
      {signedIn ? (
        <Link className="button primary" href="/dashboard">Open dashboard</Link>
      ) : (
        <Link className="marketing-login" href="/login">Sign in</Link>
      )}
    </div>
  );
}

export function MarketingHeroActions({
  initialSignedIn = false,
}: {
  initialSignedIn?: boolean;
}) {
  const signedIn = useMarketingSignedIn(initialSignedIn);

  return (
    <div className="hero-actions">
      {signedIn ? (
        <Link className="button primary hero-button" href="/dashboard">
          Open dashboard <span>→</span>
        </Link>
      ) : (
        <Link className="button primary hero-button" href="/login">
          Sign in <span>→</span>
        </Link>
      )}
      <a className="watch-link" href="#features">
        <span className="play">▶</span> See how it works
      </a>
    </div>
  );
}

export function MarketingCtaAction({
  initialSignedIn = false,
}: {
  initialSignedIn?: boolean;
}) {
  const signedIn = useMarketingSignedIn(initialSignedIn);

  if (signedIn) {
    return (
      <Link className="button primary" href="/dashboard">
        Open dashboard →
      </Link>
    );
  }

  return (
    <Link className="button primary" href="/login">
      Sign in to get started →
    </Link>
  );
}
