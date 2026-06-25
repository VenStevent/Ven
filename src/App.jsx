import { useState, useEffect, useRef } from "react";

const BACKEND_URL = "https://ven-xyz.vercel.app/api";
const STORAGE_KEY = "roblox-monitor-ids"; // cache lokal (fallback offline / loading awal)
const API_ACCOUNTS = "/api/accounts"; // daftar User ID bersama (semua device/browser)

// Nomor versi build ini. Naikkan setiap kali deploy versi baru (juga update public/version.json
// dengan nilai yang sama). Tab yang masih membuka versi lama akan otomatis reload begitu
// versi di server berbeda dari versi ini.
const APP_VERSION = "15";

const PRESENCE_LABELS = {
  0: { text: "Offline",    color: "#6b7280", bg: "#111827" },
  1: { text: "Online",     color: "#22c55e", bg: "#052e16" },
  2: { text: "In-Game",    color: "#3b82f6", bg: "#0c1a3a" },
  3: { text: "In Studio",  color: "#f59e0b", bg: "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#1c1200" },
};

// Cache lokal: dipakai supay : "#