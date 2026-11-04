/** Centang sukses gaya aplikasi GoPay & QRIS: full background hijau dengan centang putih */
export function PaymentSuccessMark({ size = 76 }: { size?: number }) {
  return (
    <div
      className="qris-success-badge"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #10b981, #059669)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 25px rgba(16, 185, 129, 0.38)",
        margin: "0 auto 16px",
        flexShrink: 0,
      }}
      role="img"
      aria-label="Pembayaran berhasil"
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.52}
        height={size * 0.52}
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}
