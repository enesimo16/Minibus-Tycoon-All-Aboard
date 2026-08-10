"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// LoginGate localStorage'a bağlı — ssr:false zorunlu, yoksa sunucu/istemci hydration
// uyuşmazlığı olur (bkz. UsernameRouter.tsx'teki aynı çözüm).
const LoginGate = dynamic(() => import("./LoginGate").then((m) => m.LoginGate), { ssr: false });
const CompanyGate = dynamic(() => import("./CompanyGate").then((m) => m.CompanyGate), { ssr: false });

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin/");

  return (
    <LoginGate>
      {isAdminPage ? children : <CompanyGate>{children}</CompanyGate>}
    </LoginGate>
  );
}
