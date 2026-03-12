"use client";
import ChatPage from "./components/chatpage";
import { useState } from "react";

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div className="aurora-bg flex flex-col items-center w-full h-[100dvh] overflow-hidden">

      {/* Shooting stars — 8 streaks at staggered delays */}
      <div className="shooting-stars" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
      </div>

      {/* Glistening stars — 10 cross-flare twinkles */}
      <div className="glistening-stars" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => <span key={i} />)}
      </div>

      {/* Header — only after chat starts */}
      {hasStarted && (
        <div className="w-full flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-xl bg-black/20 z-10">
          <span className="font-(family-name:--font-sora) text-xl font-semibold tracking-[0.15em] text-white/90">
            NOVA
          </span>
          <span className="text-xs text-white/30 tracking-widest uppercase">VIT Intelligence</span>
          <div className="w-16" />
        </div>
      )}

      <ChatPage onStart={() => setHasStarted(true)} />
    </div>
  );
}