"use client";

import { useLeaderElection, useStateBroadcast } from "./useTabSync";

// Canvas dışında tutuluyor — sekme senkronu WebGL'in mount zamanlamasına bağımlı olmamalı
// (bkz. EditorHotkeys.tsx'teki aynı ders).
export function TabSync() {
  useLeaderElection();
  useStateBroadcast();
  return null;
}
