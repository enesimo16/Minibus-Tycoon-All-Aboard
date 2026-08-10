"use client";

import { useState } from "react";
import { GameHome } from "./GameHome";
import { VisitorCity } from "./VisitorCity";
import { getCachedUsername } from "./username";

// "Kendi şehrim mi yoksa ziyaret mi?" — yerel önbellekteki kullanıcı adıyla karşılaştırır
// (bkz. username.ts). Eşleşiyorsa GameHome (tam oyun), değilse VisitorCity (salt-okunur
// ziyaretçi görünümü, bkz. docs/game-design/06-sosyal-link-sekme.md).
// app/[username]/page.tsx bu bileşeni ssr:false ile yükler — localStorage'a bağlı bir karar
// olduğu için sunucu tarafında render edilemez (hydration uyuşmazlığı olurdu).
export function UsernameRouter({ username }: { username: string }) {
  const [isOwn] = useState(() => {
    const cached = getCachedUsername();
    return cached !== null && cached.toLowerCase() === username.toLowerCase();
  });

  if (isOwn) return <GameHome />;
  return <VisitorCity username={username} />;
}
