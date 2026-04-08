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

Connects to a FastAPI backend via SSE streaming (`POST /chat/stream`), handles multi-turn conversation state, and renders source citation chips below each bot reply.

---

## Features

- **SSE streaming** — tokens arrive in real-time via Server-Sent Events; typing dots show only before the first token
- **Star field** — tsParticles constellation with hover-grab interactivity, two density modes
- **Aurora background** — breathing gradient animation (pure CSS, `oklch` color space)
- **Shooting stars + glistening flares** — CSS keyframe animations, 8 streaks + 10 cross-flares
- **Idle screensaver** — triggers at 45s inactivity, denser particle field with pulsing NOVA logo
- **Source citation chips** — document + section rendered below each bot reply after stream completes
- **Markdown rendering** — `react-markdown` + `remark-gfm` for bot responses including tables
- **Suggested prompts** — 4 quick-start chips with Lucide icons on the landing screen
- **Follow-up conversation** — `conversation_id` threaded across messages
- **Smooth transitions** — Framer Motion `AnimatePresence` on landing ↔ chat view
- **Admin panel** — `/admin` route for document management (delete, re-ingest, health status)

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Sora + DM Sans fonts, dark class, metadata
│   ├── page.tsx                # Aurora bg, shooting stars, header, ChatPage mount
│   ├── globals.css             # Star layers, shooting stars, glistening, aurora keyframes
│   └── admin/
│       └── page.tsx            # Admin dashboard — document list, stats, delete/reingest
└── components/
    ├── chatpage.tsx            # Landing screen, chat view, idle screensaver, streaming logic
    └── Inputbar.tsx            # Controlled input + send button (shadcn Input + Button)
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/AdityaMedidala/vit-qa-bot
cd vit-qa-bot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ADMIN_SECRET=your-admin-secret
```

`NEXT_PUBLIC_ADMIN_SECRET` must match the `ADMIN_SECRET` env var on the backend. The admin page validates this against the backend on login — it is not used as a bypass.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

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
| `NEXT_PUBLIC_ADMIN_SECRET` | Admin secret — must match backend `ADMIN_SECRET` |

---

## Streaming

The chat uses `POST /chat/stream` which returns an SSE event stream. The `streamChat` helper in `chatpage.tsx` handles the event loop:

```
event: meta    → captures conversation_id
event: token   → appends token to the last bot message in state
event: sources → attaches source chips to the last bot message
event: done    → clears the loading state
event: error   → surfaces an error message in the bubble
```

Typing dots are shown only while `isLoading && messages.at(-1)?.text === ""` — they disappear as soon as the first token arrives, replaced by the live text.

---

## Admin Panel

The `/admin` route is a restricted dashboard for managing the knowledge base.

**Login:** Enter the admin secret (matches `ADMIN_SECRET` on the backend). The entered secret is threaded through all subsequent API calls via the `X-Admin-Secret` header — the `NEXT_PUBLIC_ADMIN_SECRET` env var is not used after login.

**Features:**
- Stats overview — total documents, chunks, processing count, failed count, last ingestion time
- Document table with sort (name, chunks, health, updated) and filter (All / Healthy / Partial / Attention)
- Health badges — OK, PARTIAL (≤4 chunks), FAILED, PROCESSING, PENDING
- Per-document delete (two-step confirm) and re-ingest (marks `pending_reingest`, triggers Colab notebook)
- Toast notifications for all actions

---

## Design Notes

**Fonts:** Sora (headings, NOVA logotype, tracking-widest labels) + DM Sans (body, input, chat text).

**Color palette:** Near-black `#05050a` base, `cyan-400/cyan-500` accent throughout — borders, send button, source chips, typing dots, markdown `strong` highlights.

**Star layers:** Three depth layers via `body::before`, `body::after`, and tsParticles. CSS layers handle the static background stars (twinkle animation). tsParticles handles the interactive constellation on top.

**Screensaver:** Activates after 45s of no mouse, keyboard, scroll, click, or touch events. Resets on any of those. Uses a separate higher-density tsParticles instance (`id="screensaver"`) so it doesn't conflict with the main field (`id="stars"`).

**Message bubble rendering:** User messages are plain text. Bot messages go through `react-markdown` with custom component overrides — `strong` renders cyan, `code` renders with dark background, tables get a scrollable container with cyan header gradient. Source chips render below the markdown block after the stream completes.

**API shape expected:**

```ts
// POST /chat/stream — SSE
// Request
{ message: string; conversation_id: string | null }

// SSE events
// event: meta   → { conversation_id: string }
// event: token  → { token: string }
// event: sources → { sources: { document: string; section: string; chunk_id: string }[] }
// event: done   → {}
// event: error  → { message: string }
```

---

## Author

**Aditya** — B.Tech Information Technology, VIT Vellore 2026