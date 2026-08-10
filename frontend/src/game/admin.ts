"use client";

import { useEffect, useState } from "react";
import { fetchAdminAccess } from "./api";

type AdminAccessState = "loading" | "allowed" | "denied";

let cachedAccess: Exclude<AdminAccessState, "loading"> | null = null;
let pendingAccess: Promise<boolean> | null = null;

async function resolveAdminAccess(): Promise<boolean> {
  if (cachedAccess) return cachedAccess === "allowed";
  pendingAccess ??= fetchAdminAccess()
    .then((allowed) => {
      cachedAccess = allowed ? "allowed" : "denied";
      return allowed;
    })
    .catch(() => {
      cachedAccess = "denied";
      return false;
    })
    .finally(() => {
      pendingAccess = null;
    });
  return pendingAccess;
}

/**
 * Admin kimliği istemcideki kullanıcı adına güvenmez. Backend, env'deki tek kullanıcıyı
 * veritabanındaki hesap ve aktif oturum tokenıyla doğrular; bu hook yalnız sonucu tüketir.
 */
export function useAdminAccess(): AdminAccessState {
  const [state, setState] = useState<AdminAccessState>(cachedAccess ?? "loading");

  useEffect(() => {
    let mounted = true;
    void resolveAdminAccess().then((allowed) => {
      if (mounted) setState(allowed ? "allowed" : "denied");
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

export function clearAdminAccessCache(): void {
  cachedAccess = null;
  pendingAccess = null;
}
