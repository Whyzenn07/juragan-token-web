/** Centang sukses gaya aplikasi pembayaran: lingkaran tergambar, lalu centang tergambar. Animasi sekali jalan (diatur di CSS). */
export function PaymentSuccessMark({ size = 84 }: { size?: number }) {
  return (
    <span className="pay-success-mark" style={{ width: size, height: size }} role="img" aria-label="Pembayaran berhasil">
      <svg viewBox="0 0 52 52" width={size} height={size} fill="none">
        <circle className="psm-circle" cx="26" cy="26" r="23" />
        <path className="psm-check" d="M15.5 27.5 22.5 34.5 37 18.5" />
      </svg>
    </span>
  );
}
