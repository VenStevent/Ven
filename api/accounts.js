// Serverless function untuk simpan/ambil daftar User ID Roblox
// POST & DELETE wajib menyertakan PIN admin yang valid

const REDIS_KEY      = "roblox-monitor:shared-ids";
const REDIS_PIN_KEY  = "roblox-monitor:admin-pin";

async function redisGet(key) {
  const REDIS_URL   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash GET failed: ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function redisSet(key, value) {
  const REDIS_URL   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`Upstash SET failed: ${res.status}`);
  return res.json();
}

async function verifyPin(pin) {
  const raw = await redisGet(REDIS_PIN_KEY);
  if (!raw) return false;
  let stored = raw;
  try { stored = JSON.parse(raw); } catch {}
  return pin === stored;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const REDIS_URL   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: "Redis belum terhubung." });

  try {
    // GET — boleh siapa saja (hanya baca)
    if (req.method === "GET") {
      const raw = await redisGet(REDIS_KEY);
      let ids = raw ? JSON.parse(raw) : [];
      if (typeof ids === "string") ids = JSON.parse(ids);
      if (!Array.isArray(ids)) ids = [];
      return res.status(200).json({ ids });
    }

    // POST — wajib PIN admin
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { ids, pin } = body || {};

      if (!pin || !/^\d{4}$/.test(pin)) return res.status(401).json({ error: "PIN wajib disertakan" });
      const ok = await verifyPin(pin);
      if (!ok) return res.status(401).json({ error: "PIN salah" });

      const safeIds = Array.isArray(ids) ? ids.filter(n => Number.isFinite(n)) : [];
      await redisSet(REDIS_KEY, safeIds);
      return res.status(200).json({ ok: true, ids: safeIds });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
};
