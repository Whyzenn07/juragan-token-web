"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  type Category,
  categories,
  GATEWAY_BASE_URL,
  GATEWAY_ORIGIN,
  inputIdrPer1M,
  modelsCatalog,
  providerById,
} from "@/data/catalog";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { Icon } from "@/components/ui/Icon";

type OsId = "windows-ps" | "windows-cmd" | "macos" | "linux";
type ToolId = "claude" | "curl" | "python" | "node" | "cursor" | "cline" | "chatbox";
type CodeLang = "shell" | "python" | "javascript" | "json";

const NAV = [
  { id: "mulai-cepat", label: "Mulai Cepat" },
  { id: "integrasi", label: "Integrasi & CLI" },
  { id: "satu-key", label: "1 Key, Semua AI" },
  { id: "enterprise-ip", label: "Keamanan & IP Whitelist" },
  { id: "endpoint", label: "Endpoint API" },
  { id: "model-tarif", label: "Model & Tarif" },
  { id: "error-codes", label: "Kode Error" },
] as const;

const SWITCHER_MODELS = [
  { id: "claude-fable-5-2", provider: "anthropic", label: "Claude Fable 5.2" },
  { id: "claude-opus-5-5", provider: "anthropic", label: "Claude Opus 5.5" },
  { id: "claude-sonnet-5-5", provider: "anthropic", label: "Claude Sonnet 5.5" },
  { id: "gpt-6.2-astra", provider: "openai", label: "GPT-6.2 Astra" },
  { id: "gpt-6.1-sol", provider: "openai", label: "GPT-6.1 Sol" },
  { id: "gemini-4-carbon", provider: "google", label: "Gemini 4 Carbon" },
  { id: "deepseek-v4.1-flash", provider: "deepseek", label: "DeepSeek V4.1 Flash" },
  { id: "kimi-k3", provider: "moonshot", label: "Kimi K3" },
  { id: "qwen3-coder-3.8-27b", provider: "alibaba", label: "Qwen3-Coder (3.8-27B)" },
] as const;

