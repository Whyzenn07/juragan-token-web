"use client";

import { useState } from "react";
import Link from "next/link";
import { modelsCatalog, GATEWAY_BASE_URL, inputIdrPer1M, providerById } from "@/data/catalog";
import { Icon } from "@/components/ui/Icon";

export function DocsClient() {
  const [activeTab, setActiveTab] = useState<"quickstart" | "endpoints" | "models" | "errors">("quickstart");
  const [activeTool, setActiveTool] = useState<"cursor" | "claude" | "python" | "chatbox" | "curl">("cursor");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sampleKey = "jt-live-demo-xxxxxxxxxxxxxxxxxxxx";

  return (
    <main className="docs-content-wrapper">
      {/* Hero Banner Dokumentasi */}
      <section className="docs-hero-section">
        <div className="docs-hero-badge">
          <Icon name="bolt" size={14} />
          <span>Universal AI Gateway Documentation</span>
        </div>
        <h1>Dokumentasi API &amp; Panduan Integrasi</h1>
        <p>
          Hubungkan berbagai alat bantu AI favorit Anda (Cursor, Claude Code, Windsurf, Chatbox, hingga Python SDK) dengan <b>satu API Key terpadu</b> tanpa perlu kartu kredit internasional.
        </p>
        <div className="docs-base-url-box">
          <div className="docs-bu-label">BASE URL UNIVERSAL:</div>
          <div className="docs-bu-code-row">
            <code>{GATEWAY_BASE_URL}</code>
            <button
              type="button"
              onClick={() => handleCopy(GATEWAY_BASE_URL, "base-url")}
              className="docs-copy-btn"
            >
              <Icon name={copiedIndex === "base-url" ? "check" : "copy"} size={14} />
              <span>{copiedIndex === "base-url" ? "Tersalin!" : "Salin URL"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Navigasi Tab Utama */}
      <nav className="docs-tabs-nav" aria-label="Navigasi Dokumentasi">
        <button
          type="button"
          className={`docs-tab-btn ${activeTab === "quickstart" ? "active" : ""}`}
          onClick={() => setActiveTab("quickstart")}
        >
          <Icon name="terminal" size={16} />
          <span>1. Panduan Cepat (Quickstart)</span>
        </button>
        <button
          type="button"
          className={`docs-tab-btn ${activeTab === "endpoints" ? "active" : ""}`}
          onClick={() => setActiveTab("endpoints")}
        >
          <Icon name="globe" size={16} />
          <span>2. Spesifikasi Endpoint</span>
        </button>
        <button
          type="button"
          className={`docs-tab-btn ${activeTab === "models" ? "active" : ""}`}
          onClick={() => setActiveTab("models")}
        >
          <Icon name="bag" size={16} />
          <span>3. Daftar Model &amp; Tarif IDR</span>
        </button>
        <button
          type="button"
          className={`docs-tab-btn ${activeTab === "errors" ? "active" : ""}`}
          onClick={() => setActiveTab("errors")}
        >
          <Icon name="alert" size={16} />
          <span>4. Error Codes &amp; Troubleshooting</span>
        </button>
      </nav>

      {/* Tab 1: Quickstart */}
      {activeTab === "quickstart" && (
        <section className="docs-section">
          <div className="docs-tool-selector">
            <span className="dts-label">Pilih Tools Anda:</span>
            <div className="dts-buttons">
              <button
                type="button"
                className={`dts-btn ${activeTool === "cursor" ? "active" : ""}`}
                onClick={() => setActiveTool("cursor")}
              >
                Cursor AI &amp; Windsurf
              </button>
              <button
                type="button"
                className={`dts-btn ${activeTool === "claude" ? "active" : ""}`}
                onClick={() => setActiveTool("claude")}
              >
                Claude Code CLI
              </button>
              <button
                type="button"
                className={`dts-btn ${activeTool === "python" ? "active" : ""}`}
                onClick={() => setActiveTool("python")}
              >
                Python (OpenAI SDK)
              </button>
              <button
                type="button"
                className={`dts-btn ${activeTool === "chatbox" ? "active" : ""}`}
                onClick={() => setActiveTool("chatbox")}
              >
                Chatbox Desktop/Web
              </button>
              <button
                type="button"
                className={`dts-btn ${activeTool === "curl" ? "active" : ""}`}
                onClick={() => setActiveTool("curl")}
              >
                cURL / HTTP Request
              </button>
            </div>
          </div>

          {/* Sub-konten per tool */}
          {activeTool === "cursor" && (
            <div className="docs-tool-card">
              <h3>Integrasi Cursor AI &amp; Windsurf IDE</h3>
              <p>Cursor mendukung custom OpenAI API Key. Cukup ganti Base URL dan masukkan API Key Juragan Token Anda:</p>
              
              <ol className="docs-step-list">
                <li>
                  Buka aplikasi <b>Cursor</b> &gt; tekan <code>Ctrl + Shift + J</code> (atau buka <b>Settings &gt; Cursor Settings &gt; Models</b>).
                </li>
                <li>
                  Pada bagian <b>OpenAI API Key</b>, aktifkan tombol switch ke posisi <b>ON</b>.
                </li>
                <li>
                  Klik <b>Override OpenAI Base URL</b>, lalu masukkan URL:
                  <div className="code-block-snippet">
                    <code>{GATEWAY_BASE_URL}</code>
                    <button onClick={() => handleCopy(GATEWAY_BASE_URL, "c-url")}>
                      {copiedIndex === "c-url" ? "Tersalin!" : "Salin"}
                    </button>
                  </div>
                </li>
                <li>
                  Masukkan API Key Anda (contoh: <code>jt-live-xxxxxxxxxxxxxxxxxxxx</code>) pada kolom API Key.
                </li>
                <li>
                  Pada daftar model, tambahkan atau centang: <code>claude-3-5-sonnet</code>, <code>gpt-4o</code>, atau <code>gemini-3.5-flash</code>.
                </li>
              </ol>
            </div>
          )}

          {activeTool === "claude" && (
            <div className="docs-tool-card">
              <h3>Integrasi Claude Code CLI (Anthropic Terminal)</h3>
              <p>Jalankan coding agent Claude langsung dari terminal VS Code atau Command Prompt Anda:</p>

              <div className="docs-terminal-snippet">
                <div className="snippet-header">
                  <span>PowerShell (Windows)</span>
                  <button onClick={() => handleCopy(`$env:ANTHROPIC_BASE_URL="${GATEWAY_BASE_URL}"\n$env:ANTHROPIC_API_KEY="${sampleKey}"\nclaude`, "claude-ps")}>
                    {copiedIndex === "claude-ps" ? "Tersalin!" : "Salin Skrip"}
                  </button>
                </div>
                <pre>
{`$env:ANTHROPIC_BASE_URL="${GATEWAY_BASE_URL}"
$env:ANTHROPIC_API_KEY="jt-live-YOUR_KEY_HERE"
claude`}
                </pre>
              </div>

              <div className="docs-terminal-snippet" style={{ marginTop: "16px" }}>
                <div className="snippet-header">
                  <span>Bash / Linux / macOS</span>
                  <button onClick={() => handleCopy(`export ANTHROPIC_BASE_URL="${GATEWAY_BASE_URL}"\nexport ANTHROPIC_API_KEY="${sampleKey}"\nclaude`, "claude-bash")}>
                    {copiedIndex === "claude-bash" ? "Tersalin!" : "Salin Skrip"}
                  </button>
                </div>
                <pre>
{`export ANTHROPIC_BASE_URL="${GATEWAY_BASE_URL}"
export ANTHROPIC_API_KEY="jt-live-YOUR_KEY_HERE"
claude`}
                </pre>
              </div>
            </div>
          )}

          {activeTool === "python" && (
            <div className="docs-tool-card">
              <h3>Integrasi Python via Official OpenAI SDK</h3>
              <p>Gunakan library resmi <code>openai</code> dengan mengarahkan <code>base_url</code> ke Juragan Token:</p>

              <div className="docs-terminal-snippet">
                <div className="snippet-header">
                  <span>script.py</span>
                  <button onClick={() => handleCopy(`from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${GATEWAY_BASE_URL}",\n    api_key="jt-live-YOUR_KEY_HERE"\n)\n\nresponse = client.chat.completions.create(\n    model="gemini-3.5-flash",\n    messages=[\n        {"role": "system", "content": "Kamu adalah asisten koding AI yang cerdas."},\n        {"role": "user", "content": "Tuliskan fungsi Python untuk sorting data cepat."}\n    ]\n)\n\nprint(response.choices[0].message.content)`, "py-code")}>
                    {copiedIndex === "py-code" ? "Tersalin!" : "Salin Kode"}
                  </button>
                </div>
                <pre>
{`from openai import OpenAI

client = OpenAI(
    base_url="${GATEWAY_BASE_URL}",
    api_key="jt-live-YOUR_KEY_HERE"
)

response = client.chat.completions.create(
    model="gemini-3.5-flash",  # Atau: claude-3-5-sonnet, gpt-4o, deepseek-chat
    messages=[
        {"role": "system", "content": "Kamu adalah asisten AI yang cerdas."},
        {"role": "user", "content": "Halo Juragan Token! Jelaskan cara kerja AI."}
    ]
)

print(response.choices[0].message.content)`}
                </pre>
              </div>
            </div>
          )}

          {activeTool === "chatbox" && (
            <div className="docs-tool-card">
              <h3>Integrasi Chatbox (Desktop &amp; Web)</h3>
              <p>Aplikasi chat AI multi-platform yang sangat populer untuk produktivitas harian:</p>

              <ol className="docs-step-list">
                <li>Buka aplikasi Chatbox &gt; klik <b>Pengaturan (Settings)</b> di pojok kiri bawah.</li>
                <li>Pada pilihan <b>Model Provider</b>, pilih: <code>OpenAI API</code>.</li>
                <li>Pada kolom <b>API Host</b>, masukkan: <code>{GATEWAY_BASE_URL}</code></li>
                <li>Pada kolom <b>API Key</b>, masukkan token <code>jt-live-xxxx</code> Anda.</li>
                <li>Pilih model default (misal <code>gemini-3.5-flash</code> atau ketik <code>claude-3-5-sonnet</code>).</li>
                <li>Klik <b>Simpan</b> dan Anda bisa langsung chatting sepuasnya!</li>
              </ol>
            </div>
          )}

          {activeTool === "curl" && (
            <div className="docs-tool-card">
              <h3>Permintaan Langsung via cURL</h3>
              <p>Uji coba endpoint gateway langsung dari terminal atau skrip backend Anda:</p>

              <div className="docs-terminal-snippet">
                <div className="snippet-header">
                  <span>cURL Command</span>
                  <button onClick={() => handleCopy(`curl -X POST "${GATEWAY_BASE_URL}/chat/completions" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer jt-live-YOUR_KEY_HERE" \\\n  -d '{\n    "model": "gemini-3.5-flash",\n    "messages": [{"role": "user", "content": "Tes ping Juragan Token"}]\n  }'`, "curl-cmd")}>
                    {copiedIndex === "curl-cmd" ? "Tersalin!" : "Salin cURL"}
                  </button>
                </div>
                <pre>
{`curl -X POST "${GATEWAY_BASE_URL}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer jt-live-YOUR_KEY_HERE" \\
  -d '{
    "model": "gemini-3.5-flash",
    "messages": [
      {"role": "user", "content": "Tes koneksi ke Juragan Token!"}
    ]
  }'`}
                </pre>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Endpoints */}
      {activeTab === "endpoints" && (
        <section className="docs-section">
          <h2>Spesifikasi REST API</h2>
          <p>
            Semua endpoint sepenuhnya mematuhi standar <b>OpenAI API Specification</b>. Parameter standar seperti <code>temperature</code>, <code>max_tokens</code>, dan <code>stream</code> didukung penuh.
          </p>

          <div className="endpoint-item-card">
            <div className="eic-header">
              <span className="http-method post">POST</span>
              <code>/v1/chat/completions</code>
            </div>
            <p className="eic-desc">Membuat inferensi percakapan chat baru (mendukung streaming SSE dan respons JSON reguler).</p>

            <h4>Header yang Dibutuhkan:</h4>
            <div className="table-responsive">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Header</th>
                    <th>Format / Nilai</th>
                    <th>Wajib?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>Authorization</code></td>
                    <td><code>Bearer jt-live-xxxxxxxxxxxxxxxxxxxx</code></td>
                    <td><b>Ya</b></td>
                  </tr>
                  <tr>
                    <td><code>Content-Type</code></td>
                    <td><code>application/json</code></td>
                    <td><b>Ya</b></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 style={{ marginTop: "16px" }}>Parameter Body Request Utama:</h4>
            <div className="table-responsive">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Tipe</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>model</code></td>
                    <td>String</td>
                    <td>ID model AI tujuan (misal: <code>gemini-3.5-flash</code>, <code>claude-3-5-sonnet</code>, <code>gpt-4o</code>).</td>
                  </tr>
                  <tr>
                    <td><code>messages</code></td>
                    <td>Array of Object</td>
                    <td>Riwayat dialog percakapan berisi <code>role</code> (system/user/assistant) dan <code>content</code>.</td>
                  </tr>
                  <tr>
                    <td><code>stream</code></td>
                    <td>Boolean (opsional)</td>
                    <td>Jika <code>true</code>, respons dikirimkan secara Server-Sent Events (SSE) teks mengalir kata-per-kata.</td>
                  </tr>
                  <tr>
                    <td><code>temperature</code></td>
                    <td>Float (0.0 - 2.0)</td>
                    <td>Tingkat kreativitas respons (default 0.7).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="endpoint-item-card" style={{ marginTop: "20px" }}>
            <div className="eic-header">
              <span className="http-method get">GET</span>
              <code>/v1/models</code>
            </div>
            <p className="eic-desc">Mengambil daftar seluruh model AI aktif yang tersedia pada ekosistem Juragan Token.</p>
          </div>
        </section>
      )}

      {/* Tab 3: Models & Pricing */}
      {activeTab === "models" && (
        <section className="docs-section">
          <h2>Katalog Model &amp; Skema Perhitungan Saldo</h2>
          <p>
            Saldo IDR Anda dipotong secara proporsional per 1.000 token input dan output sesuai pemakaian nyata. Tidak ada pembulatan sepihak dan tidak ada biaya langganan bulanan.
          </p>

          <div className="pricing-formula-box">
            <strong>Formula Pemotongan Saldo:</strong>
            <code>Biaya (IDR) = ceil((Total Tokens / 1.000) × Tarif Model IDR)</code>
          </div>

          <div className="table-responsive" style={{ marginTop: "20px" }}>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Nama Provider</th>
                  <th>Tarif per 1k Token</th>
                  <th>Kategori Keahlian</th>
                </tr>
              </thead>
              <tbody>
                {modelsCatalog.slice(0, 14).map((m) => {
                  const prov = providerById(m.providerId);
                  const costPer1k = Math.max(5, Math.round(inputIdrPer1M(m) / 1000));
                  return (
                    <tr key={m.id}>
                      <td><code>{m.id}</code></td>
                      <td>{prov ? `${prov.company} (${prov.name})` : m.name}</td>
                      <td>
                        <b style={{ color: "#0a58ca" }}>
                          Rp {costPer1k.toLocaleString("id-ID")}
                        </b> / 1k token
                      </td>
                      <td><span className="category-pill">{m.category}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 4: Errors & Troubleshooting */}
      {activeTab === "errors" && (
        <section className="docs-section">
          <h2>Error Codes &amp; Penanganan</h2>
          <p>Respons error menggunakan struktur standar RFC 7807 dan kompatibel dengan penanganan error client OpenAI:</p>

          <div className="table-responsive">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Status HTTP</th>
                  <th>Error Code</th>
                  <th>Penyebab &amp; Solusi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>401 Unauthorized</code></td>
                  <td><code>invalid_api_key</code></td>
                  <td>
                    Format API Key salah atau token tidak ditemukan. Pastikan token diawali dengan <code>jt-live-</code> dan disalin utuh.
                  </td>
                </tr>
                <tr>
                  <td><code>402 Payment Required</code></td>
                  <td><code>insufficient_quota</code></td>
                  <td>
                    Saldo kredit token pada API Key Anda telah habis (Rp 0). Lakukan pembelian paket isi ulang di beranda.
                  </td>
                </tr>
                <tr>
                  <td><code>429 Too Many Requests</code></td>
                  <td><code>rate_limit_exceeded</code></td>
                  <td>
                    Terlalu banyak permintaan dalam 1 detik. Beri jeda singkat antar-permintaan batch.
                  </td>
                </tr>
                <tr>
                  <td><code>503 Service Unavailable</code></td>
                  <td><code>upstream_overloaded</code></td>
                  <td>
                    Server AI internasional sedang mengalami lonjakan beban. Gateway kami secara otomatis mencoba failover ke model setara.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
