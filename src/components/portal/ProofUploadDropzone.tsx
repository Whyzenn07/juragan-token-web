"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Props = {
  value?: string;
  fileName?: string;
  onChange: (next: { url: string | null; fileName?: string }) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
};

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_RAW_BYTES = 10 * 1024 * 1024;
const MAX_WIDTH = 1280;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar rusak atau format tidak didukung."));
    img.src = src;
  });
}

async function compressProofImage(file: File): Promise<string> {
  const rawUrl = await readFileAsDataUrl(file);
  const img = await loadImage(rawUrl);

  const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser tidak mendukung pemrosesan gambar.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  if (file.type === "image/png") {
    const pngUrl = canvas.toDataURL("image/png");
    if (pngUrl.length <= 450_000) return pngUrl;
  }

  const webpOrJpg = canvas.toDataURL("image/jpeg", 0.84);
  if (webpOrJpg.length <= 1_100_000) return webpOrJpg;
  return canvas.toDataURL("image/jpeg", 0.68);
}

export function ProofUploadDropzone({
  value,
  fileName,
  onChange,
  disabled = false,
  label = "Unggah Screenshot (SS) Bukti Pembayaran",
  hint = "Format PNG, JPG/JPEG, atau WebP (maks. 10 MB, otomatis dikompresi agar cepat).",
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file || disabled) return;
    setError(null);

    if (!ALLOWED_MIME.has(file.type.toLowerCase())) {
      setError("Format file tidak didukung. Gunakan tangkapan layar PNG, JPG/JPEG, atau WebP.");
      return;
    }
    if (file.size > MAX_RAW_BYTES) {
      setError("Ukuran file melebihi batas 10 MB.");
      return;
    }

    setProcessing(true);
    try {
      const compressedUrl = await compressProofImage(file);
      onChange({ url: compressedUrl, fileName: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses gambar.");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="jt-dropzone-wrap">
      <div className="jt-dropzone-head">
        <label htmlFor={inputId} className="jt-dropzone-label">
          {label}
        </label>
        {hint && <span className="jt-dropzone-hint">{hint}</span>}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="jt-sr-only"
        disabled={disabled || processing}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
        }}
      />

      {value ? (
        <div className="jt-dropzone-preview">
          <div className="jt-dropzone-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={fileName || "Pratinjau bukti transaksi"} />
          </div>
          <div className="jt-dropzone-meta">
            <strong className="jt-dropzone-fname">{fileName || "bukti-pembayaran.png"}</strong>
            <span className="jt-dropzone-ready">
              <Icon name="check" size={13} />
              <span>Siap dilampirkan pada transaksi</span>
            </span>
            <div className="jt-dropzone-btns">
              <button
                type="button"
                className="jt-btn-secondary-clean"
                disabled={disabled || processing}
                onClick={() => inputRef.current?.click()}
              >
                {processing ? "Memproses..." : "Ganti Gambar"}
              </button>
              <button
                type="button"
                className="jt-btn-danger-ghost"
                disabled={disabled || processing}
                onClick={() => {
                  setError(null);
                  onChange({ url: null });
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          className={`jt-dropzone-area ${dragOver ? "is-dragover" : ""} ${disabled ? "is-disabled" : ""}`}
          onClick={() => {
            if (!disabled && !processing) inputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled && !processing) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <div className="jt-dropzone-icon" aria-hidden="true">
            <Icon name="plus" size={18} />
          </div>
          <div className="jt-dropzone-copy">
            <strong>{processing ? "Mengompresi gambar..." : "Pilih atau seret file SS pembayaran ke sini"}</strong>
            <span>Screenshot m-Banking, QRIS berhasil, atau e-wallet (PNG, JPG, WebP)</span>
          </div>
        </div>
      )}

      {error && (
        <p className="jt-dropzone-err" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