const OS_OPTIONS: { id: OsId; label: string }[] = [
  { id: "windows-ps", label: "Windows PowerShell" },
  { id: "windows-cmd", label: "Windows CMD" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
];

const TOOL_OPTIONS: { id: ToolId; label: string }[] = [
  { id: "claude", label: "Claude Code CLI" },
  { id: "curl", label: "cURL (Terminal)" },
  { id: "python", label: "Python SDK" },
  { id: "node", label: "Node.js SDK" },
  { id: "cursor", label: "Cursor / Windsurf" },
  { id: "cline", label: "VS Code (Cline / Roo)" },
  { id: "chatbox", label: "Chatbox / NextChat" },
];

function isCodeTool(tool: ToolId): tool is "claude" | "curl" | "python" | "node" {
  return tool === "claude" || tool === "curl" || tool === "python" || tool === "node";
}

function osEnvSetupComment(os: OsId, varName: string, commentPrefix: "#" | "//"): string {
  switch (os) {
    case "windows-ps":
      return `${commentPrefix} PowerShell: $env:${varName}="jt-live-kunci-anda"`;
    case "windows-cmd":
      return `${commentPrefix} CMD: set ${varName}=jt-live-kunci-anda`;
    case "macos":
      return `${commentPrefix} macOS (zsh): export ${varName}="jt-live-kunci-anda"`;
    default:
      return `${commentPrefix} Linux (bash): export ${varName}="jt-live-kunci-anda"`;
  }
}

function buildSnippet(
  tool: "claude" | "curl" | "python" | "node",
  model: string,
  os: OsId
): { title: string; lang: CodeLang; code: string; note: string } {
  if (tool === "claude") {
    switch (os) {
      case "windows-ps":
        return {
          title: "PowerShell — Claude Code CLI",
          lang: "shell",
          code: `# Install sekali: npm install -g @anthropic-ai/claude-code
$env:ANTHROPIC_BASE_URL = "${GATEWAY_ORIGIN}"
$env:ANTHROPIC_API_KEY  = "jt-live-kunci-anda"

claude --model ${model}`,
          note: `Agar permanen di Windows PowerShell, jalankan: setx ANTHROPIC_BASE_URL "${GATEWAY_ORIGIN}" lalu buka ulang terminal.`,
        };
      case "windows-cmd":
        return {
          title: "Command Prompt (CMD) — Claude Code CLI",
          lang: "shell",
          code: `rem Install sekali: npm install -g @anthropic-ai/claude-code
set ANTHROPIC_BASE_URL=${GATEWAY_ORIGIN}
set ANTHROPIC_API_KEY=jt-live-kunci-anda

claude --model ${model}`,
          note: "Perintah `set` hanya aktif pada jendela CMD yang terbuka. Gunakan `setx` jika ingin menyimpan permanen.",
        };
      case "macos":
        return {
          title: "macOS Terminal (zsh) — Claude Code CLI",
          lang: "shell",
          code: `# Install sekali: npm install -g @anthropic-ai/claude-code
export ANTHROPIC_BASE_URL="${GATEWAY_ORIGIN}"
export ANTHROPIC_API_KEY="jt-live-kunci-anda"

claude --model ${model}`,
          note: "Simpan dua baris export di ~/.zshrc lalu jalankan `source ~/.zshrc` agar otomatis aktif setiap membuka Terminal.",
        };
      default:
        return {
          title: "Linux Terminal (bash) — Claude Code CLI",
          lang: "shell",
          code: `# Install sekali: npm install -g @anthropic-ai/claude-code
export ANTHROPIC_BASE_URL="${GATEWAY_ORIGIN}"
export ANTHROPIC_API_KEY="jt-live-kunci-anda"

claude --model ${model}`,
          note: "Simpan dua baris export di ~/.bashrc lalu jalankan `source ~/.bashrc` agar permanen.",
        };
    }
  }

  if (tool === "curl") {
    switch (os) {
      case "windows-ps":
        return {
          title: "PowerShell — cURL (curl.exe)",
          lang: "shell",
          code: `$body = @'
{
  "model": "${model}",
  "messages": [{ "role": "user", "content": "Tes koneksi Juragantoken" }]
}
'@

curl.exe -X POST "${GATEWAY_BASE_URL}/chat/completions" \`
  -H "Content-Type: application/json" \`
  -H "Authorization: Bearer jt-live-kunci-anda" \`
  -d $body`,
          note: "Memakai `curl.exe` agar tidak tertukar dengan alias `Invoke-WebRequest` bawaan Windows PowerShell.",
        };
      case "windows-cmd":
        return {
          title: "Command Prompt (CMD) — cURL",
          lang: "shell",
          code: `curl.exe -X POST "${GATEWAY_BASE_URL}/chat/completions" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer jt-live-kunci-anda" ^
  -d "{ \\"model\\": \\"${model}\\", \\"messages\\": [{\\"role\\": \\"user\\", \\"content\\": \\"Tes koneksi Juragantoken\\"}] }"`,
          note: "CMD memakai karakter `^` untuk baris baru dan backslash `\\\"` pada kutip JSON.",
        };
      case "macos":
        return {
          title: "macOS Terminal (zsh) — cURL",
          lang: "shell",
          code: `curl -X POST "${GATEWAY_BASE_URL}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer jt-live-kunci-anda" \\
  -d '{
    "model": "${model}",
    "messages": [{ "role": "user", "content": "Tes koneksi Juragantoken" }]
  }'`,
          note: "cURL sudah tersedia secara bawaan di macOS Terminal (zsh).",
        };
      default:
        return {
          title: "Linux Terminal (bash) — cURL",
          lang: "shell",
          code: `curl -X POST "${GATEWAY_BASE_URL}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer jt-live-kunci-anda" \\
  -d '{
    "model": "${model}",
    "messages": [{ "role": "user", "content": "Tes koneksi Juragantoken" }]
  }'`,
          note: "Dapat dijalankan langsung di bash/zsh pada Ubuntu, Debian, Fedora, atau container CI/CD.",
        };
    }
  }

  if (tool === "python") {
    return {
      title: "main.py — OpenAI Python SDK",
      lang: "python",
      code: `# Setup: pip install openai
${osEnvSetupComment(os, "JURAGAN_API_KEY", "#")}
import os
from openai import OpenAI

client = OpenAI(
    base_url="${GATEWAY_BASE_URL}",
    api_key=os.environ["JURAGAN_API_KEY"],
)

response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "system", "content": "Kamu asisten teknis yang ringkas."},
        {"role": "user", "content": "Jelaskan arsitektur API gateway."},
    ],
)

print(response.choices[0].message.content)`,
      note: "Kompatibel dengan SDK `openai` Python resmi v1+ tanpa library tambahan.",
    };
  }

  return {
    title: "index.mjs — OpenAI Node.js SDK",
    lang: "javascript",
    code: `// Setup: npm install openai
${osEnvSetupComment(os, "JURAGAN_API_KEY", "//")}
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${GATEWAY_BASE_URL}",
  apiKey: process.env.JURAGAN_API_KEY,
});

const response = await client.chat.completions.create({
  model: "${model}",
  messages: [{ role: "user", content: "Review fungsi berikut secara ringkas." }],
});

console.log(response.choices[0].message.content);`,
    note: "Berfungsi di Node.js 18+, Next.js Route Handler, Deno, maupun Bun.",
  };
}

const KEYWORD_SETS: Record<CodeLang, Set<string>> = {
  shell: new Set(["export", "set", "setx", "curl", "curl.exe", "claude", "npm", "npx", "pip", "rem"]),
  python: new Set(["import", "from", "def", "return", "print", "True", "False", "None", "as", "with"]),
  javascript: new Set(["import", "from", "const", "let", "await", "async", "new", "return", "true", "false"]),
  json: new Set(["true", "false", "null", "HTTP/1.1", "Forbidden"]),
};

const INLINE_TOKEN_RE =
  /("(?:\\.|[^"\\])*"(?:\s*:)?|'(?:\\.|[^'\\])*'|\$env:[A-Za-z_][A-Za-z0-9_]*|\$[A-Za-z_][A-Za-z0-9_]*|process\.env\.[A-Za-z_][A-Za-z0-9_]*|--?[A-Za-z][A-Za-z0-9-]*|\b(?:import|from|const|let|await|async|new|return|export|set|setx|curl\.exe|curl|claude|print|True|False|true|false|null|HTTP\/1\.1|Forbidden)\b)/g;

