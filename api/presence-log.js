// Serverless function untuk simpan/ambil lastSeen dan log on/off per akun

const LASTSEEN_KEY = "roblox-monitor:lastseen";
const LOG_KEY = "roblox-monitor:presence-log";
const MAX_LOG = 100;

async function redisGet(key) {
  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
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
  if (!res.ok) throw new Error(`SET failed: ${res.status}`);
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: "Redis belum terhubung." });

  try {
    // GET — ambil lastSeen map dan log
    if (req.method === "GET") {
      const [rawLastSeen, rawLog] = await Promise.all([
        redisGet(LASTSEEN_KEY),
        redisGet(LOG_KEY),
      ]);
      const lastSeen = rawLastSeen ? JSON.parse(rawLastSeen) : {};
      const log = rawLog ? JSON.parse(rawLog) : [];
      return res.status(200).json({ lastSeen, log });
    }

    // POST — catat perubahan status akun
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { userId, name, displayName, presence, game, time } = body || {};

      if (!userId) return res.status(400).json({ error: "userId diperlukan" });

      const rawLog = await redisGet(LOG_KEY);
      const log = rawLog ? JSON.parse(rawLog) : [];

      const now = time || new Date().toISOString();

      // CATATAN: lastSeen TIDAK ditulis di sini lagi. cron.js (api/cron.js) adalah
      // satu-satunya penulis lastSeen, supaya tidak ada dua proses (cron + tab
      // browser) saling override lastSeen lewat read-modify-write tanpa lock.
      // Endpoint ini hanya bertugas mencatat log presence dari sisi frontend.

      // Tambah ke log (max 100 entri)
      const entry = { userId, name, displayName, presence, game: game || null, time: now };
      const newLog = [entry, ...log].slice(0, MAX_LOG);
      await redisSet(LOG_KEY, JSON.stringify(newLog));

      // lastSeen tetap dikembalikan (read-only) supaya frontend bisa langsung
      // update tampilan tanpa nunggu cron berikutnya, tapi tidak ditulis ulang.
      const rawLastSeen = await redisGet(LASTSEEN_KEY);
      const lastSeen = rawLastSeen ? JSON.parse(rawLastSeen) : {};

      return res.status(200).json({ ok: true, lastSeen: lastSeen[userId] || null });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
};
