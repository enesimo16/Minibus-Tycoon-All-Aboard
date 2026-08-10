const STORAGE_KEY = "fullfilled-player-id";
const AUTH_TOKEN_STORAGE_KEY = "fullfilled-auth-token";

// Login sisteminden sonra playerId artık rastgele üretilmiyor — backend'in
// /api/auth/login yanıtından geliyor (bkz. LoginGate.tsx). Bu dosya sadece
// yerel depolamayı okuyup yazıyor.

export function getPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setPlayerId(playerId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, playerId);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(authToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken);
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

/**
 * "Oyunu sıfırla" akışında bu cihazdaki oyuncuya ait TÜM yerel izleri siler
 * (yerel kayıt, profil istatistikleri, tutorial durumu, funnel işaretleri).
 * Oturum anahtarları KORUNUR — hesap silinmiyor, yalnız ilerleme sıfırlanıyor.
 * Sunucu tarafı: POST /api/saves/{playerId}/reset
 */
export function clearLocalPlayerData(playerId: string): void {
  if (typeof window === "undefined") return;
  const keep = new Set([STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY, "fullfilled-username"]);
  for (const key of Object.keys(localStorage)) {
    if (keep.has(key)) continue;
    // Oyuncuya özel anahtarlar id'yi içerir; genel oyun anahtarları da temizlenir.
    if (key.includes(playerId) || key.startsWith("fullfilled:save:")) {
      localStorage.removeItem(key);
    }
  }
}
