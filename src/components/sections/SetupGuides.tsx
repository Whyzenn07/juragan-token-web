"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GATEWAY_ORIGIN } from "@/data/catalog";
import { Icon } from "@/components/ui/Icon";

type OsId = "windows-ps" | "windows-cmd" | "macos" | "linux";
type GuideTabId = "claudecode" | "cursor" | "chatbox" | "python";

const OS_TABS: { id: OsId; label: string }[] = [
  { id: "windows-ps", label: "Windows PowerShell" },
  { id: "windows-cmd", label: "Windows CMD" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
];

const SAMPLE_MODELS = "claude-sonnet-5-5, gpt-6-sol, gemini-3.8-flash, deepseek-v4-flash";

function buildClaudeSnippet(os: OsId, origin: string): { shell: string; code: string; hint: string } {
  const tail = `\n\n# 1 Universal API Key untuk model apa saja:\nclaude --model claude-sonnet-5-5`;
  switch (os) {
    case "windows-ps":
      return {
        shell: "Windows PowerShell — Claude Code CLI",
        code: `$env:ANTHROPIC_BASE_URL = "${origin}"\n$env:ANTHROPIC_API_KEY  = "jt-live-kunci-anda"${tail}`,
        hint: `Simpan permanen: jalankan setx ANTHROPIC_BASE_URL "${origin}" lalu buka ulang PowerShell.`,
      };
    case "windows-cmd":
      return {
        shell: "Windows CMD — Claude Code CLI",
        code: `set ANTHROPIC_BASE_URL=${origin}\nset ANTHROPIC_API_KEY=jt-live-kunci-anda${tail}`,
        hint: "Variabel berlaku untuk sesi CMD aktif. Gunakan setx untuk konfigurasi permanen.",
      };
    case "macos":
      return {
        shell: "macOS Terminal (zsh) — Claude Code CLI",
        code: `export ANTHROPIC_BASE_URL="${origin}"\nexport ANTHROPIC_API_KEY="jt-live-kunci-anda"${tail}`,
        hint: "Simpan permanen di ~/.zshrc lalu muat ulang dengan perintah source ~/.zshrc.",
      };
    default:
      return {
        shell: "Linux Terminal (bash) — Claude Code CLI",
        code: `export ANTHROPIC_BASE_URL="${origin}"\nexport ANTHROPIC_API_KEY="jt-live-kunci-anda"${tail}`,
        hint: "Simpan permanen di ~/.bashrc lalu muat ulang dengan perintah source ~/.bashrc.",
      };
  }
}

function buildPythonOsMeta(os: OsId): { header: string; envComment: string; hint: string } {
  switch (os) {
    case "windows-ps":
      return {
        header: "main.py · Windows PowerShell",
        envComment: '# Instalasi: pip install openai  |  $env:JURAGAN_API_KEY="jt-live-kunci-anda"',
        hint: "Windows PowerShell: jalankan pip install openai lalu python main.py.",
      };
    case "windows-cmd":
      return {
        header: "main.py · Windows CMD",
        envComment: "# Instalasi: pip install openai  |  set JURAGAN_API_KEY=jt-live-kunci-anda",
        hint: "Windows CMD: jalankan pip install openai lalu python main.py.",
      };
    case "macos":
      return {
        header: "main.py · macOS (zsh)",
        envComment: '# Instalasi: pip3 install openai  |  export JURAGAN_API_KEY="jt-live-kunci-anda"',
        hint: "macOS Terminal: jalankan pip3 install openai lalu python3 main.py.",
      };
    default:
      return {
        header: "main.py · Linux (bash)",
        envComment: '# Instalasi: pip3 install openai  |  export JURAGAN_API_KEY="jt-live-kunci-anda"',
        hint: "Linux Terminal: jalankan pip3 install openai lalu python3 main.py.",
      };
  }
}

function OsSwitcherBar({ os, onChange }: { os: OsId; onChange: (next: OsId) => void }) {
  return (
    <div className="sg-os-bar" role="tablist" aria-label="Pilih sistem operasi">
      {OS_TABS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={os === o.id}
          className={`sg-os-btn ${os === o.id ? "is-active" : ""}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SetupGuides() {
  const [activeTab, setActiveTab] = useState<GuideTabId>("claudecode");
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState(GATEWAY_ORIGIN);
  const [os, setOs] = useState<OsId>("windows-ps");

  useEffect(() => {
    const timer = setTimeout(() => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("mac")) setOs("macos");
      else if (ua.includes("linux") && !ua.includes("android")) setOs("linux");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
      if (!isLocal && window.location.origin !== GATEWAY_ORIGIN) {
        const timer = setTimeout(() => {
          setOrigin(window.location.origin);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const activeGatewayUrl = `${origin}/v1`;

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(id);
      setTimeout(() => setCopied(null), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  const claudeSnippet = buildClaudeSnippet(os, origin);
  const pyOs = buildPythonOsMeta(os);

  const pythonSnippet = `${pyOs.envComment}
import os
from openai import OpenAI

# 1 Universal API Key untuk 100+ model lintas provider
client = OpenAI(
    base_url="${activeGatewayUrl}",
    api_key=os.environ.get("JURAGAN_API_KEY", "jt-live-kunci-anda")
)

response = client.chat.completions.create(
    model="gemini-3.8-flash",  # Ganti model: claude-sonnet-5-5, gpt-6-sol, deepseek-v4-pro
    messages=[{"role": "user", "content": "Review arsitektur endpoint ini secara ringkas."}]
)
print(response.choices[0].message.content)`;

  return (
    <section className="sg-section" id="panduan-setup" aria-labelledby="sg-heading">
      <div className="sg-header" data-reveal="fade-up">
        <span className="badge-pill">Panduan Integrasi Cepat</span>
        <h2 id="sg-heading">Satu API Key. Terhubung ke Semua Alat Kerja Anda.</h2>
        <p className="sg-lead">
          Tanpa konfigurasi backend yang rumit. Pasang <strong>Base URL</strong> dan{" "}
          <strong>1 Universal API Key</strong> Juragantoken pada terminal CLI, IDE, aplikasi chat AI, maupun SDK pilihan Anda.
        </p>
      </div>

      <div className="sg-tabs-scroll" data-reveal="fade-in">
        <div className="sg-tabs" role="tablist" aria-label="Pilih platform integrasi">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "claudecode"}
            className={`sg-tab ${activeTab === "claudecode" ? "is-active" : ""}`}
            onClick={() => setActiveTab("claudecode")}
          >
            <Icon name="terminal" size={15} />
            <span>Claude Code CLI</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "cursor"}
            className={`sg-tab ${activeTab === "cursor" ? "is-active" : ""}`}
            onClick={() => setActiveTab("cursor")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2.5" />
              <path d="M9 4v16M13 10l2.5 2L13 14" />
            </svg>
            <span>Cursor &amp; Windsurf</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "chatbox"}
            className={`sg-tab ${activeTab === "chatbox" ? "is-active" : ""}`}
            onClick={() => setActiveTab("chatbox")}
          >
            <Icon name="globe" size={15} />
            <span>Chatbox &amp; NextChat</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "python"}
            className={`sg-tab ${activeTab === "python" ? "is-active" : ""}`}
            onClick={() => setActiveTab("python")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="8 6 2 12 8 18" />
              <polyline points="16 6 22 12 16 18" />
              <line x1="13.5" y1="4" x2="10.5" y2="20" />
            </svg>
            <span>Python SDK</span>
          </button>
        </div>
      </div>

      <div className="sg-panel" data-reveal="scale">
        {activeTab === "claudecode" && (
          <div className="sg-grid">
            <div className="sg-copy">
              <h3>Jalankan Claude Code CLI dengan Kontrol Saldo Fleksibel</h3>
              <p>
                Claude Code CLI mendukung kustom endpoint secara bawaan. Tetapkan dua variabel lingkungan berikut sebelum menjalankan perintah <code>claude</code> di terminal Anda.
              </p>
              <ul className="sg-points">
                <li>
                  <span className="sg-point-check" aria-hidden="true"><Icon name="check" size={12} /></span>
                  <span>Akses model coding frontier termasuk <strong>Claude Sonnet 5.5</strong> dan <strong>Claude Opus 5.5</strong>.</span>
                </li>
                <li>
                  <span className="sg-point-check" aria-hidden="true"><Icon name="check" size={12} /></span>
                  <span>Tanpa kartu kredit internasional dan bebas batas sesi per 5 jam dengan deposit IDR transparan.</span>
                </li>
                <li>
                  <span className="sg-point-check" aria-hidden="true"><Icon name="check" size={12} /></span>
                  <span>Mendukung <em>prompt caching</em> otomatis serta proteksi IP Whitelist untuk tim Enterprise.</span>
                </li>
              </ul>
            </div>

            <div className="sg-code-card">
              <div className="sg-code-head">
                <div className="sg-code-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="sg-code-title">{claudeSnippet.shell}</span>
                <button
                  type="button"
                  className="sg-copy-dark"
                  onClick={() => copyCode(claudeSnippet.code, "claude")}
                >
                  <Icon name={copied === "claude" ? "check" : "copy"} size={14} />
                  <span>{copied === "claude" ? "Tersalin" : "Salin Kode"}</span>
                </button>
              </div>
              <OsSwitcherBar os={os} onChange={setOs} />
              <pre><code>{claudeSnippet.code}</code></pre>
              <p className="sg-code-hint">{claudeSnippet.hint}</p>
            </div>
          </div>
        )}

        {activeTab === "cursor" && (
          <div className="sg-grid">
            <div className="sg-copy">
              <h3>Integrasi Langsung di Cursor AI &amp; Windsurf IDE</h3>
              <p>
                Tetap produktif saat kuota bawaan IDE habis atau untuk pengadaan tim tanpa kartu kredit korporat. Gunakan fitur Custom OpenAI Key langsung dari pengaturan editor.
              </p>
              <ol className="sg-steps">
                <li>
                  <span className="sg-step-num">01</span>
                  <span>Buka Cursor IDE lalu masuk ke menu <strong>Settings</strong> (<code>Ctrl + Shift + J</code> / <code>Cmd + Shift + J</code>).</span>
                </li>
                <li>
                  <span className="sg-step-num">02</span>
                  <span>Pilih tab <strong>Models</strong> dan aktifkan opsi <strong>OpenAI API Key</strong>.</span>
                </li>
                <li>
                  <span className="sg-step-num">03</span>
                  <span>Aktifkan <strong>Override OpenAI Base URL</strong>, lalu isi dengan <code>{activeGatewayUrl}</code>.</span>
                </li>
                <li>
                  <span className="sg-step-num">04</span>
                  <span>Tempelkan 1 Universal API Key (<code>jt-live-...</code>) dan simpan untuk mulai coding.</span>
                </li>
              </ol>
            </div>

            <div className="sg-config-card">
              <div className="sg-config-head">
                <div>
                  <div className="sg-config-title">Konfigurasi Cursor &amp; Windsurf</div>
                  <div className="sg-config-sub">Salin parameter di bawah ke menu Settings → Models</div>
                </div>
                <span className="sg-compat-badge">OpenAI-Compatible</span>
              </div>

              <div className="sg-config-fields">
                <div className="sg-config-row">
                  <div className="sg-config-label">1. Override OpenAI Base URL</div>
                  <div className="sg-config-val-row">
                    <code className="sg-config-code">{activeGatewayUrl}</code>
                    <button
                      type="button"
                      className="sg-copy-light"
                      onClick={() => copyCode(activeGatewayUrl, "cursor-url")}
                    >
                      <Icon name={copied === "cursor-url" ? "check" : "copy"} size={13} />
                      <span>{copied === "cursor-url" ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>
                </div>

                <div className="sg-config-row">
                  <div className="sg-config-label">2. Universal API Key</div>
                  <div className="sg-config-val-row is-static">
                    <code className="sg-config-code">jt-live-xxxxxxxxxxxxxxxxxxxxxxxx</code>
                  </div>
                </div>

                <div className="sg-config-row">
                  <div className="sg-config-label">3. Contoh Model ID</div>
                  <div className="sg-config-val-row">
                    <code className="sg-config-code">{SAMPLE_MODELS}</code>
                    <button
                      type="button"
                      className="sg-copy-light"
                      onClick={() => copyCode("claude-sonnet-5-5", "cursor-model")}
                    >
                      <Icon name={copied === "cursor-model" ? "check" : "copy"} size={13} />
                      <span>{copied === "cursor-model" ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="sg-config-foot">
                <Icon name="check" size={14} />
                <span>Mendukung perpindahan model instan tanpa mengubah Base URL atau API Key.</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "chatbox" && (
          <div className="sg-grid">
            <div className="sg-copy">
              <h3>Antarmuka Chat Web &amp; Desktop Tanpa Koding</h3>
              <p>
                Ideal bagi tim non-teknis, analis, maupun pengguna harian yang menginginkan antarmuka chat modern di browser, desktop, dan ponsel menggunakan 1 Universal API Key Juragantoken.
              </p>

              <div className="sg-app-links">
                <a
                  href="https://web.chatboxai.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sg-app-btn is-primary"
                >
                  <Icon name="globe" size={15} />
                  <span>Buka Chatbox Web</span>
                  <Icon name="external" size={13} />
                </a>
                <a
                  href="https://app.nextchat.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sg-app-btn is-secondary"
                >
                  <Icon name="globe" size={15} />
                  <span>Buka NextChat Web</span>
                  <Icon name="external" size={13} />
                </a>
              </div>

              <div className="sg-callout-amber" role="note">
                <div className="sg-callout-icon" aria-hidden="true">
                  <Icon name="alert" size={16} />
                </div>
                <div className="sg-callout-body">
                  <strong>Pastikan Domain Resmi Tepat</strong>
                  <p>
                    Gunakan <code>web.chatboxai.app</code> (tanpa tanda hubung) atau <code>app.nextchat.dev</code>. Hindari situs komersial pihak ketiga bernama serupa yang mengunci pengaturan API Key kustom.
                  </p>
                </div>
              </div>

              <ol className="sg-steps">
                <li>
                  <span className="sg-step-num">01</span>
                  <span>Buka menu <strong>Settings</strong> (<Icon name="settings" size={13} style={{ margin: "0 2px" }} /> di pojok kiri bawah aplikasi).</span>
                </li>
                <li>
                  <span className="sg-step-num">02</span>
                  <span>Pilih <strong>Model Provider</strong> → <strong>OpenAI</strong> agar kompatibel dengan protokol gateway Juragantoken.</span>
                </li>
                <li>
                  <span className="sg-step-num">03</span>
                  <span>Isi kolom <strong>API Host</strong> dengan <code>{origin}</code>.</span>
                </li>
                <li>
                  <span className="sg-step-num">04</span>
                  <span>Masukkan <strong>Universal API Key</strong> aktif Anda dari Portal Akun atau Admin.</span>
                </li>
                <li>
                  <span className="sg-step-num">05</span>
                  <span>Tambahkan nama model pilihan melalui tombol <strong>+ New</strong> (misal <code>claude-sonnet-5-5</code> atau <code>gemini-3.8-flash</code>).</span>
                </li>
              </ol>
            </div>

            <div className="sg-config-card">
              <div className="sg-config-head">
                <div>
                  <div className="sg-config-title">Konfigurasi Chatbox &amp; NextChat</div>
                  <div className="sg-config-sub">Salin langsung ke formulir pengaturan klien</div>
                </div>
                <span className="sg-compat-badge">OpenAI-Compatible</span>
              </div>

              <div className="sg-config-fields">
                <div className="sg-config-row">
                  <div className="sg-config-label">1. Model Provider</div>
                  <div className="sg-config-val-row is-static">
                    <code className="sg-config-code">OpenAI (Kompatibel Semua Model Juragantoken)</code>
                  </div>
                </div>

                <div className="sg-config-row">
                  <div className="sg-config-label">2. API Host / Endpoint</div>
                  <div className="sg-config-val-row">
                    <code className="sg-config-code">{origin}</code>
                    <button
                      type="button"
                      className="sg-copy-light"
                      onClick={() => copyCode(origin, "host")}
                    >
                      <Icon name={copied === "host" ? "check" : "copy"} size={13} />
                      <span>{copied === "host" ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>
                </div>

                <div className="sg-config-row">
                  <div className="sg-config-label">3. Universal API Key</div>
                  <div className="sg-config-val-row is-static">
                    <code className="sg-config-code">jt-live-kunci-anda (Terbit via Portal / Admin)</code>
                  </div>
                </div>

                <div className="sg-config-row">
                  <div className="sg-config-label">4. Model yang Didukung</div>
                  <div className="sg-config-val-row">
                    <code className="sg-config-code">{SAMPLE_MODELS}</code>
                    <button
                      type="button"
                      className="sg-copy-light"
                      onClick={() => copyCode(SAMPLE_MODELS, "models")}
                    >
                      <Icon name={copied === "models" ? "check" : "copy"} size={13} />
                      <span>{copied === "models" ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="sg-config-foot">
                <Icon name="check" size={14} />
                <span>1 Universal API Key aktif lintas Claude, OpenAI, Gemini, DeepSeek, &amp; 100+ model AI.</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "python" && (
          <div className="sg-grid">
            <div className="sg-copy">
              <h3>Integrasi Cepat dengan Python OpenAI SDK</h3>
              <p>
                Gunakan pustaka resmi <code>openai</code> di Python tanpa perlu menginstal SDK berbeda untuk setiap vendor AI. Cukup ubah parameter <code>model</code> sesuai kebutuhan riset atau aplikasi Anda.
              </p>
              <ul className="sg-points">
                <li>
                  <span className="sg-point-check" aria-hidden="true"><Icon name="check" size={12} /></span>
                  <span>Berjalan konsisten di <strong>Windows PowerShell</strong>, <strong>CMD</strong>, <strong>macOS</strong>, maupun <strong>Linux</strong>.</span>
                </li>
                <li>
                  <span className="sg-point-check" aria-hidden="true"><Icon name="check" size={12} /></span>
                  <span>Berpindah antar model Claude, GPT, Gemini, DeepSeek, dan Qwen cukup lewat 1 parameter string.</span>
                </li>
                <li>
                  <span className="sg-point-check" aria-hidden="true"><Icon name="check" size={12} /></span>
                  <span>Mendukung <em>streaming SSE</em>, function calling, dan metrik token transparan dalam Rupiah.</span>
                </li>
              </ul>
            </div>

            <div className="sg-code-card">
              <div className="sg-code-head">
                <div className="sg-code-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="sg-code-title">{pyOs.header}</span>
                <button
                  type="button"
                  className="sg-copy-dark"
                  onClick={() => copyCode(pythonSnippet, "py")}
                >
                  <Icon name={copied === "py" ? "check" : "copy"} size={14} />
                  <span>{copied === "py" ? "Tersalin" : "Salin Kode"}</span>
                </button>
              </div>
              <OsSwitcherBar os={os} onChange={setOs} />
              <pre><code>{pythonSnippet}</code></pre>
              <p className="sg-code-hint">{pyOs.hint}</p>
            </div>
          </div>
        )}
      </div>

      <div className="sg-docs-strip">
        <span>
          Butuh panduan lengkap untuk <strong>Codex CLI</strong>, <strong>Gemini CLI</strong>, <strong>Continue.dev</strong>, <strong>VS Code</strong>, <strong>Node.js</strong>, atau <strong>cURL</strong>?
        </span>
        <Link href="/docs" className="sg-docs-link">
          <span>Buka Dokumentasi Lengkap</span>
          <Icon name="arrow" size={14} />
        </Link>
      </div>
    </section>
  );
}