function tokenizeCodeSegment(segment: string, lang: CodeLang): ReactNode[] {
  if (!segment) return [];
  const keywords = KEYWORD_SETS[lang];
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let k = 0;
  INLINE_TOKEN_RE.lastIndex = 0;

  let match: RegExpExecArray | null = INLINE_TOKEN_RE.exec(segment);
  while (match !== null) {
    if (match.index > cursor) {
      nodes.push(segment.slice(cursor, match.index));
    }
    const token = match[0];
    let cls = "";

    if (token.startsWith('"') && token.endsWith(":")) {
      const colonPos = token.lastIndexOf(":");
      nodes.push(
        <span key={`k-${k++}`} className="dx-tok-key">
          {token.slice(0, colonPos)}
        </span>
      );
      nodes.push(token.slice(colonPos));
      cursor = match.index + token.length;
      match = INLINE_TOKEN_RE.exec(segment);
      continue;
    } else if (token.startsWith('"') || token.startsWith("'")) {
      cls = "dx-tok-str";
    } else if (token.startsWith("$") || token.startsWith("process.env.") || token.startsWith("-")) {
      cls = "dx-tok-var";
    } else if (keywords.has(token)) {
      cls = "dx-tok-kw";
    }

    nodes.push(
      cls ? (
        <span key={`t-${k++}`} className={cls}>
          {token}
        </span>
      ) : (
        token
      )
    );
    cursor = match.index + token.length;
    match = INLINE_TOKEN_RE.exec(segment);
  }

  if (cursor < segment.length) {
    nodes.push(segment.slice(cursor));
  }
  return nodes;
}

