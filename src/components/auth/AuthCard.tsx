"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type AuthCardProps = {
  mode: "login" | "signup";
};

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "";
  const urlError = searchParams.get("error") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError);
  const [successMsg, setSuccessMsg] = useState("");
  const [authMeta, setAuthMeta] = useState<{ mode: string; googleOAuthEnabled: boolean }>({
    mode: "loading",
    googleOAuthEnabled: false,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setAuthMeta({
          mode: data.mode || "unconfigured",
          googleOAuthEnabled: Boolean(data.googleOAuthEnabled),
        });
        if (data.authenticated && data.user) {
          const dest = nextParam.startsWith("/") && !nextParam.startsWith("//")
            ? nextParam
            : data.user.role === "admin"
            ? "/admin"
            : "/dashboard";
          router.replace(dest);
        }
      })
      .catch(() => undefined);
  }, [nextParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload =
        mode === "login"
          ? { email, password }
          : { fullName, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Terjadi kesalahan autentikasi.");
        setLoading(false);
        return;
      }

      if (data.requiresVerification) {
        setSuccessMsg(
          data.message || "Pendaftaran berhasil. Silakan cek kotak masuk Gmail Anda untuk verifikasi."
        );
        setLoading(false);
        return;
      }

      const safeNext = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "";
      const target = safeNext || data.redirectTo || "/dashboard";
      router.push(target);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Silakan coba kembali.");
      setLoading(false);
    }
  };

  const googleHref = nextParam
    ? `/api/auth/google?next=${encodeURIComponent(nextParam)}`
    : "/api/auth/google";

  return (
    <div className="jt-auth-shell">
      <Link href="/" className="jt-auth-back">
        ← Kembali ke Beranda
      </Link>

      <div className="jt-auth-card">
        <Link href="/" className="jt-auth-brand" aria-label="Juragantoken Beranda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-mark.png" alt="" width={28} height={23} />
          <span className="jt-auth-brand-text">
            juragan<span>token.</span>
          </span>
        </Link>

        <div className="jt-auth-tabs" role="tablist" aria-label="Pilih mode autentikasi">
          <Link
            href={nextParam ? `/login?next=${encodeURIComponent(nextParam)}` : "/login"}
            className={`jt-auth-tab ${mode === "login" ? "is-active" : ""}`}
          >
            Sign In
          </Link>
          <Link
            href={nextParam ? `/signup?next=${encodeURIComponent(nextParam)}` : "/signup"}
            className={`jt-auth-tab ${mode === "signup" ? "is-active" : ""}`}
          >
            Sign Up
          </Link>
        </div>

        <h1 className="jt-auth-title">
          {mode === "login" ? "Masuk ke Akun Anda" : "Buat Akun Juragantoken"}
        </h1>
        <p className="jt-auth-sub">
          {mode === "login"
            ? "Kelola pesanan, saldo token, dan API Key terintegrasi dengan akun Gmail Anda."
            : "Daftarkan akun Gmail Anda untuk mendapatkan integrasi Virtual API Key dan pantau pesanan."}
        </p>

        {error && (
          <div className="jt-alert error" role="alert">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="jt-alert success" role="status">
            {successMsg}
          </div>
        )}

        <a href={googleHref} className="jt-google-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-3a7.17 7.17 0 0 1-10.67-3.77H1.4v3.09A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.39 14.33A7.2 7.2 0 0 1 5.01 12c0-.81.14-1.6.38-2.33V6.58H1.4a12 12 0 0 0 0 10.84l3.99-3.09Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.4 6.58l3.99 3.09A7.16 7.16 0 0 1 12 4.75Z"
            />
          </svg>
          <span>
            {mode === "login" ? "Sign In dengan Google (Gmail)" : "Sign Up dengan Google (Gmail)"}
          </span>
        </a>

        <div className="jt-auth-divider">atau dengan email</div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="jt-field">
              <label htmlFor="auth-fullname">Nama Lengkap</label>
              <input
                id="auth-fullname"
                type="text"
                className="jt-input"
                placeholder="Nama lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
              />
            </div>
          )}

          <div className="jt-field">
            <label htmlFor="auth-email">Alamat Gmail / Email</label>
            <input
              id="auth-email"
              type="email"
              className="jt-input"
              placeholder="nama@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="jt-field">
            <label htmlFor="auth-password">Kata Sandi</label>
            <input
              id="auth-password"
              type="password"
              className="jt-input"
              placeholder={mode === "signup" ? "Minimal 8 karakter" : "Masukkan kata sandi"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 8 : 6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {mode === "signup" && (
            <div className="jt-field">
              <label htmlFor="auth-confirm">Konfirmasi Kata Sandi</label>
              <input
                id="auth-confirm"
                type="password"
                className="jt-input"
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className="jt-btn-primary-solid full"
            disabled={loading}
          >
            {loading
              ? "Memproses..."
              : mode === "login"
              ? "Sign In"
              : "Buat Akun Sekarang"}
          </button>
        </form>

        {authMeta.mode === "local-dev" && (
          <div className="jt-dev-hint">
            <strong>Mode Development Lokal Aktif:</strong>
            <br />
            Admin Panel: <code>admin@juragantoken.id</code> / <code>Admin12345!</code>
            <br />
            User Demo: <code>budi.dev@gmail.com</code> / <code>UserDemo123!</code>
          </div>
        )}
      </div>
    </div>
  );
}
