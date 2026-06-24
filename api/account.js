// Serverless function (Vercel) untuk simpan/ambil daftar User ID Roblox secara bersama (shared)
// menggunakan Upstash Redis. Environment variables UPSTASH_REDIS_REST_URL dan
// UPSTASH_REDIS_REST_TOKEN otomatis tersedia setelah menghubungkan Upstash dari
// Vercel Marketplace ke project ini (Storage -> Marketplace Database Providers -> Upstash).

const REDIS_KEY = "roblox-monitor:shared-ids";

async function redisGet(key) {
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash GET failed: ${res.status}`);
  const data = await res.json();
  return data.result; // string atau null
}

async function redisSet(key, value) {
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`Upstash SET failed: ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  // Izinkan dipanggil dari domain manapun (app ini publik/dipakai bersama tanpa auth)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(500).json({
      error: "Upstash belum terhubung. Tambahkan Upstash Redis dari Vercel Marketplace ke project ini.",
    });
  }

  try {
    if (req.method === "GET") {
      const raw = await redisGet(REDIS_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      return res.status(200).json({ ids });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const ids = Array.isArray(body?.ids) ? body.ids.filter(n => Number.isFinite(n)) : [];
      await redisSet(REDIS_KEY, JSON.stringify(ids));
      return res.status(200).json({ ok: true, ids });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