function renderHighlightedLine(line: string, lang: CodeLang): ReactNode {
  if (!line) return " ";
  const trimmed = line.trimStart();

  if (
    (lang === "shell" && (trimmed.startsWith("#") || trimmed.toLowerCase().startsWith("rem "))) ||
    (lang === "python" && trimmed.startsWith("#")) ||
    (lang === "javascript" && trimmed.startsWith("//"))
  ) {
    return <span className="dx-tok-cmt">{line}</span>;
  }

  // Split trailing inline comment cleanly outside quotes when preceded by whitespace
  const marker = lang === "javascript" ? " //" : lang === "python" ? " #" : null;
  if (marker) {
    const idx = line.indexOf(marker);
    if (idx !== -1) {
      const before = line.slice(0, idx);
      const quoteCount = (before.match(/"/g) || []).length + (before.match(/'/g) || []).length;
      if (quoteCount % 2 === 0) {
        return (
          <>
            {tokenizeCodeSegment(line.slice(0, idx + 1), lang)}
            <span className="dx-tok-cmt">{line.slice(idx + 1)}</span>
          </>
        );
      }
    }
  }

  return tokenizeCodeSegment(line, lang);
}

function CopyButton({
  text,
  label = "Salin",
  compact = false,
}: {
  text: string;
  label?: string;
  compact?: boolean;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`dx-copy ${compact ? "is-compact" : ""} ${done ? "is-done" : ""}`}
      aria-label={`${label} ${text}`}
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
      <Icon name={done ? "check" : "copy"} size={compact ? 13 : 14} />
      <span>{done ? "Tersalin" : label}</span>
    </button>
  );
}

function CodeBlock({
  title,
  lang,
  code,
  hot,
}: {
  title: string;
  lang: CodeLang;
  code: string;
  hot?: string;
}) {
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
                <span className="dx-lc">{renderHighlightedLine(line, lang)}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

type ConfigField = { label: string; value: string; copyable?: boolean };

function ConfigCard({ title, fields }: { title: string; fields: ConfigField[] }) {
  return (
    <div className="dx-config-card">
      <div className="dx-config-head">{title}</div>
      <div className="dx-config-rows">
        {fields.map((f) => (
          <div key={f.label} className="dx-config-row">
            <span className="dx-config-key">{f.label}</span>
            <code className="dx-config-val">{f.value}</code>
            {f.copyable !== false && <CopyButton text={f.value} label="Salin" compact />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocsClient() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>("mulai-cepat");
  const [model, setModel] = useState<string>(SWITCHER_MODELS[0].id);
  const [tool, setTool] = useState<ToolId>("claude");
  const [os, setOs] = useState<OsId>("windows-ps");
  const [modelSearch, setModelSearch] = useState("");
  const [modelCat, setModelCat] = useState<Category>("Semua");
  const [showAllModels, setShowAllModels] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const timer = window.setTimeout(() => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("mac")) setOs("macos");
      else if (ua.includes("linux") && !ua.includes("android")) setOs("linux");
    }, 0);

    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-dx-section]"));

    const syncRevealInView = () => {
      const vh = window.innerHeight || 900;
      sections.forEach((s) => {
        const rect = s.getBoundingClientRect();
        if (rect.top < vh + 64 && rect.bottom > -64) {
          s.classList.add("is-in");
        }
      });
    };

    const syncActiveSection = () => {
      if (window.scrollY < 100) {
        setActive(NAV[0].id);
        return;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40) {
        setActive(NAV[NAV.length - 1].id);
        return;
      }
      const probe = window.scrollY + 140;
      let current: string = NAV[0].id;
      for (const item of NAV) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= probe) {
          current = item.id;
        }
      }
      setActive(current);
    };

    // Tandai seluruh section di viewport SEBELUM mengaktifkan .dx-js agar tidak ada section tersembunyi saat load awal
    syncRevealInView();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      root.classList.add("dx-js");
    } else {
      sections.forEach((s) => s.classList.add("is-in"));
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
          }
        });
      },
      { threshold: 0.01, rootMargin: "64px 0px 64px 0px" }
    );
    sections.forEach((s) => revealObserver.observe(s));

    let raf = 0;
    const onScroll = () => {
      if (!raf) {
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          syncActiveSection();
          syncRevealInView();
        });
      }
    };

    const onHashChange = () => {
      window.requestAnimationFrame(() => {
        syncRevealInView();
        syncActiveSection();
      });
    };

    syncActiveSection();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.clearTimeout(timer);
      if (raf) window.cancelAnimationFrame(raf);
      revealObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const snippet = useMemo(
    () => (isCodeTool(tool) ? buildSnippet(tool, model, os) : null),
    [tool, model, os]
  );

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    return modelsCatalog
      .filter((m) => modelCat === "Semua" || m.category === modelCat)
      .filter((m) => {
        if (!q) return true;
        const prov = providerById(m.providerId);
        const company = prov ? prov.company.toLowerCase() : "";
        return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || company.includes(q);
      })
      .map((m) => {
        const prov = providerById(m.providerId);
        return {
          id: m.id,
          providerId: m.providerId,
          provider: prov ? prov.company : m.providerId,
          category: m.category,
          per1k: Math.max(5, Math.round(inputIdrPer1M(m) / 1000)),
        };
      });
  }, [modelSearch, modelCat]);

  const isSearching = modelSearch.trim().length > 0;
  const visibleModels =
    showAllModels || isSearching ? filteredModels : filteredModels.slice(0, 12);

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
            Claude, ChatGPT, Gemini, DeepSeek, dan 100+ model lainnya cukup dengan mengganti nilai{" "}
            <code>model</code>.
          </p>

          <ul className="dx-hero-chips" aria-label="Ringkasan dukungan platform">
            <li>Windows · macOS · Linux</li>
            <li>OpenAI &amp; Anthropic Format</li>
            <li>100+ Model Aktif</li>
            <li>IP Whitelist Enterprise</li>
          </ul>

          <div className="dx-baseurl">
            <span className="dx-live-dot" aria-hidden="true" />
            <span className="dx-baseurl-label">Base URL</span>
            <code>{GATEWAY_BASE_URL}</code>
            <CopyButton text={GATEWAY_BASE_URL} label="Salin URL" />
          </div>
        </header>

        {/* MULAI CEPAT */}
        <section id="mulai-cepat" className="dx-section" data-dx-section>
          <h2>Mulai cepat</h2>
          <p>
            Cukup tiga langkah untuk menghubungkan terminal, editor kode, atau aplikasi produksi ke seluruh model AI
            melalui satu gerbang.
          </p>

          <ol className="dx-steps dx-steps-grid">
            <li>
              <strong>Daftar &amp; dapatkan API Key</strong>
              <span>
                <Link href="/signup">Buat akun</Link> lalu ajukan aktivasi token dari dashboard untuk memperoleh satu
                Universal API Key (<code>jt-live-...</code>).
              </span>
            </li>
            <li>
              <strong>Atur Base URL</strong>
              <span>
                Gunakan <code>{GATEWAY_BASE_URL}</code> pada SDK OpenAI, Cursor, VS Code, atau variabel environment CLI.
              </span>
            </li>
            <li>
              <strong>Pilih model &amp; jalankan</strong>
              <span>
                Uji langsung lewat workbench di bawah ini—ganti model tanpa mengganti kunci ataupun tagihan.
              </span>
            </li>
          </ol>
        </section>

        {/* INTEGRASI & CLI WORKBENCH */}
        <section id="integrasi" className="dx-section" data-dx-section>
          <h2>Integrasi &amp; CLI workbench</h2>
          <p>
            Pilih model target dan tool yang Anda gunakan. Seluruh contoh kode otomatis menyesuaikan dengan sintaks
            terminal Windows PowerShell, Windows CMD, macOS, dan Linux.
          </p>

          <div className="dx-workbench">
            <div className="dx-wb-block">
              <div className="dx-wb-label">1. Pilih model aktif</div>
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
            </div>

            <div className="dx-wb-block">
              <div className="dx-wb-label">2. Pilih tool atau SDK</div>
              <div className="dx-tabs" role="tablist" aria-label="Pilih tools integrasi">
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
            </div>

            {isCodeTool(tool) && (
              <div className="dx-wb-block">
                <div className="dx-wb-label">3. Sistem operasi terminal</div>
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
              </div>
            )}

            {snippet && (
              <div key={`${tool}-${os}`} className="dx-panel">
                <CodeBlock title={snippet.title} lang={snippet.lang} code={snippet.code} hot={model} />
                {snippet.note && <p className="dx-note">{snippet.note}</p>}
              </div>
            )}

            {tool === "cursor" && (
              <div key="cursor" className="dx-panel dx-gui-panel">
                <ol className="dx-steps">
                  <li>
                    Buka Cursor atau Windsurf, masuk ke <strong>Settings → Models</strong>.
                  </li>
                  <li>
                    Aktifkan <strong>OpenAI API Key</strong> lalu centang <strong>Override OpenAI Base URL</strong>.
                  </li>
                  <li>
                    Salin nilai Base URL, API Key, dan tambahkan model <code>{model}</code> di daftar model aktif.
                  </li>
                </ol>
                <ConfigCard
                  title="Konfigurasi Cursor / Windsurf"
                  fields={[
                    { label: "Override Base URL", value: GATEWAY_BASE_URL },
                    { label: "OpenAI API Key", value: "jt-live-kunci-anda" },
                    { label: "Custom Model ID", value: model },
                  ]}
                />
              </div>
            )}

            {tool === "cline" && (
              <div key="cline" className="dx-panel dx-gui-panel">
                <ol className="dx-steps">
                  <li>
                    Pasang ekstensi <strong>Cline</strong>, <strong>Roo Code</strong>, atau <strong>Continue</strong>{" "}
                    di VS Code.
                  </li>
                  <li>
                    Pada pengaturan <strong>API Provider</strong>, pilih <strong>OpenAI Compatible</strong>.
                  </li>
                  <li>
                    Isi Base URL, API Key, dan Model ID di bawah ini lalu klik <strong>Save</strong>.
                  </li>
                </ol>
                <ConfigCard
                  title="Konfigurasi VS Code (Cline / Roo Code)"
                  fields={[
                    { label: "API Provider", value: "OpenAI Compatible", copyable: false },
                    { label: "Base URL", value: GATEWAY_BASE_URL },
                    { label: "API Key", value: "jt-live-kunci-anda" },
                    { label: "Model ID", value: model },
                  ]}
                />
              </div>
            )}

            {tool === "chatbox" && (
              <div key="chatbox" className="dx-panel dx-gui-panel">
                <ol className="dx-steps">
                  <li>
                    Buka <strong>Chatbox</strong> (<code>web.chatboxai.app</code>) atau <strong>NextChat</strong> (
                    <code>app.nextchat.dev</code>), lalu masuk ke <strong>Settings</strong>.
                  </li>
                  <li>
                    Pilih Model Provider <strong>OpenAI</strong>.
                  </li>
                  <li>
                    Tempel <strong>API Host</strong> dan <strong>API Key</strong> di samping, lalu tambahkan model{" "}
                    <code>{model}</code>.
                  </li>
                </ol>
                <ConfigCard
                  title="Konfigurasi Chatbox / NextChat"
                  fields={[
                    { label: "Model Provider", value: "OpenAI API", copyable: false },
                    { label: "API Host", value: GATEWAY_ORIGIN },
                    { label: "API Key", value: "jt-live-kunci-anda" },
                    { label: "Model", value: model },
                  ]}
                />
              </div>
            )}
          </div>
        </section>

        {/* 1 KEY SEMUA AI */}
        <section id="satu-key" className="dx-section" data-dx-section>
          <h2>1 Key, semua AI</h2>
          <p>
            Satu kunci terhubung ke seluruh provider. Tidak ada SDK, akun, atau tagihan terpisah per vendor.
          </p>
          <div className="dx-cards">
            <article className="dx-card">
              <div className="dx-card-icon" aria-hidden="true">
                <Icon name="key" size={18} />
              </div>
              <h3>Ganti model, bukan kunci</h3>
              <p>
                Ubah parameter <code>model</code> untuk berpindah antar-provider dalam hitungan detik.
              </p>
            </article>
            <article className="dx-card">
              <div className="dx-card-icon" aria-hidden="true">
                <Icon name="bolt" size={18} />
              </div>
              <h3>Saldo IDR terpusat</h3>
              <p>Saldo dipotong per token nyata dan tidak hangus bulanan. Top-up masuk ke key yang sama.</p>
            </article>
            <article className="dx-card">
              <div className="dx-card-icon" aria-hidden="true">
                <Icon name="globe" size={18} />
              </div>
              <h3>Standard &amp; Enterprise</h3>
              <p>Fleksibel untuk developer, lengkap dengan IP Whitelist dan faktur pajak untuk perusahaan.</p>
            </article>
          </div>
        </section>

        {/* ENTERPRISE IP */}
        <section id="enterprise-ip" className="dx-section" data-dx-section>
          <h2>Keamanan &amp; IP Whitelist</h2>
          <p>
            IP Whitelist adalah daftar alamat IP yang diizinkan memakai sebuah API Key. Jika key bocor, request dari
            luar daftar langsung ditolak.
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
                  <td>
                    <span className="dx-tier-badge dx-tier-std">Standard</span>
                  </td>
                  <td>Kosong (default)</td>
                  <td>Key bisa dipakai dari jaringan mana saja: rumah, kafe, atau server.</td>
                </tr>
                <tr>
                  <td>
                    <span className="dx-tier-badge dx-tier-ent">Enterprise</span>
                  </td>
                  <td>Diisi IP kantor atau server</td>
                  <td>
                    Hanya IP terdaftar yang lolos. Format didukung: IPv4, <code>103.45.12.*</code>, dan CIDR{" "}
                    <code>/24</code>.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock
            title="Respons 403 untuk IP di luar whitelist"
            lang="json"
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
            Admin mengatur IP Whitelist per API Key lewat Panel Admin pada menu{" "}
            <strong>User Gmail &amp; API Key → IP / Tier</strong>.
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
                    <td>
                      <code>model</code>
                    </td>
                    <td>string</td>
                    <td>
                      ID model tujuan, misalnya <code>{model}</code>.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>messages</code>
                    </td>
                    <td>array</td>
                    <td>
                      Riwayat percakapan berisi <code>role</code> dan <code>content</code> (maksimal 200 pesan).
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>stream</code>
                    </td>
                    <td>boolean</td>
                    <td>
                      Jika <code>true</code>, respons dikirim sebagai Server-Sent Events.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>temperature</code>
                    </td>
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

          <div className="dx-model-toolbar">
            <div className="dx-search-wrap">
              <Icon name="search" size={16} />
              <input
                type="search"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Cari model ID atau provider (mis. claude, deepseek, gpt)..."
                aria-label="Cari model AI di dokumentasi"
              />
            </div>
            <div className="dx-cat-pills" role="tablist" aria-label="Filter kategori model">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={modelCat === cat}
                  className={`dx-cat-btn ${modelCat === cat ? "is-active" : ""}`}
                  onClick={() => {
                    setModelCat(cat);
                    setShowAllModels(false);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
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
                {visibleModels.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="dx-empty-row">
                      Tidak ada model yang cocok dengan pencarian &ldquo;{modelSearch}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  visibleModels.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="dx-model-cell">
                          <ProviderLogo provider={row.providerId} size={20} />
                          <code>{row.id}</code>
                          <CopyButton text={row.id} label="Salin" compact />
                        </div>
                      </td>
                      <td>{row.provider}</td>
                      <td>
                        <span className="dx-tag">{row.category}</span>
                      </td>
                      <td className="dx-num">Rp {row.per1k.toLocaleString("id-ID")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isSearching && filteredModels.length > 12 && (
            <div className="dx-showall-row">
              <button
                type="button"
                className="dx-showall-btn"
                onClick={() => setShowAllModels((v) => !v)}
              >
                {showAllModels
                  ? "Ringkas ke 12 model teratas"
                  : `Tampilkan semua ${filteredModels.length} model kurasi`}
              </button>
            </div>
          )}

          <p className="dx-note">
            Menampilkan kurasi utama web ({modelsCatalog.length} model). Daftar lengkap 100+ model tersedia di{" "}
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
                  <td>
                    <span className="dx-status-pill is-err">401</span>
                  </td>
                  <td>
                    <code>invalid_api_key</code>
                  </td>
                  <td>
                    Format atau kunci tidak ditemukan. Pastikan diawali <code>jt-live-</code> dan disalin utuh.
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="dx-status-pill is-warn">402</span>
                  </td>
                  <td>
                    <code>insufficient_quota</code>
                  </td>
                  <td>Saldo tidak cukup. Ajukan top-up dari dashboard untuk key yang sama.</td>
                </tr>
                <tr>
                  <td>
                    <span className="dx-status-pill is-err">403</span>
                  </td>
                  <td>
                    <code>ip_not_whitelisted_or_inactive</code>
                  </td>
                  <td>Key nonaktif atau IP pemanggil tidak ada di whitelist Enterprise.</td>
                </tr>
                <tr>
                  <td>
                    <span className="dx-status-pill is-warn">429</span>
                  </td>
                  <td>
                    <code>rate_limit_exceeded</code>
                  </td>
                  <td>
                    Batas laju tercapai (60 req/menit model umum, 20 req/menit model frontier). Beri jeda singkat.
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="dx-status-pill is-srv">503</span>
                  </td>
                  <td>
                    <code>upstream_overloaded</code>
                  </td>
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
