import { Suspense } from "react";
import type { Metadata } from "next";
import "../portal.css";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Sign Up — Juragantoken",
  description: "Daftarkan akun Gmail Anda untuk mulai menggunakan Juragantoken Unified AI Gateway.",
};

export default function SignUpPage() {
  return (
    <div className="jt-portal-body">
      <Suspense fallback={<div className="jt-auth-shell">Memuat halaman pendaftaran...</div>}>
        <AuthCard mode="signup" />
      </Suspense>
    </div>
  );
}
