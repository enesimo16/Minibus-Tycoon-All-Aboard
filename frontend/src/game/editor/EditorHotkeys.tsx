"use client";

import { useEffect } from "react";
import { useEditorStore } from "./editorStore";
import { useAdminAccess } from "../admin";

// Klavye kısayolları BİLEREK Canvas/WebGL ağacının dışında tutulur: react-three-fiber
// bileşenlerinin mount zamanlaması WebGL bağlamına bağlıdır, oysa E/T/R tuşları
// canvas henüz hazır olmasa/görünmese bile çalışabilmelidir.
// E tuşu yalnızca admin kullanıcılara açılır (bkz. admin.ts + .env.local).
export function EditorHotkeys() {
  const toggle = useEditorStore((s) => s.toggle);
  const setTransformMode = useEditorStore((s) => s.setTransformMode);
  const editorActive = useEditorStore((s) => s.active);
  const adminAccess = useAdminAccess();

  useEffect(() => {
    if (adminAccess !== "allowed" && editorActive) toggle();

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) return;
      if (adminAccess !== "allowed" || e.repeat) return;
      if (e.key === "e" || e.key === "E") toggle();
      // T/R yalnizca editor ACIKKEN: kapaliyken bu tuslar oyunun kendi kisayollari olabilir.
      if (!editorActive) return;
      if (e.key === "t" || e.key === "T") setTransformMode("translate");
      if (e.key === "r" || e.key === "R") setTransformMode("rotate");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [adminAccess, toggle, setTransformMode, editorActive]);

  return null;
}
