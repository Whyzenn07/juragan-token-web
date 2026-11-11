const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svg = `
<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="badgeGrad" x1="50" y1="50" x2="190" y2="190" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00b37e" />
      <stop offset="100%" stop-color="#009366" />
    </linearGradient>
    <filter id="glow" x="15" y="15" width="210" height="210" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#00b37e" flood-opacity="0.42" />
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#009366" flood-opacity="0.22" />
    </filter>
  </defs>

  <!-- Outer Soft Translucent Ripple Wave 1 (Identical to qris-ripple-wave) -->
  <circle cx="120" cy="120" r="112" fill="#00b37e" fill-opacity="0.12" />

  <!-- Middle Soft Translucent Ripple Wave 2 (Identical to qris-ripple-delay) -->
  <circle cx="120" cy="120" r="98" fill="#00b37e" fill-opacity="0.22" />

  <!-- Main Solid Emerald Circle (Identical to qris-success-badge: 135deg gradient) -->
  <circle cx="120" cy="120" r="82" fill="url(#badgeGrad)" filter="url(#glow)" />

  <!-- Precision Rounded Checkmark (Identical geometry to PaymentSuccessMark M14.5 27.5 L22.5 35.5 L38.5 19.5) -->
  <path d="M97.7 122.9 L113.2 138.4 L144.2 107.4" 
        stroke="#ffffff" 
        stroke-width="10.8" 
        stroke-linecap="round" 
        stroke-linejoin="round" />
</svg>
`;

const outDir = path.join(__dirname, "..", "public", "assets", "email");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "success-check-badge.png");

sharp(Buffer.from(svg))
  .png({ quality: 100 })
  .toFile(outPath)
  .then((info) => {
    console.log("Badge generated successfully:", outPath, info);
  })
  .catch((err) => {
    console.error("Error generating badge:", err);
    process.exit(1);
  });
