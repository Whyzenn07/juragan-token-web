/**
 * Centang sukses dinamis gaya fintech (GoPay / QRIS / Apple Pay):
 * Background hijau solid, efek ripple wave, animasi centang menggambar (stroke draw),
 * dan sentakan pegas (spring kick) yang membuat centang bergerak hidup saat pembayaran sukses.
 */
export function PaymentSuccessMark({ size = 78 }: { size?: number }) {
  return (
    <div className="qris-success-wrapper" style={{ width: size + 26, height: size + 26 }}>
      {/* Wave pulse ripples */}
      <span className="qris-ripple-wave" />
      <span className="qris-ripple-wave qris-ripple-delay" />

      {/* Main Solid Green Badge */}
      <div
        className="qris-success-badge"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00b37e 0%, #009366 100%)",
          boxShadow: "0 14px 34px rgba(0, 179, 126, 0.42), 0 4px 12px rgba(0, 147, 102, 0.22)",
        }}
        role="img"
        aria-label="Pembayaran berhasil"
      >
        <svg
          viewBox="0 0 52 52"
          width={size * 0.56}
          height={size * 0.56}
          fill="none"
          className="qris-success-svg"
        >
          <path
            className="qris-check-stroke"
            d="M14.5 27.5 L22.5 35.5 L38.5 19.5"
          />
        </svg>
      </div>
    </div>
  );
}
