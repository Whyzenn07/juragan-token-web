import { Suspense } from "react";
import type { Metadata } from "next";
import "../portal.css";
import { UserDashboardClient } from "./UserDashboardClient";

export const metadata: Metadata = {
  title: "Portal Pengguna — API Key & Pesanan | Juragantoken",
  description: "Kelola Virtual API Key terintegrasi akun Gmail dan pantau riwayat pesanan Anda di Juragantoken.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <div className="jt-portal-body">
      <Suspense fallback={<div className="jt-auth-shell">Memuat Portal Pengguna...</div>}>
        <UserDashboardClient />
      </Suspense>
    </div>
  );
}
