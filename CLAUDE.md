# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## BMAD Workflow (Primary Development Method)

This project uses the **BMAD (BMad Master) methodology** for structured AI-assisted development. BMAD provides workflow orchestration across four phases with specialized agents.

### Quick Start Commands

```bash
# Start the BMad Master orchestrator
/bmad/core/agents/bmad-master

# Or invoke specific workflows directly:
/bmad/bmm/workflows/workflow-status       # Check current project status
/bmad/bmm/workflows/create-tech-spec      # Create implementation-ready spec
/bmad/bmm/workflows/quick-dev             # Flexible development mode
/bmad/bmm/workflows/dev-story             # Execute a story
/bmad/bmm/workflows/code-review           # Adversarial code review
```

### BMAD Phases & Key Workflows

**Phase 1 - Analysis:**
- `create-product-brief` - Collaborative product brief creation
- `research` - Market, technical, or domain research

**Phase 2 - Planning:**
- `create-prd` - Product Requirements Document
- `create-ux-design` - UX patterns and design system

**Phase 3 - Solutioning:**
- `create-architecture` - Architecture decisions for AI consistency
- `create-epics-and-stories` - Break PRD into implementation stories
- `check-implementation-readiness` - Validate before implementation

**Phase 4 - Implementation:**
- `sprint-planning` - Generate sprint tracking
- `create-story` / `dev-story` - Story creation and execution
- `code-review` - Adversarial senior dev review
- `retrospective` - Post-epic learning capture

**Quick Flow (Lightweight):**
- `create-tech-spec` - Conversational spec engineering
- `quick-dev` - Direct implementation with optional planning

### BMAD Agents

Invoke via `/bmad/bmm/agents/<agent>`:
- `analyst` - Business analysis
- `architect` - Technical architecture
- `pm` - Product management
- `dev` - Development
- `sm` - Scrum master
- `ux-designer` - UX/UI design
- `tea` - Test architecture
- `tech-writer` - Documentation

### BMAD Configuration

Config: `_bmad/bmm/config.yaml`
- Output folder: `_bmad-output/`
- Planning artifacts: `_bmad-output/planning-artifacts/`
- Implementation artifacts: `_bmad-output/implementation-artifacts/`

### Workflow Execution Rules

1. **Step-file architecture**: Each step is a self-contained instruction file
2. **Sequential execution**: Never skip steps or optimize sequence
3. **Just-in-time loading**: Only load current step file
4. **State tracking**: Update `stepsCompleted` in output frontmatter
5. **Template-output checkpoints**: Save after each template-output tag, wait for user

---

## Project Overview

**Tuborial** is a Next.js 16 application that converts YouTube tutorials into printable step-by-step guides with tools lists and materials.

## Development Commands

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## Architecture

### Core Flow
1. User submits YouTube URL → `app/dashboard/page.tsx`
2. API processes → `app/api/convert/route.ts`:
   - Extract video ID (`lib/youtube.ts`)
   - Get transcript: YouTube captions first, then fallback chain in `lib/transcribe.ts` (Kome.ai → Superpowered → RapidAPI+AssemblyAI)
   - Generate guide via Groq AI (`lib/groq.ts`, model: llama-3.3-70b-versatile)
   - Save to Supabase `guides` table
3. Display via `components/guide/GuidePreview.tsx`

### Key Files
- `lib/youtube.ts` - Video ID extraction, oEmbed info, transcript fetch
- `lib/groq.ts` - AI guide generation with skill-level adaptation
- `lib/transcribe.ts` - Multi-method transcription fallbacks
- `lib/prompts/guide.ts` - Skill-level adaptive extraction prompt
- `types/index.ts` - Core types (GuideContent, SkillLevel, Stats)

### Auth & Billing
- Supabase Auth (email/password + Google OAuth)
- Middleware (`middleware.ts`) protects `/dashboard`, redirects auth users
- Lemon Squeezy payments: checkout (`/api/checkout`), webhook (`/api/webhook`)
- Plans: `free` (3 total), `monthly` (50/mo), `lifetime` (100/mo)

### Database Tables (Supabase)
- `users`: id, email, plan, credits, lemon_customer_id
- `guides`: id, user_id, video_url, video_id, guide_content (JSON), status, used_whisper

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

Optional (Pro features):
- `RAPIDAPI_KEY`, `ASSEMBLYAI_API_KEY`
- `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_WEBHOOK_SECRET`

## Path Alias

`@/` → project root (tsconfig.json)
