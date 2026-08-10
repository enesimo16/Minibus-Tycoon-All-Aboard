"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useT } from "./i18n";
import { useRadioStore } from "./radioStore";
import { useSettingsStore } from "./settingsStore";
import { useGameStore } from "./store";
import { useUiStore } from "./uiStore";

const JOYSTICK_DEAD_ZONE = 0.12;

export function MobileDrivingControls() {
  const mode = useSettingsStore((state) => state.mobileControlMode);
  const setMode = useSettingsStore((state) => state.setMobileControlMode);
  const setDrivingInput = useGameStore((state) => state.setDrivingInput);
  const toggleDoors = useGameStore((state) => state.toggleDoors);
  const driverActive = useGameStore((state) => state.driverActive);
  const stripMode = useUiStore((state) => state.stripMode);
  const panelOpen = useUiStore((state) => state.managementOpen || state.chanceGamesOpen || state.profileOpen || state.settingsOpen);
  const radioOpen = useRadioStore((state) => state.panelOpen);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLButtonElement>(null);
  const t = useT();

  useEffect(() => {
    const releaseAll = () => {
      setStick({ x: 0, y: 0 });
      setDrivingInput({ throttle: 0, steer: 0, handbrake: false });
    };
    const releaseWhenHidden = () => {
      if (document.visibilityState === "hidden") releaseAll();
    };
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", releaseWhenHidden);
    return () => {
      releaseAll();
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", releaseWhenHidden);
    };
  }, [setDrivingInput]);

  if (stripMode || driverActive || panelOpen || radioOpen) return null;

  function updateJoystick(event: ReactPointerEvent<HTMLButtonElement>) {
    const control = joystickRef.current;
    if (!control) return;
    const rect = control.getBoundingClientRect();
    const radius = Math.max(1, rect.width / 2 - 14);
    const rawX = event.clientX - (rect.left + rect.width / 2);
    const rawY = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > radius ? radius / distance : 1;
    const x = rawX * scale;
    const y = rawY * scale;
    const steer = Math.abs(x / radius) < JOYSTICK_DEAD_ZONE ? 0 : x / radius;
    const throttle = Math.abs(y / radius) < JOYSTICK_DEAD_ZONE ? 0 : -y / radius;
    setStick({ x, y });
    setDrivingInput({ steer, throttle, handbrake: false });
  }

  function releaseJoystick() {
    setStick({ x: 0, y: 0 });
    setDrivingInput({ steer: 0, throttle: 0 });
  }

  const switchMode = () => {
    releaseJoystick();
    setMode(mode === "joystick" ? "buttons" : "joystick");
  };

  return (
    <section data-tutorial="driving" className="ff-mobile-driving" aria-label={t("settings.mobileControls")}>
      <button type="button" className="ff-mobile-drive-mode" onClick={switchMode} aria-label={t("drive.controlMode")} title={t("drive.controlMode")}>
        {mode === "joystick" ? "◉" : "✣"}
      </button>

      {mode === "joystick" ? (
        <button
          ref={joystickRef}
          type="button"
          className="ff-mobile-joystick"
          aria-label={t("settings.controlJoystick")}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateJoystick(event); }}
          onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updateJoystick(event); }}
          onPointerUp={releaseJoystick}
          onPointerCancel={releaseJoystick}
          onLostPointerCapture={releaseJoystick}
        >
          <span style={{ transform: `translate3d(${stick.x}px, ${stick.y}px, 0)` }} />
        </button>
      ) : (
        <div className="ff-mobile-dpad">
          <DriveButton className="is-forward" label={t("drive.forward")} onPress={() => setDrivingInput({ throttle: 1 })} onRelease={() => setDrivingInput({ throttle: 0 })}>↑</DriveButton>
          <DriveButton className="is-left" label={t("drive.left")} onPress={() => setDrivingInput({ steer: -1 })} onRelease={() => setDrivingInput({ steer: 0 })}>←</DriveButton>
          <DriveButton className="is-right" label={t("drive.right")} onPress={() => setDrivingInput({ steer: 1 })} onRelease={() => setDrivingInput({ steer: 0 })}>→</DriveButton>
          <DriveButton className="is-backward" label={t("drive.backward")} onPress={() => setDrivingInput({ throttle: -1 })} onRelease={() => setDrivingInput({ throttle: 0 })}>↓</DriveButton>
        </div>
      )}

      <div className="ff-mobile-drive-actions">
        <DriveButton label={t("drive.handbrake")} onPress={() => setDrivingInput({ handbrake: true })} onRelease={() => setDrivingInput({ handbrake: false })}>P</DriveButton>
        <button type="button" onClick={toggleDoors} aria-label={t("drive.doors")}>↔</button>
      </div>
    </section>
  );
}

function DriveButton({ children, label, className = "", onPress, onRelease }: { children: string; label: string; className?: string; onPress: () => void; onRelease: () => void }) {
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); onPress(); }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onLostPointerCapture={onRelease}
    >
      {children}
    </button>
  );
}
