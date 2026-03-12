"use client";
import React, { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type InputbarProps = {
  onSend: (message: string) => void;
  disabled: boolean;
};

function Inputbar({ onSend, disabled }: InputbarProps) {
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim() === "") return;
    onSend(message);
    setMessage("");
  }

  const hasText = message.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 w-full px-4 py-2.5 bg-zinc-900/60 border border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.02)] rounded-2xl backdrop-blur-xl focus-within:border-cyan-500/30 transition-colors duration-200">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-transparent border-0 text-white placeholder:text-zinc-500 text-base focus-visible:ring-0 focus-visible:ring-offset-0 font-[family-name:var(--font-dm-sans)]"
          placeholder="Ask anything about VIT..."
          disabled={disabled}
        />
        <Button
          type="submit"
          disabled={disabled || !hasText}
          size="icon"
          className={`w-8 h-8 rounded-xl transition-all duration-200 shrink-0 ${
            hasText && !disabled
              ? "bg-cyan-500 hover:bg-cyan-400 text-black"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          }`}
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

export default Inputbar;