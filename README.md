# 🥗 HappyBelly AI

An **AI-first calorie & macro tracker** that removes the friction of manual logging.
Describe a meal in plain English or snap a photo — HappyBelly AI uses **Groq + Llama**
to break it into food items with calories, protein, carbs and fats, then learns from
your edits to get sharper over time.

> Built with Next.js (App Router), TypeScript, Tailwind CSS, Lucide icons, the Groq SDK,
> and a Prisma/Postgres schema for the production persistence layer.

---

## ✨ Features

| Area | What it does |
| --- | --- |
| **Target vs. Actual dashboard** | A hero calorie ring + protein/carb/fat bars showing consumed vs. goal, with "left / over" deltas and an energy-source split. |
| **Plain-English logging** | Type *"three scrambled eggs, two slices of sourdough with butter, and a protein shake"* → parsed into individual items via **Llama 3.3 70B** (JSON mode). |
| **Photo logging (vision)** | Drag-and-drop or camera capture → a **Llama 4 multimodal** model identifies foods, estimates portions, and returns macros. |
| **Incoming Log Review modal** | Every AI estimate is editable before it's committed — tweak grams/macros, ½×/2× per item, add/remove rows. |
| **Self-correcting feedback loop** | Your edits are diffed against the AI's guess and stored as corrections. The top 5 are injected into the system prompt as few-shot examples so estimates adapt to *your* brands & portions. |
| **Adaptive TDEE** | Not a static calculator — regresses your weight trend against logged intake over a rolling 7-day window to estimate true maintenance calories. |
| **Streak tracker** | Consecutive-days-logged gamification with a 7-day dot strip and best-streak record. |
| **Quick-Log multipliers** | One-tap **½× Halve** / **2× Double** on any logged meal — no edit menu. |
| **Weight log + sparkline** | Daily weigh-ins (kg/lb) feeding the adaptive TDEE. |

Everything persists to your browser (`localStorage`) so the app runs with **zero database setup**.
A full Prisma schema is included for when you want server-side, multi-device persistence.

---

## 🚀 Getting started

**Requirements:** Node 18.17+ (Node 20 recommended).

```bash
cd happybelly-ai
npm install
npm run dev
```

Open <http://localhost:3000>.

Your Groq key is already in `.env.local`. On first load, click **"Load sample data"** in
the footer to see the dashboard populated, or just start logging a meal.

### Environment variables (`.env.local`)

```bash
GROQ_API_KEY="gsk_..."                                   # required
GROQ_TEXT_MODEL="llama-3.3-70b-versatile"                # any Groq JSON-mode chat model
GROQ_VISION_MODEL="meta-llama/llama-4-scout-17b-16e-instruct"  # any Groq multimodal model
# DATABASE_URL="postgresql://..."                        # optional — see "Persistence" below
```

> ⚠️ **Security:** the key currently in `.env.local` was shared in plaintext during setup.
> Rotate it at <https://console.groq.com/keys> before deploying anywhere public.
> `.env.local` is gitignored and should never be committed.

> 📌 **Package note:** the spec referenced `@groq/groq-sdk`; the real published package is
> **`groq-sdk`**, which is what this project installs and imports.

---

## 🧱 Architecture

```
src/
├── app/
│   ├── layout.tsx              # fonts + <TrackerProvider>
│   ├── page.tsx                # renders <Dashboard>
│   ├── globals.css             # Tailwind + design tokens
│   └── api/
│       ├── log-text/route.ts   # POST → Groq Llama text → JSON items
│       └── log-vision/route.ts # POST (image data URL) → Groq vision → JSON items
├── components/                 # Dashboard, MacroSummary, ReviewModal, MealCard, …
└── lib/
    ├── groq.ts                 # server-only Groq client, prompts, JSON hardening
    ├── store.tsx               # React context backed by localStorage (CRUD + learning)
    ├── tdee.ts                 # adaptive TDEE (weight-trend × intake regression)
    ├── streak.ts               # consecutive-day streak logic
    ├── corrections.ts          # diffing edits → few-shot examples
    ├── nutrition.ts            # macro math, Mifflin–St Jeor, auto-targets
    ├── macros.ts / date.ts     # presentation + local-day helpers
    └── prisma.ts               # optional DB client (not imported by the running app)
prisma/schema.prisma            # Users, Profiles, DailyLogs, FoodItems, WeightLogs, UserCorrections
```

### How the AI routes enforce JSON
Both routes call Groq with `response_format: { type: "json_object" }`, a strict system
prompt, and a hardened `extractJson()` that tolerates code fences / stray text as a
fallback. Items are normalized (numbers coerced, negatives clamped, empty rows dropped)
before they ever reach the UI.

### How the learning loop works
1. The AI returns items → you adjust them in the **Incoming Log Review** modal.
2. On commit, `diffCorrections()` compares your values to the AI's and records meaningful
   deltas (e.g. *chicken breast protein: 30 g → 45 g*).
3. `topCorrections()` picks your 5 most-frequent corrections; the client sends them with
   the next request, and `correctionsToPromptLines()` injects them as few-shot guidance.

---

## 🗄️ Persistence (optional, production)

The app ships persisting to `localStorage` so it runs instantly. To move to a real
database (multi-device, server-side):

1. Point `DATABASE_URL` at a Supabase/Postgres instance in `.env.local`.
2. Generate the client and push the schema:
   ```bash
   npm run db:generate
   npm run db:push      # or: npx prisma migrate dev
   ```
3. Swap the `localStorage` operations in `src/lib/store.tsx` for calls to API routes that
   read/write via `src/lib/prisma.ts`. The schema in `prisma/schema.prisma` already models
   `User`, `Profile`, `DailyLog`, `FoodItem`, `WeightLog`, and `UserCorrection`.

---

## 🧪 Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build & serve |
| `npm run lint` | Next.js ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to your database |
| `npm run db:studio` | Open Prisma Studio |

---

## 📝 Notes & limitations
- AI macro estimates are approximations — the review step and learning loop exist precisely
  because no model is perfect on portions. Treat numbers as guidance.
- Groq vision model availability changes over time; if `GROQ_VISION_MODEL` is retired, set a
  current multimodal model id from <https://console.groq.com/docs/models>.
- Browser storage is per-device and per-browser. Use the Prisma layer for real accounts.
