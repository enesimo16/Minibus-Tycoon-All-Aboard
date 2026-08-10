"use client";

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function SvgIcon({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BusIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M6 19v1.5" />
      <path d="M18 19v1.5" />
      <path d="M5 17h14" />
      <path d="M5 6.5C5 4.6 6.6 3 8.5 3h7C17.4 3 19 4.6 19 6.5V17a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.5Z" />
      <path d="M7.5 7h9" />
      <path d="M7.5 11h9" />
      <circle cx="8" cy="15.5" r="1" />
      <circle cx="16" cy="15.5" r="1" />
    </SvgIcon>
  );
}

export function CoinsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="9" cy="7" rx="5" ry="2.5" />
      <path d="M4 7v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7" />
      <path d="M14 10.5c2.8.1 5 1.2 5 2.5 0 1.4-2.2 2.5-5 2.5-.8 0-1.6-.1-2.3-.3" />
      <path d="M9 14.5v2c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V13" />
    </SvgIcon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16.5 3.2a4 4 0 0 1 0 7.6" />
    </SvgIcon>
  );
}

export function SmileIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
    </SvgIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </SvgIcon>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </SvgIcon>
  );
}

export function DiceIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8.5 8.5h.01" />
      <path d="M15.5 8.5h.01" />
      <path d="M12 12h.01" />
      <path d="M8.5 15.5h.01" />
      <path d="M15.5 15.5h.01" />
    </SvgIcon>
  );
}

export function GarageIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 21V9l9-6 9 6v12" />
      <path d="M7 21v-8h10v8" />
      <path d="M9 17h6" />
    </SvgIcon>
  );
}

export function DriverIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="M8.5 4.8h7" />
    </SvgIcon>
  );
}

export function WrenchIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5 5L3.8 17.2a2 2 0 0 0 3 3l5.9-5.9a4 4 0 0 0 5-5l-2.5 2.5-3-3 2.5-2.5Z" />
    </SvgIcon>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h4a4 4 0 0 0 0-8h-1a4 4 0 0 1 0-8h5" />
    </SvgIcon>
  );
}

export function CityIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V8h5v13" />
      <path d="M14 21V4h5v17" />
      <path d="M7 11h1" />
      <path d="M7 15h1" />
      <path d="M16 8h1" />
      <path d="M16 12h1" />
      <path d="M16 16h1" />
    </SvgIcon>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M14.5 5.5 17 3v18l-2.5-2.5" />
      <rect x="3" y="6" width="11.5" height="12" rx="2" />
    </SvgIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </SvgIcon>
  );
}

export function RadioIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m8 7 9-4" />
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <circle cx="8.5" cy="13.5" r="3" />
      <path d="M14 12h4" />
      <path d="M14 15h4" />
    </SvgIcon>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </SvgIcon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </SvgIcon>
  );
}

export function StripIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M7 12h10" />
    </SvgIcon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3 2.8 19h18.4L12 3Z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </SvgIcon>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M6 3h12l3 3v12l-3 3H6l-3-3V6l3-3Z" />
      <path d="M9 9h6v6H9z" />
    </SvgIcon>
  );
}

export function XIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </SvgIcon>
  );
}
