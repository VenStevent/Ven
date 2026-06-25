// Serverless function untuk verifikasi & ganti PIN admin
// PIN disimpan di Redis

const REDIS_KEY = "roblox-monitor:admin-pin";

async function redisGet(key) {
  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash GET failed: ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function redisSet(key, value) {
  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
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
  const res = await fetch(`${REDIS_URL}/del/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash DEL failed: ${res.status}`);
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
  const { pin, action, oldPin, newPin } = body || {};

  try {
    const rawStoredPin = await redisGet(REDIS_KEY);
    let storedPin = null;
    if (rawStoredPin) {
      try { storedPin = JSON.parse(rawStoredPin); } catch { storedPin = rawStoredPin; }
    }

    // === SETUP: belum ada PIN, buat pertama kali ===
    if (!storedPin) {
      if (action === "setup") {
        if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: "PIN harus 4 angka" });
        await redisSet(REDIS_KEY, pin);
        return res.status(200).json({ ok: true, message: "PIN berhasil dibuat" });
      }
      return res.status(404).json({ error: "PIN belum diset", needsSetup: true });
    }

    // === GANTI PIN: hapus PIN lama dulu, lalu simpan PIN baru ===
    if (action === "change") {
      if (!oldPin || !/^\d{4}$/.test(oldPin)) return res.status(400).json({ error: "PIN lama harus 4 angka" });
      if (!newPin || !/^\d{4}$/.test(newPin)) return res.status(400).json({ error: "PIN baru harus 4 angka" });
      if (oldPin !== storedPin) return res.status(401).json({ error: "PIN lama salah" });
      // Hapus PIN lama dulu, baru simpan PIN baru
      await redisDel(REDIS_KEY);
      await redisSet(REDIS_KEY, newPin);
      return res.status(200).json({ ok: true, message: "PIN berhasil diubah" });
    }

    // === VERIFY: cek PIN biasa ===
    if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: "PIN harus 4 angka" });
    if (pin === storedPin) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(401).json({ error: "PIN salah" });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
};
