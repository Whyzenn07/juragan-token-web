"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  GATEWAY_BASE_URL,
  GATEWAY_ORIGIN,
  inputIdrPer1M,
  modelsCatalog,
  providerById,
} from "@/data/catalog";
import { ProviderLogo } from "@/components/ui/ProviderLogo";

type OsId = "windows-ps" | "windows-cmd" | "macos" | "linux";
type ToolId = "python" | "node" | "curl" | "claude" | "cursor" | "cline" | "chatbox";

const NAV = [
  { id: "mulai-cepat", label: "Mulai Cepat" },
  { id: "satu-key", label: "1 Key, Semua AI" },
  { id: "integrasi", label: "Integrasi Tools" },
  { id: "enterprise-ip", label: "Keamanan & IP Whitelist" },
  { id: "endpoint", label: "Endpoint API" },
  { id: "model-tarif", label: "Model & Tarif" },
  { id: "error-codes", label: "Kode Error" },
] as const;

const SWITCHER_MODELS = [
  { id: "claude-sonnet-5-5", provider: "anthropic", label: "Claude Sonnet 5.5" },
  { id: "chatgpt-6-astra", provider: "openai", label: "Chat GPT 6 Astra" },
  { id: "gemini-4-argon", provider: "google", label: "Gemini 4 Argon" },
  { id: "deepseek-v4-pro", provider: "deepseek", label: "DeepSeek V4 Pro" },
  { id: "qwen3.7-max", provider: "alibaba", label: "Qwen 3.7 Max" },
  { id: "grok-4", provider: "xai", label: "Grok 4" },
] as const;

const OS_OPTIONS: { id: OsId; label: string }[] = [
  { id: "windows-ps", label: "Windows PowerShell" },
  { id: "windows-cmd", label: "Windows CMD" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
];

const TOOL_OPTIONS: { id: ToolId; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "node", label: "Node.js" },
  { id: "curl", label: "cURL" },
  { id: "claude", label: "Claude Code CLI" },
  { id: "cursor", label: "Cursor / Windsurf" },
  { id: "cline", label: "VS Code (Cline / Continue)" },
  { id: "chatbox", label: "Chatbox / NextChat" },
];

function buildClaudeSnippet(os: OsId, model: string): { title: string; code: string; note: string } {
  switch (os) {
    case "windows-ps":
      return {
        title: "PowerShell",
        code: `$env:ANTHROPIC_BASE_URL = "${GATEWAY_ORIGIN}"
$env:ANTHROPIC_API_KEY  = "jt-live-kunci-anda"

claude --model ${model}`,
        note: 'Agar permanen, jalankan `setx ANTHROPIC_BASE_URL "' + GATEWAY_ORIGIN + '"` lalu buka ulang terminal.',
      };
    case "windows-cmd":
      return {
        title: "Command Prompt",
        code: `set ANTHROPIC_BASE_URL=${GATEWAY_ORIGIN}
set ANTHROPIC_API_KEY=jt-live-kunci-anda

claude --model ${model}`,
        note: "Variabel hanya berlaku pada jendela CMD yang sedang terbuka. Gunakan setx untuk menyimpan permanen.",
      };
    case "macos":
      return {
        title: "Terminal (zsh)",
        code: `export ANTHROPIC_BASE_URL="${GATEWAY_ORIGIN}"
export ANTHROPIC_API_KEY="jt-live-kunci-anda"

claude --model ${model}`,
        note: "Simpan dua baris export di ~/.zshrc lalu jalankan `source ~/.zshrc` agar permanen.",
      };
    default:
      return {
        title: "Terminal (bash)",
        code: `export ANTHROPIC_BASE_URL="${GATEWAY_ORIGIN}"
export ANTHROPIC_API_KEY="jt-live-kunci-anda"

claude --model ${model}`,
        note: "Simpan dua baris export di ~/.bashrc lalu jalankan `source ~/.bashrc` agar permanen.",
      };
  }
}

