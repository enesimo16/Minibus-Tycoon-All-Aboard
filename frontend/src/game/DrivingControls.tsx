"use client";

import { useEffect } from "react";
import { useGameStore } from "./store";

// WASD surus girdisi. Tus HARITASI (bkz. plan):
//   W / S  gaz / fren-geri      A / D  serit kaydirma (sollama)
//   Space  el freni             F      kapi ac/kapa
// E editorde, C kamerada, G kararda, U yonetimde — burada kullanilmaz.
const KEY_BINDINGS = {
  forward: ["w", "W", "ArrowUp"],
  backward: ["s", "S", "ArrowDown"],
  left: ["a", "A", "ArrowLeft"],
  right: ["d", "D", "ArrowRight"],
  handbrake: [" ", "Space"],
  doors: ["f", "F"],
} as const;

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

export function DrivingControls() {
  const setDrivingInput = useGameStore((s) => s.setDrivingInput);
  const toggleDoors = useGameStore((s) => s.toggleDoors);

  useEffect(() => {
    // Basili tuslari sette tutariz: iki yon ayni anda basiliysa net girdi 0 olur
    // ve tus birakilinca dogru duruma doneriz (keydown tekrarina guvenmeyiz).
    const pressed = new Set<string>();

    function applyInput() {
      const forward = KEY_BINDINGS.forward.some((key) => pressed.has(key));
      const backward = KEY_BINDINGS.backward.some((key) => pressed.has(key));
      const left = KEY_BINDINGS.left.some((key) => pressed.has(key));
      const right = KEY_BINDINGS.right.some((key) => pressed.has(key));
      setDrivingInput({
        throttle: (forward ? 1 : 0) + (backward ? -1 : 0),
        steer: (right ? 1 : 0) + (left ? -1 : 0),
        handbrake: KEY_BINDINGS.handbrake.some((key) => pressed.has(key)),
      });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (KEY_BINDINGS.doors.includes(event.key as never)) {
        toggleDoors();
        return;
      }
      const tracked = [
        ...KEY_BINDINGS.forward,
        ...KEY_BINDINGS.backward,
        ...KEY_BINDINGS.left,
        ...KEY_BINDINGS.right,
        ...KEY_BINDINGS.handbrake,
      ].includes(event.key as never);
      if (!tracked) return;
      // Space sayfayi kaydirmasin, ok tuslari da oyunu kaydirmasin.
      event.preventDefault();
      pressed.add(event.key);
      applyInput();
    }

    function onKeyUp(event: KeyboardEvent) {
      if (!pressed.delete(event.key)) return;
      applyInput();
    }

    // Sekme degisince tuslar "basili kalmis" gibi takilmasin.
    function releaseAll() {
      if (pressed.size === 0) return;
      pressed.clear();
      applyInput();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", releaseAll);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", releaseAll);
      releaseAll();
    };
  }, [setDrivingInput, toggleDoors]);

  return null;
}
