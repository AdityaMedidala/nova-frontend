"use client";
import React, { useState, useRef, useEffect } from "react";
import Inputbar from "./Inputbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Building, GraduationCap, BookOpen, FileText } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChatPageProps = { onStart: () => void };
type Source  = { document: string; section: string; chunk_id: string };
type Message = { sender: "user" | "bot"; text: string; sources?: Source[] };

// ── Constants ─────────────────────────────────────────────────────────────────

const SUGGESTED = [
  { text: "What are the hostel fees?",         icon: Building      },
  { text: "CGPA requirement for PhD?",         icon: GraduationCap },
  { text: "B.Tech IT course outcomes",         icon: BookOpen      },
  { text: "Academic regulations for arrears",  icon: FileText      },
];

const makeStarOptions = (count: number, speed: number, linkOpacity: number) => ({
  background: { color: { value: "transparent" } },
  particles: {
    number: { value: count },
    color: { value: ["#a5f3fc", "#60a5fa", "#bae6fd", "#ffffff"] },
    size: { value: { min: 0.6, max: 2.5 } },
    move: { enable: true, speed, random: true },
    opacity: { value: 0.5, animation: { enable: true, speed: 0.8, minimumValue: 0.1 } },
    links: { enable: true, distance: 120, color: "#67e8f9", opacity: linkOpacity, width: 0.7 },
  },
  interactivity: {
    events: { onHover: { enable: true, mode: "grab" as const } },
    modes:  { grab: { distance: 180, links: { opacity: linkOpacity * 3.5 } } },
  },
  detectRetina: true,
});

const STAR_OPTIONS        = makeStarOptions(130, 0.18, 0.10);
const SCREENSAVER_OPTIONS = makeStarOptions(280, 0.40, 0.18);

// ── Markdown components ───────────────────────────────────────────────────────

