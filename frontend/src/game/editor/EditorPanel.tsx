"use client";

import { Leva, button, useControls } from "leva";
import { useAdminAccess } from "../admin";
import { useEditorStore, exportSceneJson } from "./editorStore";

const EDITOR_THEME = {
  colors: {
    elevation1: "#f4f0e7",
    elevation2: "#e8e3d9",
    elevation3: "#dad4c8",
    accent1: "#25333b",
    accent2: "#364851",
    accent3: "#4e626b",
    highlight1: "#25272a",
    highlight2: "#555b60",
    highlight3: "#7b817f",
    vivid1: "#b87a32",
  },
  radii: { xs: "5px", sm: "8px", lg: "14px" },
  fonts: { mono: "var(--font-game)", sans: "var(--font-game)" },
  fontSizes: { root: "12px" },
  sizes: { rootWidth: "min(22rem, calc(100vw - 1rem))", rowHeight: "34px", titleBarHeight: "42px" },
  shadows: { level1: "0 16px 42px rgba(24, 27, 29, 0.22)", level2: "0 6px 16px rgba(24, 27, 29, 0.16)" },
} as const;

export function EditorPanel() {
  const adminAccess = useAdminAccess();
  const active = useEditorStore((s) => s.active);
  const selectedId = useEditorStore((s) => s.selectedId);
  const addProp = useEditorStore((s) => s.addProp);
  const removeSelected = useEditorStore((s) => s.removeSelected);

  useControls(
    "Minibus Tycoon Editör",
    {
      "Seçili": { value: selectedId ?? "(yok)", editable: false },
      "Mod": { value: "T: Taşı · R: Döndür · Tıkla: Seç", editable: false },
      "🏠 Bina Ekle": button(() => addProp("building")),
      "🌳 Bitki Ekle": button(() => addProp("vegetation")),
      "📦 Prop Ekle": button(() => addProp("prop")),
      "🗑️ Seçiliyi Sil": button(() => removeSelected()),
      "📋 JSON Kopyala (scene.ts'e yapıştır)": button(() => {
        navigator.clipboard.writeText(exportSceneJson());
      }),
      "↗ Admin Paneline Git": button(() => {
        window.location.assign("/admin/analytics");
      }),
    },
    { collapsed: false },
    [selectedId]
  );

  if (adminAccess !== "allowed") return null;

  return (
    <Leva
      hidden={!active}
      theme={EDITOR_THEME}
      oneLineLabels={false}
      hideCopyButton
      titleBar={{ title: "Sahne Editörü · E ile kapat", filter: false, drag: true }}
    />
  );
}
