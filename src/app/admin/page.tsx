"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Layers, Clock, AlertTriangle,
  RefreshCw, CheckCircle, XCircle, Loader2,
  ChevronDown, ChevronUp, Shield, Activity, LogOut,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DocStatus = "done" | "processing" | "failed" | "pending_reingest";

interface Document {
  document_id: string;
  document_name: string;
  status: DocStatus;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
  chunk_count: number;
}

interface Stats {
  total_docs: number;
  total_chunks: number;
  processing: number;
  failed: number;
  last_ingestion: string | null;
}

type SortKey = "document_name" | "chunk_count" | "updated_at" | "status";
type SortDir = "asc" | "desc";

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(secret: string) {
  return { "X-Admin-Secret": secret, "Content-Type": "application/json" };
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function fmtShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function healthLabel(doc: Document): "OK" | "PARTIAL" | "FAILED" | "PROCESSING" | "PENDING" {
  if (doc.status === "failed") return "FAILED";
  if (doc.status === "processing") return "PROCESSING";
  if (doc.status === "pending_reingest") return "PENDING";
  if (doc.chunk_count <= 4) return "PARTIAL";
  return "OK";
}

const STATUS_COLORS: Record<string, string> = {
  OK:         "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  PARTIAL:    "text-amber-400  bg-amber-400/10  border-amber-400/25",
  FAILED:     "text-red-400    bg-red-400/10    border-red-400/25",
  PROCESSING: "text-blue-400   bg-blue-400/10   border-blue-400/25",
  PENDING:    "text-cyan-400   bg-cyan-400/10   border-cyan-400/25",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed,   setAuthed]   = useState(false);
  const [secret,   setSecret]   = useState("");
  const [authErr,  setAuthErr]  = useState(false);
  const [authErrMsg, setAuthErrMsg] = useState("Invalid secret.");
  const [loginBusy, setLoginBusy] = useState(false);

  const [stats,    setStats]    = useState<Stats | null>(null);
  const [docs,     setDocs]     = useState<Document[]>([]);
  const [loading,  setLoading]  = useState(false);

  const [search,   setSearch]   = useState("");
  const [sortKey,  setSortKey]  = useState<SortKey>("updated_at");
  const [sortDir,  setSortDir]  = useState<SortDir>("desc");
  const [filter,   setFilter]   = useState<"all" | "ok" | "partial" | "failed">("all");

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!secret.trim()) { setAuthErr(true); setAuthErrMsg("Please enter the admin secret."); return; }
    setLoginBusy(true);
    setAuthErr(false);
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: authHeaders(secret),
      });
      if (!res.ok) {
        setAuthErrMsg(res.status === 401 || res.status === 403 ? "Invalid secret." : `Server error (${res.status}).`);
        setAuthErr(true);
        return;
      }
      setAuthed(true);
    } catch {
      setAuthErrMsg(`Cannot reach server — is the API running at ${API_BASE}?`);
      setAuthErr(true);
    } finally {
      setLoginBusy(false);
    }
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  // secret is in deps so loadAll always uses the current entered secret
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`,     { headers: authHeaders(secret) }),
        fetch(`${API_BASE}/admin/documents`, { headers: authHeaders(secret) }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (dRes.ok) setDocs(await dRes.json());
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => { if (authed) loadAll(); }, [authed, loadAll]);

  // ── Sort & filter ─────────────────────────────────────────────────────────

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = docs
    .filter(d => {
      const h = healthLabel(d);
      if (filter === "ok"      && h !== "OK")      return false;
      if (filter === "partial" && h !== "PARTIAL")  return false;
      if (filter === "failed"  && !["FAILED", "PROCESSING", "PENDING"].includes(h)) return false;
      return d.document_name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === "chunk_count") { av = a.chunk_count; bv = b.chunk_count; }
      else if (sortKey === "updated_at") { av = a.updated_at ?? ""; bv = b.updated_at ?? ""; }
      else if (sortKey === "status") { av = healthLabel(a); bv = healthLabel(b); }
      else { av = a.document_name.toLowerCase(); bv = b.document_name.toLowerCase(); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1 text-cyan-400" /> : <ChevronDown className="w-3 h-3 inline ml-1 text-cyan-400" />)
      : <ChevronDown className="w-3 h-3 inline ml-1 opacity-25" />;

  // ── Login screen ──────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="aurora-bg min-h-screen flex items-center justify-center px-4">
        <div className="shooting-stars" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8 space-y-1">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-[family-name:var(--font-sora)] text-lg font-semibold tracking-[0.15em] text-white/90">
                NOVA ADMIN
              </span>
            </div>
            <p className="text-xs text-white/30 tracking-widest uppercase">Restricted Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Admin secret"
              className="w-full px-4 py-3 bg-zinc-900/60 border border-white/10 rounded-2xl text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors backdrop-blur-xl"
            />
            {authErr && (
              <p className="text-xs text-red-400 text-center">{authErrMsg}</p>
            )}
            <button
              type="submit"
              disabled={loginBusy}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-2xl transition-colors duration-200 tracking-wide flex items-center justify-center gap-2"
            >
              {loginBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {loginBusy ? "Checking…" : "Enter"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  const okCount      = docs.filter(d => healthLabel(d) === "OK").length;
  const partialCount = docs.filter(d => healthLabel(d) === "PARTIAL").length;
  const failedCount  = docs.filter(d => ["FAILED","PROCESSING","PENDING"].includes(healthLabel(d))).length;

  return (
    <div className="aurora-bg min-h-screen overflow-y-auto text-white font-[family-name:var(--font-dm-sans)]">

      {/* Shooting stars */}
      <div className="shooting-stars" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
      </div>
      <div className="glistening-stars" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => <span key={i} />)}
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-xl bg-black/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-[family-name:var(--font-sora)] text-sm font-semibold tracking-[0.18em] text-white/80 uppercase">
              Nova Admin
            </span>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-xs text-white/30 tracking-wider">VIT Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/40 hover:text-cyan-400 border border-white/8 hover:border-cyan-500/30 rounded-full transition-all duration-200"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => { setAuthed(false); setSecret(""); setStats(null); setDocs([]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/40 hover:text-red-400 border border-white/8 hover:border-red-500/30 rounded-full transition-all duration-200"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Stat cards ── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { icon: FileText,      label: "Documents",  value: stats.total_docs,   color: "text-cyan-400" },
              { icon: Layers,        label: "Chunks",     value: stats.total_chunks, color: "text-blue-400" },
              { icon: Activity,      label: "Processing", value: stats.processing,   color: "text-amber-400" },
              { icon: AlertTriangle, label: "Failed",     value: stats.failed,       color: "text-red-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-zinc-900/50 border border-white/8 rounded-2xl px-5 py-4 backdrop-blur-md">
                <div className={`${color} mb-2`}><Icon className="w-4 h-4" /></div>
                <div className="text-2xl font-semibold text-white tabular-nums">{value.toLocaleString()}</div>
                <div className="text-xs text-white/35 mt-0.5 tracking-wide">{label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Last ingestion */}
        {stats?.last_ingestion && (
          <p className="text-xs text-white/25 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Last ingestion: {fmt(stats.last_ingestion)}
          </p>
        )}

        {/* ── Health summary pills ── */}
        <div className="flex flex-wrap gap-2">
          {(["all", "ok", "partial", "failed"] as const).map(f => {
            const counts = { all: docs.length, ok: okCount, partial: partialCount, failed: failedCount };
            const labels = { all: "All", ok: "Healthy", partial: "Partial", failed: "Attention" };
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full border transition-all duration-150 ${
                  active
                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                    : "bg-white/4 border-white/8 text-white/40 hover:border-white/20 hover:text-white/60"
                }`}
              >
                {labels[f]} <span className="ml-1 opacity-60">{counts[f]}</span>
              </button>
            );
          })}

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="ml-auto px-3 py-1 text-xs bg-zinc-900/50 border border-white/8 rounded-full text-white/70 placeholder:text-white/25 focus:outline-none focus:border-cyan-500/30 transition-colors w-48"
          />
        </div>

        {/* ── Documents table ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-zinc-900/40 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-md"
        >
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/5 bg-black/20 text-[11px] text-white/35 uppercase tracking-widest">
            <button onClick={() => toggleSort("document_name")} className="text-left hover:text-white/60 transition-colors">
              Document <SortIcon k="document_name" />
            </button>
            <button onClick={() => toggleSort("chunk_count")} className="text-left hover:text-white/60 transition-colors">
              Chunks <SortIcon k="chunk_count" />
            </button>
            <button onClick={() => toggleSort("status")} className="text-left hover:text-white/60 transition-colors">
              Health <SortIcon k="status" />
            </button>
            <button onClick={() => toggleSort("updated_at")} className="text-left hover:text-white/60 transition-colors">
              Updated <SortIcon k="updated_at" />
            </button>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-white/[0.04]">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-white/25">
                  No documents match.
                </div>
              ) : filtered.map((doc, i) => {
                const health = healthLabel(doc);

                return (
                  <motion.div
                    key={doc.document_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: i * 0.015, duration: 0.2 }}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Name */}
                    <div className="min-w-0">
                      <p className="text-sm text-white/80 truncate font-medium" title={doc.document_name}>
                        {doc.document_name.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-white/20 font-mono mt-0.5 truncate">{doc.document_id}</p>
                    </div>

                    {/* Chunks */}
                    <div className="text-sm tabular-nums text-white/60">{doc.chunk_count}</div>

                    {/* Health badge */}
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[health]}`}>
                        {health === "OK"         && <CheckCircle   className="w-2.5 h-2.5" />}
                        {health === "FAILED"      && <XCircle      className="w-2.5 h-2.5" />}
                        {health === "PARTIAL"     && <AlertTriangle className="w-2.5 h-2.5" />}
                        {health === "PROCESSING"  && <Loader2      className="w-2.5 h-2.5 animate-spin" />}
                        {health === "PENDING"     && <RefreshCw    className="w-2.5 h-2.5" />}
                        {health}
                      </span>
                    </div>

                    {/* Updated */}
                    <div className="text-xs text-white/30">{fmtShort(doc.updated_at)}</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-white/5 bg-black/10 text-[10px] text-white/20 flex items-center justify-between">
            <span>Showing {filtered.length} of {docs.length} documents</span>
            <span>{docs.reduce((s, d) => s + d.chunk_count, 0).toLocaleString()} total chunks indexed</span>
          </div>
        </motion.div>

      </main>

    </div>
  );
}