"use client";

import { useEffect, useState } from "react";
import { GATEWAY_ORIGIN } from "@/data/catalog";
import { Icon } from "@/components/ui/Icon";

type OsId = "windows-ps" | "windows-cmd" | "macos" | "linux";

const OS_TABS: { id: OsId; label: string }[] = [
  { id: "windows-ps", label: "Windows PowerShell" },
  { id: "windows-cmd", label: "Windows CMD" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
];

function buildClaudeSnippet(os: OsId, origin: string): { shell: string; code: string; hint: string } {
  const tail = `\n\n# Pilih model apa saja: claude-sonnet-5-5, gemini-3.8-flash, deepseek-v4-pro\nclaude --model claude-sonnet-5-5`;
  switch (os) {
    case "windows-ps":
      return {
        shell: "Windows PowerShell — Claude Code CLI",
        code: `$env:ANTHROPIC_BASE_URL = "${origin}"\n$env:ANTHROPIC_API_KEY  = "jt-live-token-anda"${tail}`,
        hint: `Permanen: setx ANTHROPIC_BASE_URL "${origin}" lalu buka ulang terminal.`,
      };
    case "windows-cmd":
      return {
        shell: "Windows CMD — Claude Code CLI",
        code: `set ANTHROPIC_BASE_URL=${origin}\nset ANTHROPIC_API_KEY=jt-live-token-anda${tail}`,
        hint: "Variabel berlaku di jendela CMD ini saja. Gunakan setx untuk menyimpan permanen.",
      };
    case "macos":
      return {
        shell: "macOS Terminal (zsh) — Claude Code CLI",
        code: `export ANTHROPIC_BASE_URL="${origin}"\nexport ANTHROPIC_API_KEY="jt-live-token-anda"${tail}`,
        hint: "Permanen: simpan dua baris export di ~/.zshrc, lalu jalankan source ~/.zshrc.",
      };
    default:
      return {
        shell: "Linux Terminal (bash) — Claude Code CLI",
        code: `export ANTHROPIC_BASE_URL="${origin}"\nexport ANTHROPIC_API_KEY="jt-live-token-anda"${tail}`,
        hint: "Permanen: simpan dua baris export di ~/.bashrc, lalu jalankan source ~/.bashrc.",
      };
  }
}

function buildPythonOsMeta(os: OsId): { header: string; envComment: string; hint: string } {
  switch (os) {
    case "windows-ps":
      return {
        header: "main.py · Windows PowerShell",
        envComment: '# Setup: pip install openai  |  $env:JURAGAN_API_KEY="jt-live-token-anda"',
        hint: "Windows PowerShell: jalankan pip install openai lalu python main.py.",
      };
    case "windows-cmd":
      return {
        header: "main.py · Windows CMD",
        envComment: "# Setup: pip install openai  |  set JURAGAN_API_KEY=jt-live-token-anda",
        hint: "Windows CMD: jalankan pip install openai lalu python main.py.",
      };
    case "macos":
      return {
        header: "main.py · macOS (zsh)",
        envComment: '# Setup: pip3 install openai  |  export JURAGAN_API_KEY="jt-live-token-anda"',
        hint: "macOS Terminal: jalankan pip3 install openai lalu python3 main.py.",
      };
    default:
      return {
        header: "main.py · Linux (bash)",
        envComment: '# Setup: pip3 install openai  |  export JURAGAN_API_KEY="jt-live-token-anda"',
        hint: "Linux Terminal: jalankan pip3 install openai lalu python3 main.py.",
      };
  }
}

function OsSwitcherBar({ os, onChange }: { os: OsId; onChange: (next: OsId) => void }) {
  return (
    <div className="code-os-bar" role="tablist" aria-label="Pilih sistem operasi">
      {OS_TABS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={os === o.id}
          className={`code-os-btn ${os === o.id ? "is-active" : ""}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SetupGuides() {
  const [activeTab, setActiveTab] = useState<"claudecode" | "cursor" | "chatbox" | "python">("claudecode");
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
      // ignore
    }
  };

  const claudeSnippet = buildClaudeSnippet(os, origin);
  const claudeCodeSnippet = claudeSnippet.code;

  const pyOs = buildPythonOsMeta(os);
  const pythonSnippet = `${pyOs.envComment}
import os
from openai import OpenAI

# 1 Key untuk semua model (Gemini, Claude, GPT, DeepSeek)
client = OpenAI(
    base_url="${activeGatewayUrl}",
    api_key=os.environ.get("JURAGAN_API_KEY", "jt-live-token-anda")
)

response = client.chat.completions.create(
    model="gemini-3.8-flash", # Coba juga: 'deepseek-v4-flash', 'claude-sonnet-5-5'
    messages=[{"role": "user", "content": "Halo! Bantu optimasi fungsi Python ini..."}]
)
print(response.choices[0].message.content)`;

  return (
    <div className="setup-guides-section" id="panduan-setup">
      <div className="setup-header" data-reveal="fade-up">
        <span className="badge-pill">Panduan Setup 1-Menit</span>
        <h2>Token Anda bisa langsung dicolok ke mana saja.</h2>
        <p>
          Tidak perlu pusing coding backend. Cukup masukkan <b>Base URL</b> dan <b>API Key</b> Juragan Token ke aplikasi favorit Anda.
        </p>
      </div>

      <div className="tabs-nav" role="tablist" data-reveal="fade-in">
        <button
          role="tab"
          aria-selected={activeTab === "claudecode"}
          className={`tab-btn ${activeTab === "claudecode" ? "active" : ""}`}
          onClick={() => setActiveTab("claudecode")}
        >
          <span>Terminal Claude Code</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "cursor"}
          className={`tab-btn ${activeTab === "cursor" ? "active" : ""}`}
          onClick={() => setActiveTab("cursor")}
        >
          <span>Cursor AI / Windsurf</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "chatbox"}
          className={`tab-btn ${activeTab === "chatbox" ? "active" : ""}`}
          onClick={() => setActiveTab("chatbox")}
        >
          <span>Chatbox (HP &amp; Laptop)</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "python"}
          className={`tab-btn ${activeTab === "python" ? "active" : ""}`}
          onClick={() => setActiveTab("python")}
        >
          <span>Script Python / Tugas</span>
        </button>
      </div>

      <div className="tab-panel" data-reveal="scale">
        {activeTab === "claudecode" && (
          <div className="panel-content">
            <div className="panel-text">
              <h4>Gunakan Claude Code tanpa kartu kredit &amp; tanpa batasan 5 jam</h4>
              <p>
                Claude Code CLI secara bawaan mendukung kustom endpoint. Masukkan variabel lingkungan di bawah ini sebelum menjalankan perintah <code>claude</code>.
              </p>
              <ul className="guide-points">
                <li>Mendukung model terbaru <b>Claude Sonnet 5.5</b> dan <b>Claude Opus 5.5</b>.</li>
                <li>Mendukung prompt caching otomatis sehingga konsumsi token 90% lebih hemat.</li>
              </ul>
            </div>
            <div className="code-block-box">
              <div className="code-top">
                <span>{claudeSnippet.shell}</span>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copyCode(claudeCodeSnippet, "claude")}
                >
                  <Icon name={copied === "claude" ? "check" : "copy"} size={16} />
                  {copied === "claude" ? "Tersalin!" : "Salin Kode"}
                </button>
              </div>
              <OsSwitcherBar os={os} onChange={setOs} />
              <pre><code>{claudeCodeSnippet}</code></pre>
              <p className="code-hint-bar">{claudeSnippet.hint}</p>
            </div>
          </div>
        )}

        {activeTab === "cursor" && (
          <div className="panel-content">
            <div className="panel-text">
              <h4>Pasang di Cursor AI (Alternatif Cursor Pro Murah)</h4>
              <p>
                Jika kuota fast request Cursor Anda habis atau tidak punya kartu kredit untuk langganan resmi bulanan, cukup gunakan fitur Custom API Key di Cursor:
              </p>
              <ol className="cursor-steps">
                <li>Buka Cursor, tekan <code>Ctrl + Shift + J</code> (atau buka Settings).</li>
                <li>Masuk ke menu <b>Models</b> &gt; aktifkan <b>OpenAI API Key</b> atau <b>Anthropic API Key</b>.</li>
                <li>Centang opsi <b>Override OpenAI Base URL</b> dan isi dengan: <br /><code>{activeGatewayUrl}</code></li>
                <li>Masukkan API Key Juragan Token Anda. Selesai! Anda bisa coding sepuasnya.</li>
              </ol>
            </div>
            <div className="cursor-mockup-card">
              <div className="mock-title">Pengaturan Cursor</div>
              <div className="mock-field">
                <label>Override Base URL</label>
                <input readOnly value={activeGatewayUrl} />
              </div>
              <div className="mock-field">
                <label>API Key</label>
                <input readOnly value="jt-live-7f89xxxxxxxxxxxxxx" />
              </div>
              <span className="mock-tag">Model: gemini-3.8-flash (Aktif), claude-sonnet-5-5, deepseek-v4-flash</span>
            </div>
          </div>
        )}

        {activeTab === "chatbox" && (
          <div className="panel-content">
            <div className="panel-text">
              <h4>Chat Harian di Browser, HP Android/iPhone, &amp; Laptop</h4>
              <p>
                Bagi mahasiswa &amp; pengguna yang tidak ngoding dan ingin tampilan seperti ChatGPT Plus / Claude Pro resmi tanpa bayar langganan bulanan:
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "14px 0 16px" }}>
                <a
                  href="https://web.chatboxai.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="setup-link-btn primary"
                >
                  <Icon name="globe" size={14} />
                  <span>Buka Web Chatbox (web.chatboxai.app)</span>
                  <Icon name="external" size={12} />
                </a>
                <a
                  href="https://app.nextchat.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="setup-link-btn secondary"
                >
                  <Icon name="globe" size={14} />
                  <span>Buka NextChat Web (app.nextchat.dev)</span>
                  <Icon name="external" size={12} />
                </a>
              </div>

              <div className="faq-alert-card" style={{ margin: "0 0 16px" }}>
                <div className="faq-alert-icon">
                  <Icon name="alert" size={15} />
                </div>
                <div className="faq-alert-body">
                  <b>Perhatian: Hindari Salah Eja Domain</b>
                  <p>
                    Buka <code>web.chatboxai.app</code> <i>(tanpa tanda strip)</i> atau <code>app.nextchat.dev</code>. Jangan buka <i>chat-box.ai</i> karena itu web komersial pihak ketiga yang mengunci custom API Key.
                  </p>
                </div>
              </div>

              <ol className="cursor-steps">
                <li>Buka <b>Settings</b> (<Icon name="settings" size={13} style={{ margin: "0 2px" }} /> di pojok kiri bawah).</li>
                <li>Pilih menu <b>Model Provider</b> &gt; pilih <b>OpenAI</b> (karena Juragan Token memakai protokol standar OpenAI).</li>
                <li>Pada kolom <b>API Host</b>, masukkan: <code>{origin}</code></li>
                <li>Pada kolom <b>API Key</b>, tempelkan API Key token Anda.</li>
                <li>Klik tombol <b>+ New</b> di bagian Model, lalu ketik model pilihan (misal: <code>claude-sonnet-5-5</code> atau <code>gemini-3.8-flash</code>). Selesai!</li>
              </ol>
            </div>

            <div className="cursor-mockup-card">
              <div className="mock-title">Panduan Input di Web Chatbox / NextChat</div>
              <div className="mock-field">
                <label>1. Model Provider</label>
                <input readOnly value="OpenAI (Kompatibel Semua Model Juragan Token)" />
              </div>
              <div className="mock-field">
                <label>2. API Host / Endpoint</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input readOnly value={origin} />
                  <button
                    type="button"
                    className="copy-btn"
                    style={{ background: "#0a4ea3", color: "#fff", borderRadius: "4px", padding: "0 10px", flexShrink: 0 }}
                    onClick={() => copyCode(origin, "host")}
                  >
                    {copied === "host" ? "Tersalin!" : "Salin"}
                  </button>
                </div>
              </div>
              <div className="mock-field">
                <label>3. API Key</label>
                <input readOnly value="jt-live-token-anda (Aktif setelah terhubung dengan tim kami)" />
              </div>
              <div className="mock-field">
                <label>4. Model yang Didukung (Tinggal Ketik)</label>
                <input readOnly value="claude-sonnet-5-5, gpt-6-sol, gemini-3.8-flash, deepseek-v4-flash" />
              </div>
              <span className="mock-tag" style={{ color: "#16a34a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Icon name="check" size={13} />
                1 Token berlaku bersamaan untuk Claude, GPT, Gemini, &amp; DeepSeek!
              </span>
            </div>
          </div>
        )}

        {activeTab === "python" && (
          <div className="panel-content">
            <div className="panel-text">
              <h4>Integrasi Script Tugas Kuliah &amp; Proyek Python</h4>
              <p>
                Gunakan library standar <code>openai</code> di Python. Anda bebas memanggil model apa saja (DeepSeek, Claude, Qwen, GPT) cukup dengan mengganti nama parameter <code>model</code>.
              </p>
              <ul className="guide-points">
                <li>Berjalan lancar di Windows PowerShell, CMD, macOS, dan Linux.</li>
                <li>Ganti <code>model</code> kapan saja tanpa mengubah <code>base_url</code> maupun key.</li>
              </ul>
            </div>
            <div className="code-block-box">
              <div className="code-top">
                <span>{pyOs.header}</span>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copyCode(pythonSnippet, "py")}
                >
                  <Icon name={copied === "py" ? "check" : "copy"} size={16} />
                  {copied === "py" ? "Tersalin!" : "Salin Kode"}
                </button>
              </div>
              <OsSwitcherBar os={os} onChange={setOs} />
              <pre><code>{pythonSnippet}</code></pre>
              <p className="code-hint-bar">{pyOs.hint}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
