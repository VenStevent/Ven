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

async function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchPresence(userIds) {
  const res = await fetchWithTimeout(ROBLOX_PRESENCE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds }),
  }, 8000);
  if (!res.ok) throw new Error(`Roblox presence failed: ${res.status}`);
  const data = await res.json();
  return data.userPresences || [];
}

async function fetchUserInfo(userId) {
  try {
    const res = await fetchWithTimeout(`${ROBLOX_USER_URL}/${userId}`, {}, 5000);
    if (!res.ok) return { name: String(userId), displayName: String(userId) };
    return res.json();
  } catch (e) {
    // Timeout atau request gagal -> jangan sampai menggantung seluruh cron run,
    // pakai fallback nama supaya proses lain (lastSeen, log) tetap tersimpan.
    return { name: String(userId), displayName: String(userId) };
  }
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

    let prevPresence = rawPrev ? JSON.parse(rawPrev) : {};
    let lastSeen = rawLastSeen ? JSON.parse(rawLastSeen) : {};
    const log = rawLog ? JSON.parse(rawLog) : [];
    const webhookUrl = rawWebhook || "";

    // PENTING: prevPresence & lastSeen dulu tidak pernah dibersihkan dari
    // userId yang sudah dihapus dari daftar akun (ids). Setiap kali akun
    // ditambah/hapus/testing berulang, entri lama numpuk terus selamanya di
    // key ini sampai akhirnya melebihi limit payload Upstash REST API ->
    // "SET failed: 413". Fix: prune keduanya supaya cuma berisi userId yang
    // masih aktif di daftar akun sekarang.
    const idSet = new Set(ids.map(String));
    const prevSize = Object.keys(prevPresence).length;
    const lastSeenSize = Object.keys(lastSeen).length;
    prevPresence = Object.fromEntries(
      Object.entries(prevPresence).filter(([uid]) => idSet.has(String(uid)))
    );
    lastSeen = Object.fromEntries(
      Object.entries(lastSeen).filter(([uid]) => idSet.has(String(uid)))
    );
    // Kalau pruning beneran membuang sesuatu, paksa simpan walau tidak ada
    // perubahan presence di run ini — supaya key yang sudah kebesaran di
    // Redis langsung mengecil di SET pertama setelah fix ini di-deploy.
    let pruned = prevSize !== Object.keys(prevPresence).length ||
                 lastSeenSize !== Object.keys(lastSeen).length;

    // Fetch presence dari Roblox
    const presences = await fetchPresence(ids);

    const now = new Date().toISOString();
    const newLog = [...log];
    let changed = false;

    // Tahap 1: deteksi semua perubahan presence dulu (tanpa network call lain),
    // supaya cepat dan tidak ada await berurutan di sini.
    const transitions = []; // akun yang berubah status (perlu fetchUserInfo)
    const freshOffline = []; // akun baru yang baru pertama dicek & sudah offline

    for (const p of presences) {
      const userId = p.userId;
      const currentPresence = p.userPresenceType;
      const prevP = prevPresence[userId];

      if (prevP !== undefined && prevP !== currentPresence) {
        transitions.push({ userId, currentPresence, lastLocation: p.lastLocation || null });
      } else if (prevP === undefined && currentPresence === 0 && lastSeen[userId] === undefined) {
        freshOffline.push(userId);
        changed = true;
      }

      prevPresence[userId] = currentPresence;
    }

    // Tahap 2: ambil info nama untuk SEMUA akun yang berubah status SEKALIGUS
    // (paralel), bukan satu-satu di dalam loop. Dengan banyak akun (misal 24+)
    // yang berubah bersamaan, await berurutan bisa menumpuk jadi puluhan detik
    // dan kena timeout function di Vercel -> muncul sebagai 500 tanpa log sama
    // sekali (proses dimatikan paksa sebelum sampai ke catch/response).
    if (transitions.length) {
      const infos = await Promise.all(transitions.map(t => fetchUserInfo(t.userId)));

      for (let i = 0; i < transitions.length; i++) {
        const t = transitions[i];
        const info = infos[i];

        newLog.unshift({
          userId: t.userId,
          name: info.name,
          displayName: info.displayName,
          presence: t.currentPresence,
          game: t.lastLocation,
          time: now,
        });

        if (t.currentPresence === 0) {
          lastSeen[t.userId] = now;
        }
        changed = true;
      }

      // Notif Discord juga dikirim paralel, tidak satu-satu.
      const offlineNotifs = transitions
        .map((t, i) => ({ t, info: infos[i] }))
        .filter(({ t }) => t.currentPresence === 0);
      await Promise.all(
        offlineNotifs.map(({ t, info }) =>
          sendDiscordNotif(webhookUrl, { userId: t.userId, name: info.name, displayName: info.displayName })
        )
      );
    }

    for (const userId of freshOffline) {
      lastSeen[userId] = now;
    }

    // Simpan perubahan ke Redis. PREV_PRESENCE_KEY selalu disimpan (baik karena
    // ada perubahan presence maupun karena pruning di atas membuang entri lama).
    const saves = [redisSet(PREV_PRESENCE_KEY, JSON.stringify(prevPresence))];
    if (changed || pruned) {
      saves.push(redisSet(LASTSEEN_KEY, JSON.stringify(lastSeen)));
    }
    if (changed) {
      saves.push(redisSet(LOG_KEY, JSON.stringify(newLog.slice(0, MAX_LOG))));
    }
    await Promise.all(saves);

    return res.status(200).json({
      ok: true,
      checked: ids.length,
      changed,
      pruned,
      prevPresenceSize: Object.keys(prevPresence).length,
      lastSeenSize: Object.keys(lastSeen).length,
      time: now,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
};
