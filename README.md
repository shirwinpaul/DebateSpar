# ⚔️ DebateDojo: AI Debate Sparring Partner

**Sharpen your arguments. Spar with AI.** Pick a motion and a side. An AI opponent argues the other side over several rounds, and then a fair AI judge scores you and gives specific, actionable feedback.

> Screenshots: _add yours here_
> `![Landing](docs/landing.png)` · `![Arena](docs/arena.png)` · `![Results](docs/results.png)`

## Features

- **Setup wizard**: your own motion, or one of 72 from the built-in Motion Library (search, filters, 🎲 random), side, format (3 / 5 / 2–7 rounds), who opens, turn timer, difficulty, opponent style, and language (English, Tamil, Hindi).
- **The Arena**: podiums, a typewriter reveal (skippable), live word counter (400-word cap), turn timer ring, 🎤 voice input, 🔊 read aloud, 💡 2 hints per debate, 🏳️ end early, and autosave with "Resume your debate?".
- **Modes**: 🧑‍🏫 Coach Mode (a tip after each speech) and 🕵️ Fallacy Hunt (spot the AI's planted fallacy for bonus points).
- **Results**: winner banner with confetti, overall score (0–100) and rank badge (🥉 Novice · 🥈 Debater · 🥇 Orator · 🏆 Champion), skills radar, per-round chart, best and weakest moments, missed arguments, fallacies, 3 tips, the judge's comment, full transcript, Rematch, Switch sides, and a printable report.
- **📈 My Progress**: history, score over time, average per skill, and a daily streak.
- Dark mode by default with a light toggle. Responsive from 360 px. Keyboard and screen-reader friendly, with reduced-motion support.

## Fair-play principles

1. **A worthy opponent.** The AI argues its side fully and answers your actual points.
2. **Honest evidence.** The AI never invents statistics, studies, quotes or sources.
3. **Respectful debate.** No insults or personal attacks, ever.
4. **Safe motions.** Controversial policy topics are fine. Harmful motions are politely declined, with a suggested alternative.
5. **Quota-friendly.** Exactly one AI call per round (the speech and the scoring together), plus one judging call. Hints are limited.
6. **Private.** Debates are stored only in your browser (localStorage). Nothing is stored or logged on the server.

The **overall score is computed in code**, not by the AI (`src/lib/scoring.ts`):
`(0.7 × avg of 6 judge skills + 0.3 × avg per-round score) × 10 − 2 per timer overrun (max 6) + 3 per correct fallacy call-out (max 9)`, clamped to 0–100.

## Setup (local)

Requirements: [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

> **Windows:** if PowerShell says "running scripts is disabled", use `npm.cmd` instead of `npm` (for example `npm.cmd run dev`).

### Get free API keys

- **Gemini (primary):** go to https://aistudio.google.com/apikey, sign in with Google, and click **Create API key**.
- **Groq (fallback, optional but recommended):** go to https://console.groq.com/keys, sign up, and click **Create API Key**.

### Environment variables

Copy `.env.example` to `.env.local` and paste in your keys:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini key (primary model) |
| `GROQ_API_KEY` | Groq key (fallback model) |
| `MOCK_AI` | `true` = canned responses with no AI quota used (development only; ignored in production) |

Model IDs and limits are all in `src/config/ai.ts`.

Users can also paste **their own Gemini key** in ⚙️ Settings. It is stored only in their browser and sent with each request, and it is never stored or logged on the server.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |

## Deploy to Vercel (free Hobby plan)

1. Push this project to a GitHub repository. `.env.local` is git-ignored, so your keys stay private.
2. At https://vercel.com, click **Add New → Project** and import the repo.
3. Under **Environment Variables**, add `GEMINI_API_KEY` and `GROQ_API_KEY` (no need for `MOCK_AI`).
4. Click **Deploy**.

Notes:
- AI routes set `maxDuration = 60` (the Hobby plan maximum), and retries and fallback share a 56 s budget.
- Requests are text-only and capped at 64 KB, far below Vercel's ~4.5 MB body limit.
- The per-IP rate limit (60 AI calls/hour) is **in-memory and best-effort**. On serverless, each instance keeps its own counter, so it isn't a hard global limit.

## How the AI layer works

- Gemini is called first with low thinking and capped output tokens.
- On a Gemini 429, the app waits for `retry-after` (if it's 10 s or less) and retries once, then falls back to Groq. It also falls back on 5xx, a timeout over 30 s, or invalid JSON after one retry.
- Before calling Groq, it estimates tokens and trims older context to fit Groq's tokens-per-minute limit.
- Every AI reply is strict JSON validated with Zod. On failure it retries once with the validation error appended.
- The transcript is sent compactly: full text of the last 2 rounds plus a short summary of earlier rounds.
- User text is wrapped as data, and system prompts tell the model to ignore instructions inside speeches.
- Server logs contain only provider, status, error type and retry-after. They never contain keys or debate content.

## Project structure

```
src/app         pages + /api/round, /api/judge, /api/hint
src/components  UI (wizard, arena, results, progress, charts)
src/lib         engine, scoring, schemas, storage, history, AI layer (src/lib/ai)
src/config      ai.ts: all model IDs and AI settings
src/data        motions.ts: Motion Library
src/hooks       countdown, typewriter, speech
src/types       shared types
tests/          Vitest unit tests
```

---

Built by Anand Raj
