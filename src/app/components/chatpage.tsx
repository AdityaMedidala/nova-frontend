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

// ── Constants ────────────────────────────────────────────────────────────────

type ChatPageProps = { onStart: () => void };
type Message = { sender: string; text: string };

const SUGGESTED = [
  { text: "What are the hostel fees?", icon: Building },
  { text: "CGPA requirement for PhD?", icon: GraduationCap },
  { text: "B.Tech IT course outcomes", icon: BookOpen },
  { text: "Academic regulations for arrears", icon: FileText },
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
    modes: { grab: { distance: 180, links: { opacity: linkOpacity * 3.5 } } },
  },
  detectRetina: true,
});

// Reuse the same config object, just different density/speed for screensaver
const STAR_OPTIONS = makeStarOptions(130, 0.18, 0.1);
const SCREENSAVER_OPTIONS = makeStarOptions(280, 0.4, 0.18);

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex justify-start pl-2">
      <div className="flex items-center gap-1.5 px-5 py-4 bg-zinc-900/70 border border-white/8 rounded-3xl rounded-tl-sm">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cyan-400/70"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.sender === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`px-5 py-3.5 rounded-3xl max-w-[82%] text-sm leading-relaxed ${
        isUser
          ? "bg-gradient-to-br from-blue-500/85 to-cyan-500/75 text-white rounded-br-sm shadow-lg shadow-cyan-500/10"
          : "bg-black/40 border border-white/8 text-white/90 rounded-bl-sm border-l-2 border-l-cyan-500/25 backdrop-blur-md"
      }`}>
        {isUser ? msg.text : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
              strong: ({ children }) => <strong className="text-cyan-300 font-semibold">{children}</strong>,
              code: ({ children }) => <code className="bg-black/50 px-1.5 py-0.5 rounded text-cyan-200 text-xs">{children}</code>,
            }}
          >
            {msg.text}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatPage({ onStart }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Particles engine — init once
  useEffect(() => {
    initParticlesEngine(async (e) => loadSlim(e)).then(() => setParticlesReady(true));
  }, []);

  // Idle detection
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const reset = () => { setIsIdle(false); clearTimeout(timer); timer = setTimeout(() => setIsIdle(true), 45000); };
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, []);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isLoading]);

  async function handleUserMessage(message: string) {
    if (!message.trim()) return;
    if (!hasStarted) { setHasStarted(true); onStart(); }

    setMessages((prev) => [...prev, { sender: "user", text: message }]);
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversation_id: conversationId }),
      });
      const data = await res.json();
      setConversationId(data.conversation_id);
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "bot", text: "Having trouble responding. Try again later." }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setConversationId(null);
    setHasStarted(false);
  }
  return (
      <div className="w-full max-w-3xl flex flex-col h-[100dvh] overflow-hidden pb-4 sm:pb-6 px-4 relative z-10">
      {/* Persistent star field — Changed z-index from -z-10 to z-0 */}
      {particlesReady && (
        <Particles id="stars" options={STAR_OPTIONS} className="fixed inset-0 z-0 pointer-events-none" />
      )}

      {/* ── Landing ── */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            key="landing"
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5 }}
            // Added flex-1, overflow-y-auto, and hidden scrollbars so mobile users can scroll freely!
            className="flex-1 w-full flex flex-col items-center gap-6 sm:gap-8 text-center pt-[5vh] sm:pt-[7vh] pb-12 relative z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2 }}
              className="relative flex items-center justify-center p-4"
            >
              {/* Ultra-soft, wide ambient glow - NO hard borders */}
              <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-[50px] scale-[2.5]" />
              <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-[60px] scale-[3]" />

              <Image
                src="/vit.png"
                alt="VIT Logo"
                width={100}
                height={100}
                className="relative brightness-0 invert opacity-90 drop-shadow-[0_0_20px_rgba(103,232,249,0.6)] hover:scale-105 transition-transform duration-500"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="space-y-2">
              <h1 className="font-[family-name:var(--font-sora)] text-7xl sm:text-8xl font-semibold tracking-[0.12em] text-white drop-shadow-[0_0_35px_rgba(103,232,249,0.45)]">
                NOVA
              </h1>
              <p className="text-sm text-white/35 tracking-[0.3em] uppercase font-light">VIT Intelligence</p>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-base text-white/55 font-light tracking-wide">
              Courses · Placements · Hostels · Academics
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full max-w-xl">
              <Inputbar onSend={handleUserMessage} disabled={isLoading} />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} className="flex flex-wrap justify-center gap-2 max-w-xl">
              {SUGGESTED.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.text}
                    onClick={() => handleUserMessage(item.text)}
                    // Added flex, items-center, and gap-2 to align the icon and text
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white/55 border border-white/10 rounded-full bg-white/4 hover:bg-cyan-500/10 hover:text-white/90 hover:border-cyan-400/40 transition-all duration-200 backdrop-blur-md"
                  >
                    <Icon className="w-3.5 h-3.5 text-cyan-400/60" />
                    {item.text}
                  </button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Idle screensaver ── */}
      <AnimatePresence>
        {!hasStarted && isIdle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050508]/92 backdrop-blur-sm">
            {particlesReady && <Particles id="screensaver" options={SCREENSAVER_OPTIONS} className="absolute inset-0" />}
            <div className="text-center z-10 space-y-4">
              <motion.h2
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="font-[family-name:var(--font-sora)] text-6xl font-semibold tracking-[0.18em] text-cyan-300 drop-shadow-[0_0_50px_#67e8f9]"
              >
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
          // Added relative z-10 to keep chat container above particles
          className="flex-1 flex flex-col min-h-0 mt-2 relative z-10">
          <div className="flex-1 bg-black/30 border border-white/8 rounded-3xl flex flex-col overflow-hidden backdrop-blur-xl shadow-[0_0_80px_rgba(0,0,0,0.6)]">

            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/20">
              <span className="font-[family-name:var(--font-sora)] text-xs font-medium tracking-[0.15em] text-white/40 uppercase">Conversation</span>
              <button onClick={handleNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/35 hover:text-white/75 border border-white/8 hover:border-cyan-500/30 rounded-full transition-all duration-200 group">
                <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                New chat
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto px-5 pt-6 pb-4 space-y-5">
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {isLoading && <TypingDots />}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-white/5 bg-black/20 px-4 pt-3 pb-4 rounded-b-3xl backdrop-blur-xl">
              <Inputbar onSend={handleUserMessage} disabled={isLoading} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );}