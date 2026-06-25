// Serverless function untuk verifikasi PIN admin
// PIN disimpan di Redis sebagai hash sederhana

const REDIS_KEY = "roblox-monitor:admin-pin";

async function redisGet(key) {
  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const url = `${REDIS_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash GET failed: ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function redisSet(key, value) {
  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
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

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: "Redis belum terhubung." });

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { pin, action } = body || {};

  if (!pin || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: "PIN harus 4 angka" });
  }

  try {
    const storedPin = await redisGet(REDIS_KEY);

    // Kalau belum ada PIN tersimpan, pin pertama yang masuk jadi PIN admin
    if (!storedPin) {
      if (action === "setup") {
        await redisSet(REDIS_KEY, pin);
        return res.status(200).json({ ok: true, message: "PIN berhasil dibuat" });
      }
      return res.status(404).json({ error: "PIN belum diset", needsSetup: true });
    }

    // Verifikasi PIN
    if (pin === storedPin) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(401).json({ error: "PIN salah" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
};
