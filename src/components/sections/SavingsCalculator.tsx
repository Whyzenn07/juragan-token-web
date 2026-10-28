"use client";

import { useId, useState } from "react";

export function SavingsCalculator({ onSelectRecommended }: { onSelectRecommended: () => void }) {
  const [tasksPerDay, setTasksPerDay] = useState<number>(20);
  const sliderId = useId();

  // Estimasi token per tugas/tanya: ~1.500 token (input prompt + output jawaban)
  const monthlyTokens = tasksPerDay * 30 * 1500; // contoh: 20 * 30 * 1500 = 900.000 token
  
  // Model campuran hemat (DeepSeek V3, Kimi, Qwen, Claude): rata-rata Rp 18.000 per 1M token
  const estimatedTokenCostIdr = Math.max(15000, Math.round((monthlyTokens / 1_000_000) * 28000));
  
  // Langganan resmi 2 platform (ChatGPT Plus $20 + Claude Pro $20 = $40 ~ Rp 650.000)
  const officialSubCostIdr = 650000;
  
  const savedAmountIdr = officialSubCostIdr - estimatedTokenCostIdr;
  const savingsPercent = Math.round((savedAmountIdr / officialSubCostIdr) * 100);
  const lunchPortions = Math.round(savedAmountIdr / 18000); // estimasi makan siang kantin Rp 18k

  const formatIdr = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="calculator-card" id="kalkulator-hemat" data-reveal>
      <div className="calc-header">
        <span className="badge-pill">Kalkulator Hemat Kantong Mahasiswa</span>
        <h3>Berapa uang jajan yang bisa Anda hemat tiap bulan?</h3>
        <p className="calc-subtitle">
          Bandingkan biaya jika Anda harus langganan kartu kredit resmi versus beli saldo token ritel via SingaPay.
        </p>
      </div>

      <div className="calc-slider-box">
        <div className="slider-label-row">
          <label htmlFor={sliderId}>Intensitas pemakaian AI Anda:</label>
          <strong>{tasksPerDay} pertanyaan / sesi per hari</strong>
        </div>
        <input
          id={sliderId}
          type="range"
          min="5"
          max="80"
          step="5"
          value={tasksPerDay}
          onChange={(e) => setTasksPerDay(Number(e.target.value))}
          className="calc-range-slider"
          aria-label="Intensitas pertanyaan per hari"
        />
        <div className="slider-ticks">
          <span>Santai (5/hari)</span>
          <span>Tugas Rutin (20/hari)</span>
          <span>Sprint Skripsi & Koding (50+/hari)</span>
        </div>
      </div>

      <div className="calc-comparison-grid">
        <div className="calc-col official">
          <p className="col-label">Jika Langganan Resmi (ChatGPT Plus + Claude Pro)</p>
          <strong className="cost-strike">{formatIdr(officialSubCostIdr)}</strong>
          <span className="col-note">Wajib kartu kredit internasional, tagihan berulang tiap bulan meski jarang terpakai.</span>
        </div>

        <div className="calc-col juragan">
          <div className="singapay-tag">Bayar QRIS SingaPay</div>
          <p className="col-label">Pakai Token Prabayar Juragan Token</p>
          <strong className="cost-highlight">{formatIdr(estimatedTokenCostIdr)}</strong>
          <span className="col-note">Hanya bayar token yang Anda konsumsi. Saldo tidak pernah hangus!</span>
        </div>
      </div>

      <div className="calc-result-banner">
        <div className="result-text">
          <strong>Hemat {formatIdr(savedAmountIdr)} / bulan ({savingsPercent}% Lebih Irit)</strong>
          <p>
            Uang yang Anda hemat setara dengan <b>±{lunchPortions} porsi makan siang di kantin</b>.
          </p>
        </div>
        <button className="button-accent" onClick={onSelectRecommended}>
          Mulai dari Rp 15 Ribu
        </button>
      </div>
    </div>
  );
}
