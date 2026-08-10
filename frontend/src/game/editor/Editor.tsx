"use client";

import { TransformControls } from "@react-three/drei";
import { useEditorStore } from "./editorStore";
import { propObjectRegistry } from "../content/registry";

// Kodsuz sahne editörü: seçili objeye TransformControls gizmosunu bağlar.
// Aç/kapat ve T/R kısayolları EditorHotkeys.tsx'te (Canvas dışında) yönetilir.
export function Editor() {
  const active = useEditorStore((s) => s.active);
  const selectedId = useEditorStore((s) => s.selectedId);
  const transformMode = useEditorStore((s) => s.transformMode);
  const updateSelectedTransform = useEditorStore((s) => s.updateSelectedTransform);
  const setDragging = useEditorStore((s) => s.setDragging);

  if (!active || !selectedId) return null;
  const object = propObjectRegistry.get(selectedId);
  if (!object) return null;

  return (
    <TransformControls
      object={object}
      mode={transformMode}
      onMouseDown={() => setDragging(true)}
      onMouseUp={() => {
        setDragging(false);
        const pos = object.position;
        const rotY = object.rotation.y;
        updateSelectedTransform({
          position: [pos.x, pos.y, pos.z],
          rotationY: rotY,
        });
      }}
    />
  );
}