function buildSnippet(tool: ToolId, model: string, os: OsId) {
  if (tool === "python") {
    return {
      title: "main.py",
      lang: "python",
      code: `from openai import OpenAI

client = OpenAI(
    base_url="${GATEWAY_BASE_URL}",
    api_key="jt-live-kunci-anda",
)

response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "system", "content": "Kamu asisten teknis yang ringkas."},
        {"role": "user", "content": "Jelaskan arsitektur API gateway."},
    ],
)

print(response.choices[0].message.content)`,
    };
  }
  if (tool === "node") {
    return {
      title: "index.mjs",
      lang: "javascript",
      code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${GATEWAY_BASE_URL}",
  apiKey: process.env.JURAGAN_API_KEY, // jt-live-kunci-anda
});

const response = await client.chat.completions.create({
  model: "${model}",
  messages: [{ role: "user", content: "Review fungsi berikut..." }],
});

console.log(response.choices[0].message.content);`,
    };
  }
  if (tool === "curl") {
    return {
      title: "Terminal",
      lang: "bash",
      code: `curl -X POST "${GATEWAY_BASE_URL}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer jt-live-kunci-anda" \\
  -d '{
    "model": "${model}",
    "messages": [{ "role": "user", "content": "Tes koneksi Juragantoken" }]
  }'`,
    };
  }
  if (tool === "claude") {
    const snippet = buildClaudeSnippet(os, model);
    return { title: snippet.title, lang: "shell", code: snippet.code, note: snippet.note };
  }
  return null;
}

