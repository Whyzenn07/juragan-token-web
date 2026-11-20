import { Suspense } from "react";
import type { Metadata } from "next";
import "../portal.css";
import "./admin.css";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Panel — Manajemen Pesanan & API Key | Juragantoken",
  description: "Panel administrasi Juragantoken untuk mengelola pesanan masuk, akun Gmail terdaftar, dan Virtual API Key.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="jt-portal-body">
      <Suspense fallback={<div className="jt-auth-shell">Memuat Panel Admin...</div>}>
        <AdminDashboardClient />
      </Suspense>
    </div>
  );
}
