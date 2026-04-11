"use client";

import { useCallback, useEffect, useState } from "react";

export const AUTH_CHANGED_EVENT = "mindrift-auth-changed";

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function useJwtAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
      });

      if (!response.ok) {
        setIsAuthenticated(false);
      } else {
        const data = (await response.json()) as { authenticated?: boolean };
        setIsAuthenticated(Boolean(data.authenticated));
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const response = await fetch("/api/auth/token", {
          cache: forceRefreshToken ? "reload" : "no-store",
        });
        if (!response.ok) return null;

        const data = (await response.json()) as { token?: string };
        return typeof data.token === "string" ? data.token : null;
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoading(true);
      void refreshSession();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
  }, [refreshSession]);

  return {
    isLoading,
    isAuthenticated,
    fetchAccessToken,
  };
}