const MD_COMPONENTS = {
  p: ({ children }: any) => (
    <p className="mb-2.5 last:mb-0 leading-relaxed text-white/85">{children}</p>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-base font-semibold text-cyan-300 mb-2 mt-4 first:mt-0 tracking-wide border-b border-cyan-500/20 pb-1.5">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-sm font-semibold text-cyan-300/90 mb-2 mt-3 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-sm font-medium text-cyan-200/75 mb-1.5 mt-2 first:mt-0">{children}</h3>
  ),
  ul: ({ children }: any) => (
    <ul className="space-y-1.5 mb-2.5 pl-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="space-y-1.5 mb-2.5 pl-4 list-decimal marker:text-cyan-500/60">{children}</ol>
  ),
  li: ({ children, ...props }: any) => {
    // ol > li — let list-decimal handle the marker
    if (props.ordered) {
      return <li className="text-white/80 pl-1">{children}</li>;
    }
    return (
      <li className="flex items-start gap-2 text-white/80">
        <span className="mt-[0.45em] shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
        <span className="flex-1">{children}</span>
      </li>
    );
  },
  strong: ({ children }: any) => (
    <strong className="text-cyan-300 font-semibold">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="text-white/65 italic">{children}</em>
  ),
  code: ({ children, className }: any) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block bg-black/60 border border-white/8 rounded-xl px-4 py-3 text-cyan-200 text-xs font-mono overflow-x-auto my-2 leading-relaxed whitespace-pre">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-black/50 border border-white/10 px-1.5 py-0.5 rounded-md text-cyan-300 text-[0.8em] font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => (
    <pre className="my-2 overflow-x-auto rounded-xl">{children}</pre>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-cyan-500/40 pl-3.5 my-2.5 text-white/55 italic bg-cyan-500/5 rounded-r-lg py-1.5">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-3 border-none h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
  ),
  a: ({ children, href }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-cyan-400 underline underline-offset-2 decoration-cyan-500/40 hover:text-cyan-300 hover:decoration-cyan-300/60 transition-colors">
      {children}
    </a>
  ),

  // ── Tables ────────────────────────────────────────────────────────────────
  table: ({ children }: any) => (
    <div className="-mx-2 my-3 overflow-x-auto rounded-xl border border-white/10 shadow-[0_0_24px_rgba(103,232,249,0.05)] bg-black/20">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/25">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-white/[0.06]">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="transition-colors duration-150 hover:bg-cyan-500/[0.04]">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-2.5 text-left text-cyan-300/90 font-semibold tracking-wide whitespace-nowrap text-[11px] uppercase">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-2 text-white/70 whitespace-nowrap">{children}</td>
  ),
};

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex justify-start pl-2">
      <div className="flex items-center gap-1.5 px-5 py-4 bg-zinc-900/70 border border-white/8 rounded-3xl rounded-tl-sm">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/70"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.sender === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed ${
        isUser
          ? "max-w-[82%] bg-gradient-to-br from-blue-500/85 to-cyan-500/75 text-white rounded-br-sm shadow-lg shadow-cyan-500/10"
          : "w-full max-w-[96%] bg-black/40 border border-white/8 overflow-x-hidden text-white/90 rounded-bl-sm border-l-2 border-l-cyan-500/25 backdrop-blur-md"
      }`}>
        {isUser
          ? msg.text
          : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                {msg.text}
              </ReactMarkdown>
              {!!msg.sources?.length && (
                <div className="mt-3 pt-3 border-t border-white/8 flex flex-wrap gap-1.5">
                  {msg.sources.map((src) => (
                    <span key={src.chunk_id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-cyan-400/70 border border-cyan-500/20 bg-cyan-500/5">
                      <span className="opacity-50">📄</span>
                      <span>{src.document}{src.section ? ` › ${src.section}` : ""}</span>
                    </span>
                  ))}
                </div>
              )}
            </>
          )
        }
      </div>
    </motion.div>
  );
}

// ── Streaming helper ──────────────────────────────────────────────────────────

async function streamChat(
  message:        string,
  conversationId: string | null,
  onToken:   (t: string)   => void,
  onSources: (s: Source[]) => void,
  onDone:    ()            => void,
  onError:   (m: string)   => void,
): Promise<string | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });

  if (!res.ok || !res.body) { onError("Failed to connect to backend."); return null; }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let returnedId = conversationId;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const raw of events) {
        if (!raw.trim()) continue;
        let eventType = "message", dataLine = "";
        for (const line of raw.split("\n")) {
          if (line.startsWith("event: ")) eventType = line.slice(7).trim();
          if (line.startsWith("data: "))  dataLine  = line.slice(6).trim();
        }
        if (!dataLine) continue;
        const p = JSON.parse(dataLine);
        if (eventType === "meta")    returnedId = p.conversation_id;
        if (eventType === "token")   onToken(p.token);
        if (eventType === "sources") onSources(p.sources);
        if (eventType === "done")    onDone();
        if (eventType === "error")   onError(p.message);
      }
    }
  } finally {
    reader.releaseLock();
  }
  return returnedId;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatPage({ onStart }: ChatPageProps) {
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [hasStarted,     setHasStarted]     = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading,      setIsLoading]      = useState(false);
  const [isIdle,         setIsIdle]         = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initParticlesEngine(async (e) => loadSlim(e)).then(() => setParticlesReady(true));
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const reset = () => {
      setIsIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIsIdle(true), 45000);
    };
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const patchLast = (patch: Partial<Message> | ((prev: Message) => Partial<Message>)) =>
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      const resolved = typeof patch === "function" ? patch(last) : patch;
      updated[updated.length - 1] = { ...last, ...resolved };
      return updated;
    });

  async function handleUserMessage(message: string) {
    if (!message.trim() || isLoading) return;
    if (!hasStarted) { setHasStarted(true); onStart(); }

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: message },
      { sender: "bot",  text: "", sources: [] },
    ]);
    setIsLoading(true);

    try {
      const newId = await streamChat(
        message,
        conversationId,
        (token)   => patchLast((last) => ({ text: last.text + token })),
        (sources) => patchLast({ sources }),
        ()        => setIsLoading(false),
        (msg)     => { patchLast({ text: msg }); setIsLoading(false); },
      );
      if (newId) setConversationId(newId);
    } catch {
      patchLast({ text: "Having trouble responding. Try again later." });
      setIsLoading(false);
    }
  }

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setHasStarted(false);
  };

  return (
    <div className="w-full max-w-3xl flex flex-col h-[100dvh] overflow-hidden pb-4 sm:pb-6 px-4 relative z-10">
      {particlesReady && (
        <Particles id="stars" options={STAR_OPTIONS} className="fixed inset-0 z-0 pointer-events-none" />
      )}

      {/* ── Landing ── */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div key="landing" exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.5 }}
            className="flex-1 w-full flex flex-col items-center gap-6 sm:gap-8 text-center pt-[5vh] sm:pt-[7vh] pb-12 relative z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }}
              className="relative flex items-center justify-center p-4">
              <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-[50px] scale-[2.5]" />
              <div className="absolute inset-0 rounded-full bg-blue-500/5  blur-[60px] scale-[3]"  />
              <Image src="/vit.png" alt="VIT Logo" width={100} height={100}
                className="relative brightness-0 invert opacity-90 drop-shadow-[0_0_20px_rgba(103,232,249,0.6)] hover:scale-105 transition-transform duration-500" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="space-y-2">
              <h1 className="font-[family-name:var(--font-sora)] text-7xl sm:text-8xl font-semibold tracking-[0.12em] text-white drop-shadow-[0_0_35px_rgba(103,232,249,0.45)]">
                NOVA
              </h1>
              <p className="text-sm text-white/35 tracking-[0.3em] uppercase font-light">VIT Intelligence</p>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-base text-white/55 font-light tracking-wide">
              Courses · Placements · Hostels · Academics
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full max-w-xl">
              <Inputbar onSend={handleUserMessage} disabled={isLoading} />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
              className="flex flex-wrap justify-center gap-2 max-w-xl">
              {SUGGESTED.map(({ text, icon: Icon }) => (
                <button key={text} onClick={() => handleUserMessage(text)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white/55 border border-white/10 rounded-full bg-white/4 hover:bg-cyan-500/10 hover:text-white/90 hover:border-cyan-400/40 transition-all duration-200 backdrop-blur-md">
                  <Icon className="w-3.5 h-3.5 text-cyan-400/60" />
                  {text}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Idle screensaver ── */}
      <AnimatePresence>
        {!hasStarted && isIdle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050508]/92 backdrop-blur-sm">
            {particlesReady && (
              <Particles id="screensaver" options={SCREENSAVER_OPTIONS} className="absolute inset-0" />
            )}
            <div className="text-center z-10 space-y-4">
              <motion.h2 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }}
                className="font-[family-name:var(--font-sora)] text-6xl font-semibold tracking-[0.18em] text-cyan-300 drop-shadow-[0_0_50px_#67e8f9]">
                NOVA
              </motion.h2>
              <p className="text-white/35 tracking-[0.25em] uppercase text-xs">move your mouse to continue</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat view ── */}
      {hasStarted && (
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col min-h-0 mt-2 relative z-10">
          <div className="flex-1 bg-black/30 border border-white/8 rounded-3xl flex flex-col overflow-hidden backdrop-blur-xl shadow-[0_0_80px_rgba(0,0,0,0.6)]">

            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/20">
              <span className="font-[family-name:var(--font-sora)] text-xs font-medium tracking-[0.15em] text-white/40 uppercase">
                Conversation
              </span>
              <button onClick={handleNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/35 hover:text-white/75 border border-white/8 hover:border-cyan-500/30 rounded-full transition-all duration-200 group">
                <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                New chat
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto px-5 pt-6 pb-4 space-y-5">
              {messages.map((msg, i) =>
                msg.text === "" ? null : <MessageBubble key={i} msg={msg} />
              )}
              {isLoading && messages.at(-1)?.text === "" && <TypingDots />}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-white/5 bg-black/20 px-4 pt-3 pb-4 rounded-b-3xl backdrop-blur-xl">
              <Inputbar onSend={handleUserMessage} disabled={isLoading} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}