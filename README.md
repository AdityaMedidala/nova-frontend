# NOVA — Frontend

> Chat interface for NOVA, a RAG-powered AI assistant for VIT Vellore queries.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Framer Motion · tsParticles

**Backend repo:** [nova-vit-backend](https://github.com/AdityaMedidala/vit-qa-bot-backend)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Setup](#setup)
5. [Environment Variables](#environment-variables)
6. [Design Notes](#design-notes)

---

## Overview

NOVA's frontend is a full-screen chat UI built around a space theme — star constellations, aurora breathing background, shooting stars, and glistening cross-flare effects. All pure CSS and tsParticles, no external asset dependencies beyond the VIT logo.

Connects to a FastAPI backend via `POST /chat`, handles multi-turn conversation state, and renders source citation chips below each bot reply.

---

## Features

- **Star field** — tsParticles constellation with hover-grab interactivity, two density modes
- **Aurora background** — breathing gradient animation (pure CSS, `oklch` color space)
- **Shooting stars + glistening flares** — CSS keyframe animations, 8 streaks + 10 cross-flares
- **Idle screensaver** — triggers at 45s inactivity, denser particle field with pulsing NOVA logo
- **Source citation chips** — document + section rendered below each bot reply
- **Markdown rendering** — `react-markdown` + `remark-gfm` for bot responses
- **Suggested prompts** — 4 quick-start chips with Lucide icons on the landing screen
- **Follow-up conversation** — `conversation_id` threaded across messages
- **Smooth transitions** — Framer Motion `AnimatePresence` on landing ↔ chat view

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Sora + DM Sans fonts, dark class, metadata
│   ├── page.tsx            # Aurora bg, shooting stars, header, ChatPage mount
│   └── globals.css         # Star layers, shooting stars, glistening, aurora keyframes
└── components/
    ├── chatpage.tsx        # Landing screen, chat view, idle screensaver, message logic
    └── Inputbar.tsx        # Controlled input + send button (shadcn Input + Button)
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/nova-frontend
cd nova-frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Update the URL to your deployed FastAPI backend when deploying.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | FastAPI backend base URL — no trailing slash |

---

## Design Notes

**Fonts:** Sora (headings, NOVA logotype, tracking-widest labels) + DM Sans (body, input, chat text).

**Color palette:** Near-black `#05050a` base, `cyan-400/cyan-500` accent throughout — borders, send button, source chips, typing dots, markdown `strong` highlights.

**Star layers:** Three depth layers via `body::before`, `body::after`, and tsParticles. CSS layers handle the static background stars (twinkle animation). tsParticles handles the interactive constellation on top.

**Screensaver:** Activates after 45s of no mouse, keyboard, scroll, click, or touch events. Resets on any of those. Uses a separate higher-density tsParticles instance (`id="screensaver"`) so it doesn't conflict with the main field (`id="stars"`).

**Message bubble rendering:** User messages are plain text. Bot messages go through `react-markdown` with custom component overrides — `strong` renders cyan, `code` renders with dark background, lists get proper spacing. Source chips render below the markdown block, separated by a subtle border.

**API shape expected:**

```ts
// POST /chat
// Request
{ message: string; conversation_id: string | null }

// Response
{
  reply: string;
  conversation_id: string;
  sources: { document: string; section: string; chunk_id: string }[];
}
```

---

## Author

**Aditya** — B.Tech Information Technology, VIT Vellore 2026