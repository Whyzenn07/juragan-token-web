const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svg = `
<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="badgeGrad" x1="50" y1="50" x2="190" y2="190" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00c88f" />
      <stop offset="50%" stop-color="#00b37e" />
      <stop offset="100%" stop-color="#008a5d" />
    </linearGradient>
    <filter id="glow" x="20" y="20" width="200" height="200" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#00b37e" flood-opacity="0.38" />
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#008a5d" flood-opacity="0.22" />
    </filter>
  </defs>

  <!-- Outer Soft Translucent Ring Wave 1 -->
  <circle cx="120" cy="120" r="106" fill="#00b37e" fill-opacity="0.12" />

  <!-- Middle Soft Translucent Ring Wave 2 -->
  <circle cx="120" cy="120" r="88" fill="#00b37e" fill-opacity="0.22" />

  <!-- Main Solid Emerald Circle with Gradient and Fintech Shadow -->
  <circle cx="120" cy="120" r="70" fill="url(#badgeGrad)" filter="url(#glow)" />

  <!-- Precision Rounded Checkmark (Identical geometry to PaymentSuccessMark) -->
  <path d="M84 122 L108 146 L156 98" 
        stroke="#ffffff" 
        stroke-width="13" 
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
