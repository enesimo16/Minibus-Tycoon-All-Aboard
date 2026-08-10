"use client";

import { useEffect } from "react";
import { useUiStore } from "./uiStore";
import { useEditorStore } from "./editor/editorStore";

// Canvas dışında tutuluyor (bkz. EditorHotkeys.tsx'teki aynı ders).
export function StripModeHotkeys() {
  const toggleStripMode = useUiStore((s) => s.toggleStripMode);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // M = serit (mod) tusu. S surus icin (fren/geri), T editorde tasima modunda.
      if (e.key === "m" || e.key === "M") {
        const enteringStrip = !useUiStore.getState().stripMode;
        toggleStripMode();
        // Şeride geçerken sığmayan editör panelini de kapat.
        if (enteringStrip && useEditorStore.getState().active) useEditorStore.getState().toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleStripMode]);

  return null;
}
