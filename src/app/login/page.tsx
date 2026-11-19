import { Suspense } from "react";
import type { Metadata } from "next";
import "../portal.css";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Sign In — Juragantoken",
  description: "Masuk dengan akun Gmail Anda untuk mengelola pesanan dan API Key Juragantoken.",
};

export default function LoginPage() {
  return (
    <div className="jt-portal-body">
      <Suspense fallback={<div className="jt-auth-shell">Memuat halaman masuk...</div>}>
        <AuthCard mode="login" />
      </Suspense>
    </div>
  );
}
