// Serverless function untuk simpan/ambil Discord Webhook URL
// Disimpan di Redis supaya sync semua device, tidak perlu isi ulang.

const REDIS_KEY = "roblox-monitor:discord-webhook";

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

async function redisDel(key) {
  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const url = `${REDIS_URL}/del/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash DEL failed: ${res.status}`);
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({ error: "Redis belum terhubung." });
  }

  try {
    if (req.method === "GET") {
      let raw = await redisGet(REDIS_KEY);
      // Fix double-encoded: kalau nilai masih dibungkus tanda kutip, parse sekali lagi
      if (typeof raw === "string") {
        try { const parsed = JSON.parse(raw); if (typeof parsed === "string") raw = parsed; } catch {}
      }
      return res.status(200).json({ url: raw || "" });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const url = typeof body?.url === "string" ? body.url.trim() : "";
      if (!url) return res.status(400).json({ error: "URL tidak boleh kosong" });
      await redisSet(REDIS_KEY, url);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      await redisDel(REDIS_KEY);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
};