function CopyButton({ text, label = "Salin" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`dx-copy ${done ? "is-done" : ""}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Tersalin ✓" : label}
    </button>
  );
}

function CodeBlock({ title, code, hot }: { title: string; code: string; hot?: string }) {
  const lines = code.split("\n");
  return (
    <div className="dx-code">
      <div className="dx-code-bar">
        <span className="dx-code-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="dx-code-title">{title}</span>
        <CopyButton text={code} />
      </div>
      <pre className="dx-code-body">
        <code>
          {lines.map((line, idx) => {
            const isHot = Boolean(hot) && line.includes(hot as string);
            return (
              <span
                key={`${idx}-${isHot ? hot : "n"}`}
                className={`dx-line ${isHot ? "is-hot" : ""}`}
              >
                <span className="dx-ln" aria-hidden="true">
                  {idx + 1}
                </span>
                <span className="dx-lc">{line || " "}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

export function DocsClient() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>("mulai-cepat");
  const [model, setModel] = useState<string>(SWITCHER_MODELS[0].id);
  const [tool, setTool] = useState<ToolId>("python");
  const [os, setOs] = useState<OsId>("windows-ps");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const timer = window.setTimeout(() => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("mac")) setOs("macos");
      else if (ua.includes("linux") && !ua.includes("android")) setOs("linux");
    }, 0);

    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-dx-section]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) root.classList.add("dx-js");

    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        });
      },
      { threshold: 0.02, rootMargin: "0px 0px -4% 0px" }
    );
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive((entry.target as HTMLElement).id);
        });
      },
      { rootMargin: "-18% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((s) => {
      reveal.observe(s);
      spy.observe(s);
    });

    return () => {
      window.clearTimeout(timer);
      reveal.disconnect();
      spy.disconnect();
    };
  }, []);

  const snippet = useMemo(() => buildSnippet(tool, model, os), [tool, model, os]);

  const catalogRows = useMemo(
    () =>
      modelsCatalog.slice(0, 14).map((m) => {
        const prov = providerById(m.providerId);
        return {
          id: m.id,
          provider: prov ? prov.company : m.providerId,
          category: m.category,
          per1k: Math.max(5, Math.round(inputIdrPer1M(m) / 1000)),
        };
      }),
    []
  );

  return (
    <div className="dx-root" ref={rootRef}>
      <aside className="dx-sidebar" aria-label="Navigasi dokumentasi">
        <p className="dx-side-label">Dokumentasi</p>
        <nav className="dx-side-nav">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`dx-side-link ${active === item.id ? "is-active" : ""}`}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="dx-side-card">
          <strong>Butuh bantuan teknis?</strong>
          <span>Tim kami siap membantu integrasi Enterprise maupun Standard.</span>
          <a
            href="https://wa.me/6281226983990?text=Halo%20Tim%20Juragantoken%2C%20saya%20butuh%20bantuan%20integrasi%20API."
            target="_blank"
            rel="noopener noreferrer"
          >
            Hubungi via WhatsApp ↗
          </a>
        </div>
      </aside>

      <main className="dx-main">
        {/* HERO */}
        <header className="dx-hero">
          <span className="dx-eyebrow">Universal AI Gateway · OpenAI-Compatible</span>
          <h1>Satu API Key untuk semua model AI.</h1>
          <p className="dx-lead">
            Pasang <strong>Base URL</strong> dan <strong>API Key</strong> Juragantoken sekali. Berpindah antara
            Claude, GPT, Gemini, DeepSeek, dan 100+ model lainnya cukup dengan mengganti nilai{" "}
            <code>model</code>.
          </p>
          <div className="dx-baseurl">
            <span className="dx-baseurl-label">Base URL</span>
            <code>{GATEWAY_BASE_URL}</code>
            <CopyButton text={GATEWAY_BASE_URL} label="Salin URL" />
          </div>
        </header>

        {/* MULAI CEPAT */}
        <section id="mulai-cepat" className="dx-section" data-dx-section>
          <h2>Mulai cepat</h2>
          <p>
            Pilih model di bawah ini. Contoh kode langsung menyesuaikan, sementara <code>base_url</code> dan{" "}
            <code>api_key</code> tetap sama untuk semua model.
          </p>

          <div className="dx-switcher" role="tablist" aria-label="Pilih model contoh">
            {SWITCHER_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={model === m.id}
                className={`dx-pill ${model === m.id ? "is-active" : ""}`}
                onClick={() => setModel(m.id)}
              >
                <ProviderLogo provider={m.provider} size={18} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <ol className="dx-steps">
            <li>
              <strong>Daftar &amp; dapatkan API Key.</strong>{" "}
              <Link href="/signup">Buat akun</Link> lalu ajukan pesanan dari dashboard. Admin akan menerbitkan
              satu Universal API Key (<code>jt-live-...</code>) untuk akun Anda.
            </li>
            <li>
              <strong>Atur Base URL.</strong> Gunakan <code>{GATEWAY_BASE_URL}</code> pada aplikasi atau SDK
              apa pun yang kompatibel dengan OpenAI.
            </li>
            <li>
              <strong>Kirim request pertama.</strong> Salin contoh kode di bawah, ganti API Key, dan jalankan.
            </li>
          </ol>
        </section>

        {/* 1 KEY SEMUA AI */}
        <section id="satu-key" className="dx-section" data-dx-section>
          <h2>1 Key, semua AI</h2>
          <p>
            Satu kunci terhubung ke seluruh provider. Tidak ada SDK, akun, atau tagihan terpisah per vendor.
          </p>
          <div className="dx-cards">
            <article className="dx-card">
              <h3>Ganti model, bukan kunci</h3>
              <p>Ubah parameter <code>model</code> untuk berpindah antar-provider dalam hitungan detik.</p>
            </article>
            <article className="dx-card">
              <h3>Saldo IDR terpusat</h3>
              <p>Saldo dipotong per token nyata dan tidak hangus bulanan. Top-up masuk ke key yang sama.</p>
            </article>
            <article className="dx-card">
              <h3>Standard &amp; Enterprise</h3>
              <p>Fleksibel untuk developer, lengkap dengan IP Whitelist dan faktur pajak untuk perusahaan.</p>
            </article>
          </div>
        </section>

        {/* INTEGRASI TOOLS */}
        <section id="integrasi" className="dx-section" data-dx-section>
          <h2>Integrasi tools</h2>
          <p>
            Semua contoh memakai model terpilih: <code>{model}</code>. Panduan CLI tersedia untuk Windows, macOS,
            dan Linux.
          </p>

          <div className="dx-tabs" role="tablist" aria-label="Pilih tools">
            {TOOL_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tool === t.id}
                className={`dx-tab ${tool === t.id ? "is-active" : ""}`}
                onClick={() => setTool(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tool === "claude" && (
            <div className="dx-os" role="tablist" aria-label="Pilih sistem operasi">
              {OS_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="tab"
                  aria-selected={os === o.id}
                  className={`dx-os-btn ${os === o.id ? "is-active" : ""}`}
                  onClick={() => setOs(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {snippet && (
            <div key={`${tool}-${os}`} className="dx-panel">
              <CodeBlock title={snippet.title} code={snippet.code} hot={model} />
              {"note" in snippet && snippet.note && <p className="dx-note">{snippet.note}</p>}
            </div>
          )}

          {tool === "cursor" && (
            <div key="cursor" className="dx-panel">
              <ol className="dx-steps">
                <li>Buka Cursor, lalu pilih <strong>Settings → Models</strong>.</li>
                <li>Aktifkan <strong>OpenAI API Key</strong> dan centang <strong>Override OpenAI Base URL</strong>.</li>
                <li>Isi Base URL dengan <code>{GATEWAY_BASE_URL}</code> dan tempel API Key Juragantoken Anda.</li>
                <li>Tambahkan model <code>{model}</code> pada daftar model, lalu simpan.</li>
              </ol>
            </div>
          )}

          {tool === "cline" && (
            <div key="cline" className="dx-panel">
              <ol className="dx-steps">
                <li>Pasang ekstensi <strong>Cline</strong>, <strong>Roo Code</strong>, atau <strong>Continue</strong> di VS Code.</li>
                <li>Pada pengaturan provider, pilih <strong>OpenAI Compatible</strong>.</li>
                <li>Isi Base URL <code>{GATEWAY_BASE_URL}</code>, API Key <code>jt-live-...</code>, dan Model ID <code>{model}</code>.</li>
              </ol>
            </div>
          )}

          {tool === "chatbox" && (
            <div key="chatbox" className="dx-panel">
              <ol className="dx-steps">
                <li>Buka Chatbox atau NextChat (Web, HP, atau Desktop), lalu masuk ke <strong>Settings</strong>.</li>
                <li>Pilih provider <strong>OpenAI API</strong>.</li>
                <li>Isi API Host <code>{GATEWAY_BASE_URL}</code> dan API Key <code>jt-live-...</code>.</li>
                <li>Ketik model <code>{model}</code> lalu mulai mengobrol.</li>
              </ol>
            </div>
          )}
        </section>

        {/* ENTERPRISE IP */}
        <section id="enterprise-ip" className="dx-section" data-dx-section>
          <h2>Keamanan &amp; IP Whitelist</h2>
          <p>
            IP Whitelist adalah daftar alamat IP yang diizinkan memakai sebuah API Key. Jika key bocor, request
            dari luar daftar langsung ditolak.
          </p>
          <div className="dx-table-wrap">
            <table className="dx-table">
              <thead>
                <tr>
                  <th>Tipe akun</th>
                  <th>Pengaturan IP</th>
                  <th>Perilaku gateway</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Standard</strong></td>
                  <td>Kosong (default)</td>
                  <td>Key bisa dipakai dari jaringan mana saja: rumah, kafe, atau server.</td>
                </tr>
                <tr>
                  <td><strong>Enterprise</strong></td>
                  <td>Diisi IP kantor atau server</td>
                  <td>Hanya IP terdaftar yang lolos. Format didukung: IPv4, <code>103.45.12.*</code>, dan CIDR <code>/24</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock
            title="Respons 403 untuk IP di luar whitelist"
            code={`HTTP/1.1 403 Forbidden

{
  "error": {
    "message": "Akses ditolak oleh Enterprise IP Whitelist.",
    "type": "permission_error",
    "code": "ip_not_whitelisted_or_inactive"
  }
}`}
          />
          <p className="dx-note">
            Admin mengatur IP Whitelist per API Key lewat Panel Admin pada menu <strong>User Gmail &amp; API Key → IP / Tier</strong>.
          </p>
        </section>

        {/* ENDPOINT */}
        <section id="endpoint" className="dx-section" data-dx-section>
          <h2>Endpoint API</h2>
          <p>
            Seluruh endpoint mengikuti spesifikasi OpenAI. Parameter seperti <code>temperature</code>,{" "}
            <code>max_tokens</code>, dan <code>stream</code> didukung penuh.
          </p>

          <div className="dx-endpoint">
            <div className="dx-endpoint-head">
              <span className="dx-method post">POST</span>
              <code>/v1/chat/completions</code>
            </div>
            <p>Membuat respons percakapan baru, mendukung streaming SSE maupun JSON biasa.</p>
            <div className="dx-table-wrap">
              <table className="dx-table">
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
                    <td>string</td>
                    <td>ID model tujuan, misalnya <code>{model}</code>.</td>
                  </tr>
                  <tr>
                    <td><code>messages</code></td>
                    <td>array</td>
                    <td>Riwayat percakapan berisi <code>role</code> dan <code>content</code> (maksimal 200 pesan).</td>
                  </tr>
                  <tr>
                    <td><code>stream</code></td>
                    <td>boolean</td>
                    <td>Jika <code>true</code>, respons dikirim sebagai Server-Sent Events.</td>
                  </tr>
                  <tr>
                    <td><code>temperature</code></td>
                    <td>number</td>
                    <td>Tingkat kreativitas, 0.0 sampai 2.0.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="dx-endpoint">
            <div className="dx-endpoint-head">
              <span className="dx-method get">GET</span>
              <code>/v1/models</code>
            </div>
            <p>Mengambil daftar model AI aktif yang tersedia pada gateway.</p>
          </div>
        </section>

        {/* MODEL & TARIF */}
        <section id="model-tarif" className="dx-section" data-dx-section>
          <h2>Model &amp; tarif</h2>
          <p>
            Saldo dipotong proporsional sesuai token nyata. Tidak ada biaya langganan dan saldo tidak hangus.
          </p>
          <div className="dx-formula">
            <span>Biaya (IDR)</span>
            <code>ceil((total_token / 1.000) × tarif_model)</code>
          </div>
          <div className="dx-table-wrap">
            <table className="dx-table">
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Provider</th>
                  <th>Kategori</th>
                  <th>Tarif input / 1k token</th>
                </tr>
              </thead>
              <tbody>
                {catalogRows.map((row) => (
                  <tr key={row.id}>
                    <td><code>{row.id}</code></td>
                    <td>{row.provider}</td>
                    <td><span className="dx-tag">{row.category}</span></td>
                    <td className="dx-num">Rp {row.per1k.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="dx-note">
            Daftar lengkap 100+ model tersedia di{" "}
            <a href="https://api.tokotokenai.com/model-picker" target="_blank" rel="noopener noreferrer">
              Model Picker ↗
            </a>
            .
          </p>
        </section>

        {/* ERROR CODES */}
        <section id="error-codes" className="dx-section" data-dx-section>
          <h2>Kode error</h2>
          <p>Struktur error kompatibel dengan penanganan error pada klien OpenAI.</p>
          <div className="dx-table-wrap">
            <table className="dx-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Kode</th>
                  <th>Penyebab &amp; solusi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>401</code></td>
                  <td><code>invalid_api_key</code></td>
                  <td>Format atau kunci tidak ditemukan. Pastikan diawali <code>jt-live-</code> dan disalin utuh.</td>
                </tr>
                <tr>
                  <td><code>402</code></td>
                  <td><code>insufficient_quota</code></td>
                  <td>Saldo tidak cukup. Ajukan top-up dari dashboard untuk key yang sama.</td>
                </tr>
                <tr>
                  <td><code>403</code></td>
                  <td><code>ip_not_whitelisted_or_inactive</code></td>
                  <td>Key nonaktif atau IP pemanggil tidak ada di whitelist Enterprise.</td>
                </tr>
                <tr>
                  <td><code>429</code></td>
                  <td><code>rate_limit_exceeded</code></td>
                  <td>Batas laju tercapai (60 req/menit model umum, 20 req/menit model frontier). Beri jeda singkat.</td>
                </tr>
                <tr>
                  <td><code>503</code></td>
                  <td><code>upstream_overloaded</code></td>
                  <td>Provider hulu sedang padat. Gateway mencoba failover otomatis; ulangi bila perlu.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
