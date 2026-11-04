/** Centang sukses gaya aplikasi GoPay & QRIS: full background hijau dengan centang putih beranimasi halus */
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
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          className="qris-check-animated"
          pathLength={100}
          d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
        />
      </svg>
    </div>
  );
}
