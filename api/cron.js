// Endpoint yang dipanggil oleh cron-job.org tiap 1 menit
// Fungsi: polling status semua akun Roblox, update lastSeen di Redis kalau ada yang offline

const ACCOUNTS_KEY = "roblox-monitor:shared-ids";
const LASTSEEN_KEY = "roblox-monitor:lastseen";
const LOG_KEY = "roblox-monitor:presence-log";
const PREV_PRESENCE_KEY = "roblox-monitor:prev-presence";
const MAX_LOG = 100;
const ROBLOX_PRESENCE_URL = "https://presence.roblox.com/v1/presence/users";
const ROBLOX_USER_URL = "https://users.roblox.com/v1/users";

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

async function fetchPresence(userIds) {
  const res = await fetch(ROBLOX_PRESENCE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds }),
  });
  if (!res.ok) throw new Error(`Roblox presence failed: ${res.status}`);
  const data = await res.json();
  return data.userPresences || [];
}

async function fetchUserInfo(userId) {
  const res = await fetch(`${ROBLOX_USER_URL}/${userId}`);
  if (!res.ok) return { name: String(userId), displayName: String(userId) };
  return res.json();
}

async function sendDiscordNotif(webhookUrl, account) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "🔴 Akun Offline",
          description: `**${account.displayName || account.name}** (@${account.name}) baru saja offline.`,
          color: 0x6b7280,
          fields: [{ name: "User ID", value: String(account.userId), inline: true }],
          timestamp: new Date().toISOString(),
        }]
      })
    });
  } catch (e) {}
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Opsional: proteksi dengan secret key supaya tidak bisa dipanggil sembarang orang
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers["x-cron-secret"] || req.query.secret;
    if (authHeader !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: "Redis belum terhubung." });

  try {
    // Ambil semua data yang diperlukan dari Redis
    const [rawIds, rawPrev, rawLastSeen, rawLog, rawWebhook] = await Promise.all([
      redisGet(ACCOUNTS_KEY),
      redisGet(PREV_PRESENCE_KEY),
      redisGet(LASTSEEN_KEY),
      redisGet(LOG_KEY),
      redisGet("roblox-monitor:discord-webhook"),
    ]);

    let ids = rawIds ? JSON.parse(rawIds) : [];
    if (typeof ids === "string") ids = JSON.parse(ids);
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(200).json({ ok: true, message: "Tidak ada akun untuk dicek" });
    }

    const prevPresence = rawPrev ? JSON.parse(rawPrev) : {};
    const lastSeen = rawLastSeen ? JSON.parse(rawLastSeen) : {};
    const log = rawLog ? JSON.parse(rawLog) : [];
    const webhookUrl = rawWebhook || "";

    // Fetch presence dari Roblox
    const presences = await fetchPresence(ids);

    const now = new Date().toISOString();
    const newLog = [...log];
    let changed = false;

    for (const p of presences) {
      const userId = p.userId;
      const currentPresence = p.userPresenceType;
      const prevP = prevPresence[userId];

      // Kalau ada perubahan status
      if (prevP !== undefined && prevP !== currentPresence) {
        // Ambil info nama akun
        const info = await fetchUserInfo(userId);

        const entry = {
          userId,
          name: info.name,
          displayName: info.displayName,
          presence: currentPresence,
          game: p.lastLocation || null,
          time: now,
        };

        newLog.unshift(entry);

        // Update lastSeen kalau berubah jadi offline
        if (currentPresence === 0) {
          lastSeen[userId] = now;
          // Kirim notif Discord
          await sendDiscordNotif(webhookUrl, { userId, name: info.name, displayName: info.displayName });
        }

        changed = true;
      }

      prevPresence[userId] = currentPresence;
    }

    // Simpan perubahan ke Redis
    const saves = [redisSet(PREV_PRESENCE_KEY, JSON.stringify(prevPresence))];
    if (changed) {
      saves.push(redisSet(LASTSEEN_KEY, JSON.stringify(lastSeen)));
      saves.push(redisSet(LOG_KEY, JSON.stringify(newLog.slice(0, MAX_LOG))));
    }
    await Promise.all(saves);

    return res.status(200).json({
      ok: true,
      checked: ids.length,
      changed,
      time: now,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
};
