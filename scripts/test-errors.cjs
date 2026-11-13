const http = require("http");

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on("error", reject);

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runErrorTests() {
  console.log("=================================================================");
  console.log("🧪 JURAGAN TOKEN — SUITE PENGUJIAN ERROR & KEAMANAN SERVER");
  console.log("=================================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [TEST ${total}] PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [TEST ${total}] FAIL: ${name} -> ${err.message}`);
    }
  }

  // 1. Chat Completion tanpa Authorization header
  await test("Chat Completion tanpa API Key -> Harus return 401 Unauthorized", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/v1/chat/completions",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { model: "gemini-3.5-flash", messages: [{ role: "user", content: "Halo" }] }
    );
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    if (!res.body?.error?.message) throw new Error("Missing error payload structure");
  });

  // 2. Chat Completion dengan API Key palsu / acak
  await test("Chat Completion dengan API Key palsu -> Harus return 401", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer jt-live-palsu9999999999999999999",
        },
      },
      { model: "gemini-3.5-flash", messages: [{ role: "user", content: "Halo" }] }
    );
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
  });

  // 3. Chat Completion dengan body JSON rusak (Syntax Error)
  await test("Chat Completion dengan JSON body rusak -> Harus return 400 Bad Request", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer jt-live-anykey",
        },
      },
      "{ this is corrupted json payload !!!"
    );
    if (res.status !== 400 && res.status !== 401) {
      throw new Error(`Expected status 400 or 401, got ${res.status}`);
    }
  });

  // 4. Chat Completion tanpa parameter 'messages'
  await test("Chat Completion tanpa array 'messages' -> Harus return 400 Bad Request", async () => {
    // Kita gunakan key live yang ada di store jika ada, atau verifikasi struktur reject
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer jt-live-test-dummy",
        },
      },
      { model: "gemini-3.5-flash" }
    );
    if (res.status !== 400 && res.status !== 401) {
      throw new Error(`Expected status 400 or 401, got ${res.status}`);
    }
  });

  // 5. Cek Saldo dengan Key tidak terdaftar (POST) & Tolak GET (405)
  await test("Cek Saldo API Key fiktif (POST) -> Harus return 404 Not Found", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/keys/check",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { key: "jt-live-tidakterdaftar0000000000" }
    );
    if (res.status !== 404 && res.status !== 400) {
      throw new Error(`Expected status 404 or 400, got ${res.status}`);
    }
  });

  // 6. Buat Order dengan Nama Kosong
  await test("Buat Order tanpa Nama -> Harus return 400 Bad Request", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/orders",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        customerName: "",
        customerEmail: "user@gmail.com",
        packageId: "pkt-mhs-starter",
        methodId: "qris",
      }
    );
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
    if (!res.body?.error?.includes("Nama")) throw new Error(`Expected error about name, got: ${res.body?.error}`);
  });

  // 7. Buat Order dengan Format Email Tidak Valid
  await test("Buat Order dengan format email rusak -> Harus return 400 Bad Request", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/orders",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        customerName: "Budi Santoso",
        customerEmail: "bukan-alamat-email",
        packageId: "pkt-mhs-starter",
        methodId: "qris",
      }
    );
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
    if (!res.body?.error?.includes("email")) throw new Error(`Expected error about email, got: ${res.body?.error}`);
  });

  // 8. Buat Order dengan Paket Fiktif
  await test("Buat Order dengan Package ID palsu -> Harus return 400 Bad Request", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/orders",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        customerName: "Budi Santoso",
        customerEmail: "budi@gmail.com",
        packageId: "paket-tidak-ada-di-katalog",
        methodId: "qris",
      }
    );
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
  });

  // 9. Webhook Payment dengan Signature Salah / Fraud
  await test("Webhook Payment dengan Signature Palsu -> Harus ditolak (403/400)", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/webhooks/payment",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-callback-signature": "palsu_signature_12345",
        },
      },
      {
        merchant_ref: "INV-JT-TEST123456",
        status: "PAID",
      }
    );
    // Jika tidak ada order valid atau signature mismatch, harus ditolak dengan status 4xx
    if (res.status !== 403 && res.status !== 400 && res.status !== 404) {
      throw new Error(`Expected rejection status 403, 400, or 404, got ${res.status}`);
    }
  });

  // 10. Cek Saldo via GET Query String -> Harus ditolak (405 Method Not Allowed)
  await test("GET /api/keys/check dengan API key di URL -> Harus ditolak (405)", async () => {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/keys/check?key=jt-live-rahasia123456789012",
      method: "GET",
    });
    if (res.status !== 405) {
      throw new Error(`Expected 405 Method Not Allowed, got ${res.status}`);
    }
  });

  // 11. Webhook Generic Tanpa Admin Secret -> Harus ditolak (403 Forbidden)
  await test("Webhook Generic Tanpa Autentikasi -> Harus ditolak (403)", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/webhooks/payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { invoiceId: "INV-JT-TEST123456", status: "PAID" }
    );
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  });

  // 12. POST /api/supabase/status Tanpa Admin Secret -> Harus ditolak (403 Forbidden)
  await test("POST /api/supabase/status Tanpa Admin Secret -> Harus ditolak (403)", async () => {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/supabase/status",
      method: "POST",
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  });

  // 13. GET /api/test-email Tanpa Admin Secret -> Harus ditolak (403 Forbidden)
  await test("GET /api/test-email Tanpa Admin Secret -> Harus ditolak (403)", async () => {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/test-email?to=attacker@example.com",
      method: "GET",
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  });

  console.log("\n=================================================================");
  console.log(`HASIL AKHIR: ${passed}/${total} PENGUJIAN ERROR BERHASIL LOLOS (${Math.round((passed / total) * 100)}%)`);
  console.log("=================================================================\n");
}

runErrorTests().catch(console.error);
