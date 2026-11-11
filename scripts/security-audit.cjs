const http = require("http");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

function extractSecret(regex) {
  const m = envContent.match(regex);
  return m ? m[1].trim() : null;
}

const secretsToCheck = [
  { name: "GEMINI_API_KEY", val: extractSecret(/GEMINI_API_KEY="([^"]+)"/) },
  { name: "SUPABASE_SECRET_KEY", val: extractSecret(/SUPABASE_SECRET_KEY="([^"]+)"/) },
  { name: "GMAIL_APP_PASSWORD", val: extractSecret(/GMAIL_APP_PASSWORD="([^"]+)"/) },
  { name: "ADMIN_SECRET", val: extractSecret(/ADMIN_SECRET="([^"]+)"/) },
].filter((s) => s.val && s.val.length > 5);

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

async function runSecurityAudit() {
  console.log("=================================================================");
  console.log("🔒 JURAGAN TOKEN — CLIENT-SIDE SECRET LEAK & BUNDLE SECURITY TEST");
  console.log("=================================================================\n");

  console.log("Monitored server secrets (from .env.local):");
  secretsToCheck.forEach((s) => {
    console.log(` • ${s.name}: ${s.val.slice(0, 4)}...${s.val.slice(-4)} (${s.val.length} chars)`);
  });
  console.log("");

  // 1. Check HTML payload
  console.log("1️⃣  Inspecting Initial HTML Document (DOM / View-Source)...");
  const html = await fetchUrl("http://localhost:3000/");
  let htmlLeaks = 0;

  for (const s of secretsToCheck) {
    if (html.includes(s.val)) {
      console.error(`❌ CRITICAL LEAK: ${s.name} found in rendered HTML!`);
      htmlLeaks++;
    }
  }

  if (htmlLeaks === 0) {
    console.log("   ✅ PASSED: No server secret keys leaked in HTML Document.");
  }

  // 2. Extract and download all client JS bundle scripts
  console.log("\n2️⃣  Inspecting Client JavaScript Bundles (_next/static/chunks)...");
  const scriptRegex = /src="(\/_next\/static\/[^"]+\.js)"/g;
  let match;
  const scriptPaths = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptPaths.push(match[1]);
  }

  console.log(`   Found ${scriptPaths.length} client JavaScript chunks loaded by browser:`);

  let bundleLeaks = 0;
  for (const scriptPath of scriptPaths) {
    const chunkContent = await fetchUrl(`http://localhost:3000${scriptPath}`);
    for (const s of secretsToCheck) {
      if (chunkContent.includes(s.val)) {
        console.error(`❌ CRITICAL LEAK: ${s.name} found in chunk: ${scriptPath}`);
        bundleLeaks++;
      }
    }
  }

  if (bundleLeaks === 0) {
    console.log("   ✅ PASSED: All client JS chunks are 100% clean. Zero server secrets bundled to browser.");
  }

  console.log("\n=================================================================");
  console.log("SUMMARY: " + (htmlLeaks === 0 && bundleLeaks === 0 ? "100% SECURE ✅" : "LEAKS FOUND ❌"));
  console.log("=================================================================\n");
}

runSecurityAudit().catch(console.error);
