// Serverless function (Vercel) untuk simpan/ambil daftar User ID Roblox secara bersama (shared)
// menggunakan Upstash Redis.
//
// Mendukung dua konvensi nama environment variable:
//   - UPSTASH_REDIS_REST_URL  + UPSTASH_REDIS_REST_TOKEN  (Upstash native / manual)
//   - KV_REST_API_URL         + KV_REST_API_TOKEN          (Vercel KV / Upstash via Marketplace)
//
// Salah satu dari keduanya cukup — kode otomatis memilih yang tersedia.

const REDIS_KEY = "roblox-monitor:shared-ids";

// Resolusi env var: coba konvensi Vercel KV dulu, fallback ke Upstash native
const REDIS_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL;

const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
  const url = `${REDIS_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash GET failed: ${res.status}`);
  const data = await res.json();
  return data.result; // string atau null
}

async function redisSet(key, value) {
  const url = `${REDIS_URL}/set/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
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

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({
      error:
        "Redis belum terhubung. Pastikan salah satu pasangan env var berikut sudah diset di Vercel:\n" +
        "• KV_REST_API_URL + KV_REST_API_TOKEN  (Vercel KV / Upstash via Marketplace)\n" +
        "• UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN  (Upstash native)",
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
