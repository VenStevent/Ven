import { useState, useEffect, useRef } from "react";

const BACKEND_URL = "https://roblox-vercel-lake.vercel.app/api";
const STORAGE_KEY = "roblox-monitor-ids";

const PRESENCE_LABELS = {
  0: { text: "Offline",    color: "#6b7280", bg: "#111827" },
  1: { text: "Online",     color: "#22c55e", bg: "#052e16" },
  2: { text: "In-Game",    color: "#3b82f6", bg: "#0c1a3a" },
  3: { text: "In Studio",  color: "#f59e0b", bg: "#1c1200" },
};

function getSavedIds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveIds(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.map(a => a.userId)));
}
function getIdsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("ids");
  if (!raw) return [];
  return raw.split(",").map(Number).filter(Boolean);
}
function updateUrl(accounts) {
  const ids = accounts.map(a => a.userId);
  const url = new URL(window.location.href);
  if (ids.length) url.searchParams.set("ids", ids.join(","));
  else url.searchParams.delete("ids");
  window.history.replaceState(null, "", url.toString());
}
function getShareUrl(accounts) {
  const ids = accounts.map(a => a.userId);
  const url = new URL(window.location.href);
  url.searchParams.set("ids", ids.join(","));
  return url.toString();
}

async function fetchUserInfo(userId) {
  const r = await fetch(`${BACKEND_URL}/user/${userId}`);
  if (!r.ok) throw new Error("User tidak ditemukan (ID: " + userId + ")");
  return r.json();
}
async function fetchPresence(userIds) {
  const r = await fetch(`${BACKEND_URL}/presence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds }),
  });
  if (!r.ok) throw new Error("Gagal fetch presence");
  const data = await r.json();
  return data.userPresences || [];
}
async function fetchAvatar(userId) {
  const r = await fetch(`${BACKEND_URL}/avatar/${userId}`);
  if (!r.ok) return null;
  const data = await r.json();
  return data.data?.[0]?.imageUrl || null;
}

function AccountCard({ account, onRemove, number }) {
  const p = PRESENCE_LABELS[account.presence ?? 0];
  const isOnline = account.presence > 0;
  return (
    <div style={{
      background: "#111827",
      border: `1px solid ${isOnline ? "#1d4ed8" : "#1e293b"}`,
      borderRadius: 12, padding: "14px 16px",
      transition: "all .2s", display: "flex", gap: 12, alignItems: "center",
    }}>
      {/* Nomor urut */}
      <div style={{
        flexShrink: 0, width: 20, textAlign: "center",
        fontSize: 12, fontWeight: 700, color: "#334155",
      }}>
        {number}
      </div>

      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {account.avatarUrl
          ? <img src={account.avatarUrl} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: `2px solid ${p.color}` }} />
          : <div style={{ width: 52, height: 52, borderRadius: 10, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎮</div>
        }
        <div style={{
          position: "absolute", bottom: -3, right: -3,
          width: 13, height: 13, borderRadius: "50%",
          background: p.color, border: "2px solid #111827",
          animation: isOnline ? "pulse 2s infinite" : "none",
        }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {account.displayName || account.name || "Loading..."}
        </div>
        <div style={{ fontSize: 11, color: "#64748b" }}>@{account.name || "..."} · ID: {account.userId}</div>
        <div style={{ marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.bg, color: p.color }}>
            {account.loading ? "⏳ Loading..." : p.text}
          </span>
          {account.lastLocation && account.presence === 2 && (
            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#0c1a3a", color: "#60a5fa" }}>
              🎮 {account.lastLocation}
            </span>
          )}
        </div>
      </div>

      {/* Right */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {account.lastOnline && (
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>
            Terakhir online:<br />
            <span style={{ color: "#64748b" }}>{new Date(account.lastOnline).toLocaleString("id-ID")}</span>
          </div>
        )}
        <button onClick={() => onRemove(account.userId)} style={{
          background: "none", border: "1px solid #1e293b", color: "#4b5563",
          borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11,
        }}>✕ Hapus</button>
      </div>
    </div>
  );
}

function LogItem({ entry }) {
  const p = PRESENCE_LABELS[entry.presence ?? 0];
  return (
    <div style={{ padding: "8px 0", borderBottom: "1px solid #1e293b", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "#cbd5e1" }}>
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{entry.name}</span>
          {" → "}
          <span style={{ color: p.color }}>{p.text}</span>
          {entry.game && <span style={{ color: "#60a5fa" }}> ({entry.game})</span>}
        </div>
        <div style={{ fontSize: 10, color: "#475569" }}>{new Date(entry.time).toLocaleString("id-ID")}</div>
      </div>
    </div>
  );
}

const FILTER_TABS = [
  { key: "all",     label: "Semua",   icon: "👥" },
  { key: "online",  label: "Online",  icon: "🟢" },
  { key: "offline", label: "Offline", icon: "⚫" },
];

const ACCOUNTS_PER_SERVER = 8;
const SERVER_COUNT = 8;

export default function App() {
  const [accounts, setAccounts]       = useState([]);
  const [inputId, setInputId]         = useState("");
  const [error, setError]             = useState("");
  const [log, setLog]                 = useState([]);
  const [intervalSec, setIntervalSec] = useState(5);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown]     = useState(0);
  const [filter, setFilter]           = useState("all");
  const [serverFilter, setServerFilter] = useState("all");
  const [copied, setCopied]           = useState(false);
  const [showImport, setShowImport]   = useState(false);
  const [importText, setImportText]   = useState("");
  const [exportCopied, setExportCopied] = useState(false);

  const prevPresence = useRef({});
  const timerRef     = useRef(null);
  const countRef     = useRef(null);

  const addLog = (entry) => setLog(l => [entry, ...l.slice(0, 49)]);

  const refreshAll = async (accs) => {
    if (!accs.length) return;
    try {
      const presences = await fetchPresence(accs.map(a => a.userId));
      setAccounts(prev => prev.map(acc => {
        const p = presences.find(x => x.userId === acc.userId);
        if (!p) return acc;
        const prevP = prevPresence.current[acc.userId];
        if (prevP !== undefined && prevP !== p.userPresenceType) {
          addLog({ name: acc.displayName || acc.name, presence: p.userPresenceType, game: p.lastLocation, time: Date.now() });
        }
        prevPresence.current[acc.userId] = p.userPresenceType;
        return { ...acc, presence: p.userPresenceType, lastLocation: p.lastLocation, lastOnline: p.lastOnline };
      }));
      setLastRefresh(new Date());
    } catch (e) { console.error("Refresh error:", e); }
  };

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countRef.current) clearInterval(countRef.current);
    if (!accounts.length) return;
    setCountdown(intervalSec);
    timerRef.current = setInterval(() => { refreshAll(accounts); setCountdown(intervalSec); }, intervalSec * 1000);
    countRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => { clearInterval(timerRef.current); clearInterval(countRef.current); };
  }, [accounts.length, intervalSec]);

  const loadAccount = async (id, showError = false) => {
    setAccounts(prev => {
      if (prev.find(a => a.userId === id)) return prev;
      return [...prev, { userId: id, name: "", displayName: "", loading: true, presence: 0 }];
    });
    try {
      const [info, presences, avatar] = await Promise.all([
        fetchUserInfo(id), fetchPresence([id]), fetchAvatar(id),
      ]);
      const p = presences[0];
      prevPresence.current[id] = p?.userPresenceType ?? 0;
      setAccounts(prev => {
        const next = prev.map(a => a.userId === id ? {
          ...a, name: info.name, displayName: info.displayName, avatarUrl: avatar,
          presence: p?.userPresenceType ?? 0, lastLocation: p?.lastLocation,
          lastOnline: p?.lastOnline, loading: false,
        } : a);
        saveIds(next);
        updateUrl(next);
        return next;
      });
    } catch (e) {
      if (showError) setError(e.message || "Gagal memuat akun");
      setAccounts(prev => {
        const next = prev.filter(a => a.userId !== id);
        saveIds(next);
        updateUrl(next);
        return next;
      });
    }
  };

  useEffect(() => {
    const urlIds = getIdsFromUrl();
    const localIds = getSavedIds();
    const ids = urlIds.length ? urlIds : localIds;
    ids.forEach(id => loadAccount(id));
  }, []);

  const addAccount = async () => {
    const id = parseInt(inputId.trim());
    if (!id || isNaN(id)) return setError("Masukkan User ID yang valid (angka)");
    if (accounts.find(a => a.userId === id)) return setError("ID ini sudah ditambahkan");
    setError("");
    setInputId("");
    await loadAccount(id, true);
  };

  const removeAccount = (id) => {
    setAccounts(prev => {
      const next = prev.filter(a => a.userId !== id);
      saveIds(next);
      updateUrl(next);
      return next;
    });
    delete prevPresence.current[id];
  };

  const shareUrl = () => {
    const url = getShareUrl(accounts);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
    } else {
      const el = document.createElement("textarea");
      el.value = url; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    }
  };

  // Backup manual: salin daftar User ID sebagai teks (dipisah koma)
  const exportIds = () => {
    const text = accounts.map(a => a.userId).join(",");
    const doCopyFallback = () => {
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
      setExportCopied(true); setTimeout(() => setExportCopied(false), 2500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setExportCopied(true); setTimeout(() => setExportCopied(false), 2500);
      }).catch(doCopyFallback);
    } else {
      doCopyFallback();
    }
  };

  // Backup manual: tempel daftar User ID (dipisah koma/spasi/baris baru) untuk ditambahkan kembali
  const importIds = async () => {
    const ids = importText
      .split(/[,\s]+/)
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0);
    const uniqueNewIds = [...new Set(ids)].filter(id => !accounts.find(a => a.userId === id));
    if (uniqueNewIds.length === 0) {
      setError("Tidak ada User ID baru/valid untuk diimpor");
      return;
    }
    setError("");
    setShowImport(false);
    setImportText("");
    for (const id of uniqueNewIds) {
      await loadAccount(id);
    }
  };

  const onCount  = accounts.filter(a => a.presence > 0).length;
  const offCount = accounts.filter(a => a.presence === 0 && !a.loading).length;

  // Beri nomor urut global & nomor server (1-8 -> Server 1, 9-16 -> Server 2, dst) sebelum difilter
  const accountsWithMeta = accounts.map((acc, i) => ({
    ...acc,
    _number: i + 1,
    _serverNum: Math.floor(i / ACCOUNTS_PER_SERVER) + 1,
  }));

  const serverCountNeeded = Math.max(1, Math.min(SERVER_COUNT, Math.ceil(accounts.length / ACCOUNTS_PER_SERVER)));

  const filteredAccounts = accountsWithMeta.filter(acc => {
    if (filter === "online"  && !(acc.presence > 0)) return false;
    if (filter === "offline" && !(acc.presence === 0 && !acc.loading)) return false;
    if (serverFilter !== "all" && acc._serverNum !== serverFilter) return false;
    return true;
  });

  const INTERVALS = [5, 10, 15, 30, 60];

  // Layout: full height, no scroll beyond content
  return (
    <div style={{
      height: "100dvh",
      background: "#060b14",
      color: "#e2e8f0",
      fontFamily: "'Inter','Segoe UI',sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        html, body { margin:0; padding:0; background:#060b14; height:100%; overflow:hidden; }
        input { background:#0f172a; border:1px solid #1e293b; color:#e2e8f0; border-radius:8px; padding:9px 14px; font-size:13px; outline:none; transition:border .15s; width:100%; box-sizing:border-box; }
        input:focus { border-color:#3b82f6; }
        .btn { border:none; border-radius:8px; padding:9px 18px; cursor:pointer; font-size:13px; font-weight:600; transition:all .15s; }
        .btn:hover { opacity:.85; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#060b14} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:4px}
        .filter-tab { border:none; border-radius:8px; padding:7px 16px; cursor:pointer; font-size:12px; font-weight:600; transition:all .15s; display:flex; align-items:center; gap:5px; }
        .filter-tab:hover { opacity:.85; }
      `}</style>

      {/* Header — fixed */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid #0f172a", padding: "14px 16px", background: "#080d18", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎮</span>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.5px" }}>Ven</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {accounts.length > 0 && (
            <button className="btn" onClick={shareUrl} style={{
              background: copied ? "#052e16" : "#0f172a",
              color: copied ? "#22c55e" : "#94a3b8",
              border: `1px solid ${copied ? "#22c55e" : "#1e293b"}`,
              padding: "6px 14px", fontSize: 12,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {copied ? "✅ Disalin!" : "🔗 Bagikan"}
            </button>
          )}
          {lastRefresh && (
            <span style={{ fontSize: 11, color: "#334155" }}>
              {countdown}d · {lastRefresh.toLocaleTimeString("id-ID")}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Input */}
          <div style={{ background: "#0d1424", border: "1px solid #1e293b", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Tambah Akun Roblox</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addAccount()}
                placeholder="Masukkan Roblox User ID"
                style={{ flex: 1, minWidth: 140, width: "auto" }}
              />
              <button className="btn" onClick={addAccount} style={{ background: "#1d4ed8", color: "#fff" }}>+ Tambah</button>
              <button className="btn" onClick={() => refreshAll(accounts)} style={{ background: "#0f172a", color: "#94a3b8", border: "1px solid #1e293b" }}>↻</button>
            </div>
            {error && <div style={{ marginTop: 8, fontSize: 12, color: "#f87171" }}>⚠ {error}</div>}
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#475569" }}>Auto-refresh:</span>
              {INTERVALS.map(s => (
                <button key={s} className="btn" onClick={() => setIntervalSec(s)} style={{
                  background: intervalSec === s ? "#0f3460" : "#0f172a",
                  color: intervalSec === s ? "#60a5fa" : "#475569",
                  border: `1px solid ${intervalSec === s ? "#1d4ed8" : "#1e293b"}`,
                  padding: "3px 10px", fontSize: 11,
                }}>{s}d</button>
              ))}
            </div>

            {/* Backup manual: Export / Import User ID */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#475569" }}>Backup:</span>
              <button
                className="btn"
                onClick={exportIds}
                disabled={accounts.length === 0}
                style={{
                  background: exportCopied ? "#052e16" : "#0f172a",
                  color: exportCopied ? "#22c55e" : "#94a3b8",
                  border: `1px solid ${exportCopied ? "#22c55e" : "#1e293b"}`,
                  padding: "5px 12px", fontSize: 11,
                  opacity: accounts.length === 0 ? 0.5 : 1,
                  cursor: accounts.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {exportCopied ? "✅ ID Disalin!" : "📤 Export ID"}
              </button>
              <button
                className="btn"
                onClick={() => setShowImport(s => !s)}
                style={{
                  background: showImport ? "#0f3460" : "#0f172a",
                  color: showImport ? "#60a5fa" : "#94a3b8",
                  border: `1px solid ${showImport ? "#1d4ed8" : "#1e293b"}`,
                  padding: "5px 12px", fontSize: 11,
                }}
              >
                📥 Import ID
              </button>
            </div>

            {showImport && (
              <div style={{ marginTop: 10 }}>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Tempel User ID di sini, pisahkan dengan koma / spasi / baris baru. Contoh: 11149647129, 11150191041"
                  style={{
                    background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0",
                    borderRadius: 8, padding: "9px 14px", fontSize: 12, outline: "none",
                    width: "100%", boxSizing: "border-box", minHeight: 70, resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button className="btn" onClick={importIds} style={{ background: "#1d4ed8", color: "#fff", padding: "6px 14px", fontSize: 12 }}>
                    + Tambahkan Semua
                  </button>
                  <button className="btn" onClick={() => { setShowImport(false); setImportText(""); }} style={{ background: "#0f172a", color: "#94a3b8", border: "1px solid #1e293b", padding: "6px 14px", fontSize: 12 }}>
                    Batal
                  </button>
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: "#475569" }}>
                  ID yang sudah ada otomatis dilewati, jadi aman untuk paste daftar lama maupun baru sekaligus.
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          {accounts.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Total", val: accounts.length, color: "#6366f1" },
                { label: "Online", val: onCount,        color: "#22c55e" },
                { label: "Offline", val: offCount,      color: "#6b7280" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0d1424", border: "1px solid #1e293b", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: accounts.length ? "1fr 220px" : "1fr", gap: 16 }}>
            <div>
              {accounts.length === 0 ? (
                <div style={{ textAlign: "center", color: "#334155", padding: "60px 0", border: "1px dashed #1e293b", borderRadius: 12 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
                  <div style={{ fontSize: 14 }}>Belum ada akun.<br />Masukkan User ID Roblox di atas.</div>
                </div>
              ) : (
                <>
                  {/* Filter Tabs: Status */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, background: "#0d1424", border: "1px solid #1e293b", borderRadius: 10, padding: 5 }}>
                    {FILTER_TABS.map(tab => {
                      const count = tab.key === "all" ? accounts.length : tab.key === "online" ? onCount : offCount;
                      const isActive = filter === tab.key;
                      return (
                        <button key={tab.key} className="filter-tab" onClick={() => setFilter(tab.key)} style={{
                          flex: 1, justifyContent: "center",
                          background: isActive ? "#1e293b" : "transparent",
                          color: isActive ? (tab.key === "online" ? "#22c55e" : tab.key === "offline" ? "#94a3b8" : "#e2e8f0") : "#475569",
                          border: isActive ? "1px solid #334155" : "1px solid transparent",
                        }}>
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                          <span style={{ background: isActive ? "#334155" : "#111827", color: isActive ? "#e2e8f0" : "#334155", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Filter Tabs: Server */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "#0d1424", border: "1px solid #1e293b", borderRadius: 10, padding: 5, overflowX: "auto" }}>
                    <button className="filter-tab" onClick={() => setServerFilter("all")} style={{
                      flex: 1, justifyContent: "center", flexShrink: 0,
                      background: serverFilter === "all" ? "#1e293b" : "transparent",
                      color: serverFilter === "all" ? "#e2e8f0" : "#475569",
                      border: serverFilter === "all" ? "1px solid #334155" : "1px solid transparent",
                    }}>
                      <span>🗂️ Semua Server</span>
                    </button>
                    {Array.from({ length: serverCountNeeded }, (_, idx) => idx + 1).map(serverNum => {
                      const count = accountsWithMeta.filter(a => a._serverNum === serverNum).length;
                      const isActive = serverFilter === serverNum;
                      return (
                        <button key={serverNum} className="filter-tab" onClick={() => setServerFilter(serverNum)} style={{
                          flex: 1, justifyContent: "center", flexShrink: 0,
                          background: isActive ? "#1e293b" : "transparent",
                          color: isActive ? "#e2e8f0" : "#475569",
                          border: isActive ? "1px solid #334155" : "1px solid transparent",
                        }}>
                          <span>Server {serverNum}</span>
                          <span style={{ background: isActive ? "#334155" : "#111827", color: isActive ? "#e2e8f0" : "#334155", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {filteredAccounts.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#334155", padding: "40px 0", border: "1px dashed #1e293b", borderRadius: 12 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{filter === "online" ? "🟢" : "⚫"}</div>
                      <div style={{ fontSize: 13 }}>Tidak ada akun yang {filter === "online" ? "online" : "offline"}.</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredAccounts.map(acc => (
                        <AccountCard key={acc.userId} account={acc} onRemove={removeAccount} number={acc._number} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Log Panel */}
            {accounts.length > 0 && (
              <div style={{ background: "#0d1424", border: "1px solid #1e293b", borderRadius: 12, padding: "14px", height: "fit-content" }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: "#475569", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>Log Status</div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {log.length === 0
                    ? <div style={{ color: "#334155", fontSize: 12, textAlign: "center", padding: "20px 0" }}>Belum ada perubahan</div>
                    : log.map((l, i) => <LogItem key={i} entry={l} />)
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
