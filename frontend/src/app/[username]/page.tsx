"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const UsernameRouter = dynamic(
  () => import("@/game/UsernameRouter").then((m) => m.UsernameRouter),
  { ssr: false }
);

export default function UsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  return <UsernameRouter username={username} />;
}
