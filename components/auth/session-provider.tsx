"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "next-auth";
import {
  getCsrfToken,
  SessionContext,
  __NEXTAUTH,
  type SessionContextValue,
} from "next-auth/react";

let sessionRequest: Promise<Session | null> | null = null;

function readSession(data: Session | null): Session | null {
  if (!data?.user) return null;
  return data;
}

function fetchSession(): Promise<Session | null> {
  if (!sessionRequest) {
    sessionRequest = fetch("/api/auth/session", {
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        const data = (await response.json()) as Session | null;
        if (!response.ok) return null;
        return readSession(data);
      })
      .catch(() => null)
      .finally(() => {
        sessionRequest = null;
      });
  }
  return sessionRequest;
}

function rememberSession(session: Session | null) {
  __NEXTAUTH._session = session;
  __NEXTAUTH._lastSync = Math.floor(Date.now() / 1000);
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const applySession = useCallback((next: Session | null) => {
    rememberSession(next);
    setSession(next);
    return next;
  }, []);

  useEffect(() => {
    let active = true;
    __NEXTAUTH._getSession = async () => {
      const next = await fetchSession();
      if (!active) return next;
      return applySession(next);
    };
    void __NEXTAUTH._getSession();
    return () => {
      active = false;
    };
  }, [applySession]);

  const update = useCallback(
    async (data?: unknown) => {
      if (data !== undefined) {
        const csrfToken = await getCsrfToken();
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csrfToken, data }),
        });
        const json = (await response.json()) as Session | null;
        return applySession(response.ok ? readSession(json) : null);
      }

      const next = await fetch("/api/auth/session", {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })
        .then(async (response) => {
          const json = (await response.json()) as Session | null;
          if (!response.ok) return null;
          return readSession(json);
        })
        .catch(() => null);
      return applySession(next);
    },
    [applySession],
  );

  const value: SessionContextValue = useMemo(() => {
    if (session) return { data: session, status: "authenticated", update };
    return {
      data: null,
      status: session === undefined ? "loading" : "unauthenticated",
      update,
    };
  }, [session, update]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
