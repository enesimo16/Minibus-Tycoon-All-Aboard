const STORAGE_KEY = "fullfilled-username";

/** `/[username]` sayfasının "bu benim kendi şehrim mi?" kararını GameHome'u hiç başlatmadan
 * verebilmesi için yerel önbellek (bkz. app/[username]/page.tsx). Gerçek kaynak backend'dir —
 * bu sadece hızlı/optimistik bir ipucu.
 */
export function getCachedUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setCachedUsername(username: string | null): void {
  if (typeof window === "undefined") return;
  if (username) localStorage.setItem(STORAGE_KEY, username);
  else localStorage.removeItem(STORAGE_KEY);
}
