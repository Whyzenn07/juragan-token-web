"use client";

import type { Order } from "@/lib/store";

const formatIdr = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export function InvoiceDocument({
  order,
  linkedKeyMasked,
}: {
  order: Order;
  linkedKeyMasked?: string;
}) {
  const statusLabel =
    order.status === "paid"
      ? "LUNAS"
      : order.status === "pending"
      ? "MENUNGGU VERIFIKASI"
      : "KADALUWARSA";

  const statusClass =
    order.status === "paid"
      ? "is-paid"
      : order.status === "pending"
      ? "is-pending"
      : "is-expired";

  return (
    <article className="jt-invoice-sheet adm-print-invoice" aria-label={`Invoice ${order.id}`}>
      {/* Header Perusahaan & Stempel Status */}
      <div className="jt-invoice-top">
        <div className="jt-invoice-brand-col">
          <div className="jt-invoice-brand-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-mark.png" alt="" width={28} height={24} />
            <span className="jt-auth-brand-text">
              juragan<span>token.</span>
            </span>
          </div>
          <p className="jt-invoice-issuer-name">PT Rejeki Digital Cemerlang</p>
          <p className="jt-invoice-issuer-sub">
            Universal AI Gateway Indonesia · www.juragantoken.co.id
          </p>
        </div>

        <div className="jt-invoice-status-col">
          <span className="jt-invoice-doc-kicker">INVOICE &amp; KWITANSI</span>
          <strong className="jt-invoice-id">{order.id}</strong>
          <span className={`jt-invoice-seal ${statusClass}`}>{statusLabel}</span>
        </div>
      </div>

      {/* Metadata Penagihan 2 Kolom */}
      <div className="jt-invoice-parties">
        <div className="jt-invoice-party-box">
          <span className="jt-invoice-box-label">Ditagihkan Kepada</span>
          <strong className="jt-invoice-party-name">{order.customerName}</strong>
          <span className="jt-invoice-party-line jt-mono">{order.customerEmail}</span>
          {order.customerPhone && (
            <span className="jt-invoice-party-line">WhatsApp: {order.customerPhone}</span>
          )}
          {(order.companyName || order.department) && (
            <span className="jt-invoice-party-line">
              {[order.companyName, order.department].filter(Boolean).join(" · ")}
            </span>
          )}
          {order.npwp && <span className="jt-invoice-party-line jt-mono">NPWP: {order.npwp}</span>}
          {order.requiresTaxInvoice && (
            <span className="jt-invoice-tax-tag">Permintaan Faktur Pajak Resmi</span>
          )}
        </div>

        <div className="jt-invoice-party-box">
          <span className="jt-invoice-box-label">Detail Transaksi</span>
          <dl className="jt-invoice-dl">
            <div>
              <dt>Tanggal Terbit</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt>Waktu Lunas</dt>
              <dd>{order.paidAt ? formatDate(order.paidAt) : "Belum diselesaikan"}</dd>
            </div>
            <div>
              <dt>Metode Bayar</dt>
              <dd>{order.methodName}</dd>
            </div>
            <div>
              <dt>Referensi</dt>
              <dd className="jt-mono">
                {order.paymentReference || order.gatewayReference || "Manual / Verifikasi Admin"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Tabel Rincian Item */}
      <div className="jt-invoice-table-wrap">
        <table className="jt-invoice-table">
          <thead>
            <tr>
              <th>Deskripsi Layanan</th>
              <th>Jalur</th>
              <th className="is-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="jt-cell-stack">
                  <span className="jt-cell-primary">{order.packageName}</span>
                  <span className="jt-cell-muted">
                    {order.estPackage || "Saldo kredit Universal API Gateway 100+ Model AI"}
                  </span>
                </div>
              </td>
              <td>
                <span className="jt-invoice-tier-pill">
                  {order.accountTier === "enterprise" ? "Enterprise B2B" : "Standard"}
                </span>
              </td>
              <td className="is-right jt-num">{formatIdr(order.baseIdr)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ringkasan Total */}
      <div className="jt-invoice-summary">
        <div className="jt-invoice-sum-row">
          <span>Subtotal Kredit Token</span>
          <span className="jt-num">{formatIdr(order.baseIdr)}</span>
        </div>
        <div className="jt-invoice-sum-row">
          <span>Biaya Layanan</span>
          <span className="jt-num">{formatIdr(order.feeIdr || 0)}</span>
        </div>
        <div className="jt-invoice-sum-row is-total">
          <span>Total Pembayaran</span>
          <strong className="jt-num">{formatIdr(order.totalIdr)}</strong>
        </div>
      </div>

      {/* Footer Integrasi & Bukti */}
      <div className="jt-invoice-footer">
        <div className="jt-invoice-foot-item">
          <span>API Key Terhubung</span>
          <strong className="jt-mono">
            {linkedKeyMasked ||
              (order.status === "paid" ? "Aktif di Portal Pengguna" : "Diterbitkan setelah lunas")}
          </strong>
        </div>
        <div className="jt-invoice-foot-item">
          <span>Bukti Transaksi (SS)</span>
          <strong>
            {order.paymentProofUrl
              ? `Terlampir${order.paymentProofName ? ` · ${order.paymentProofName}` : ""}`
              : "Belum dilampirkan"}
          </strong>
        </div>
      </div>

      {order.adminNotes && (
        <div className="jt-invoice-note">
          <span>Catatan:</span> {order.adminNotes}
        </div>
      )}

      <p className="jt-invoice-legal">
        Dokumen ini diterbitkan secara elektronik oleh sistem Juragantoken (PT Rejeki Digital Cemerlang) dan sah sebagai bukti transaksi resmi.
      </p>
    </article>
  );
}
