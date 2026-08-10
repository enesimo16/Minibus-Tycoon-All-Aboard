import { create } from "zustand";
import { PropDef, PropKind } from "../content/types";
import { STARTING_NEIGHBORHOOD } from "../content/scene";

let autoId = 0;

export type TransformMode = "translate" | "rotate";

interface EditorState {
  active: boolean;
  selectedId: string | null;
  transformMode: TransformMode;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  props: PropDef[];
  toggle: () => void;
  select: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  updateSelectedTransform: (patch: Partial<Pick<PropDef, "position" | "rotationY" | "scale">>) => void;
  addProp: (kind: PropKind) => void;
  removeSelected: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  active: false,
  selectedId: null,
  transformMode: "translate",
  dragging: false,
  setDragging: (v) => set({ dragging: v }),
  props: STARTING_NEIGHBORHOOD,
  toggle: () => set((s) => ({ active: !s.active, selectedId: s.active ? null : s.selectedId })),
  select: (id) => set({ selectedId: id }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  updateSelectedTransform: (patch) =>
    set((s) => ({
      props: s.props.map((p) => (p.id === s.selectedId ? { ...p, ...patch } : p)),
    })),
  addProp: (kind) => {
    const id = `${kind}-yeni-${autoId++}`;
    set((s) => ({
      props: [
        ...s.props,
        { id, kind, position: [0, 0, 0], color: "#999999" },
      ],
      selectedId: id,
    }));
  },
  removeSelected: () =>
    set((s) => ({
      props: s.props.filter((p) => p.id !== s.selectedId),
      selectedId: null,
    })),
}));

export function exportSceneJson(): string {
  return JSON.stringify(useEditorStore.getState().props, null, 2);
}
