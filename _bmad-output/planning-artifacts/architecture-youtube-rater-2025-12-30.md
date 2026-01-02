---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: ["product-brief-youtube-rater-2025-12-30.md"]
workflowType: 'architecture'
project_name: YouTube Rater
date: 2025-12-30
---

# YouTube Rater - Technical Architecture

## System Overview

YouTube Rater is a web application that analyzes YouTube videos to determine their quality and helpfulness before users invest time watching them.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│  ┌─────────────┐  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │  URL Input  │→ │  Analysis Dashboard │→ │   Score + Details    │ │
│  └─────────────┘  └─────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API LAYER (Next.js)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐│
│  │ /api/analyze │  │ /api/score   │  │ /api/video-metadata        ││
│  └──────────────┘  └──────────────┘  └────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ANALYSIS ENGINE                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │
│  │ MetadataParser │  │ TextAnalyzer   │  │ PatternMatcher      │   │
│  │ - video info   │  │ - NLP scoring  │  │ - red flag detection│   │
│  │ - channel data │  │ - gatekeeping  │  │ - 10:01 videos      │   │
│  └────────────────┘  └────────────────┘  └─────────────────────┘   │
│  ┌────────────────┐  ┌────────────────┐                            │
│  │ CommentParser  │  │ ThumbnailCheck │                            │
│  │ - sentiment    │  │ - wealth-flex  │                            │
│  │ - warnings     │  │ - clickbait    │                            │
│  └────────────────┘  └────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                                │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │
│  │ YouTube Data   │  │ OpenAI API     │  │ Supabase            │   │
│  │ API v3         │  │ (NLP analysis) │  │ (caching/auth)      │   │
│  └────────────────┘  └────────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Components

```
app/
├── page.tsx                    # Landing page with URL input
├── analyze/
│   └── page.tsx                # Analysis results dashboard
├── components/
│   ├── url-input.tsx           # YouTube URL input field
│   ├── score-gauge.tsx         # Main 0-100 score display
│   ├── red-flags-panel.tsx     # Red flag indicators
│   ├── metrics-grid.tsx        # Individual metric cards
│   ├── comment-highlights.tsx  # Warning comments display
│   └── video-preview.tsx       # Thumbnail + basic info
└── api/
    ├── analyze/route.ts        # Main analysis endpoint
    └── video-info/route.ts     # Quick metadata fetch
```

### 2. Analysis Engine Modules

```typescript
// lib/analyzers/
├── index.ts                    // Orchestrates all analyzers
├── metadata-analyzer.ts        // Video length, views, channel age
├── text-analyzer.ts            // Title/description NLP
├── pattern-matcher.ts          // Known red flag patterns
├── comment-analyzer.ts         // Top comment sentiment
└── score-calculator.ts         // Weighted final score
```

---

## Data Flow

### Analysis Request Flow

```
1. User pastes URL → Frontend
2. Frontend calls POST /api/analyze { url }
3. API extracts video ID from URL
4. API calls YouTube Data API for metadata
5. Analysis Engine runs all analyzers in parallel
6. Score Calculator combines results
7. Response returns to frontend
8. Dashboard renders results
```

### Scoring Algorithm

```typescript
interface AnalysisResult {
  overallScore: number;          // 0-100
  breakdown: {
    contentQuality: number;      // 0-25 points
    creatorTrust: number;        // 0-25 points
    engagementHealth: number;    // 0-25 points
    redFlagPenalty: number;      // 0-25 points deducted
  };
  redFlags: RedFlag[];
  highlights: string[];
  recommendation: 'watch' | 'caution' | 'skip';
}

interface RedFlag {
  type: 'length_gaming' | 'disabled_comments' | 'clickbait' |
        'gatekeeping' | 'wealth_flex' | 'course_pitch';
  severity: 'low' | 'medium' | 'high';
  description: string;
}
```

---

## API Design

### POST /api/analyze

**Request:**
```json
{
  "url": "https://youtube.com/watch?v=abc123"
}
```

**Response:**
```json
{
  "success": true,
  "videoId": "abc123",
  "video": {
    "title": "How to Make $10K/Month",
    "channel": "GrowthGuru",
    "views": 1500000,
    "likes": 45000,
    "duration": "10:01",
    "publishedAt": "2024-01-15",
    "thumbnail": "https://..."
  },
  "analysis": {
    "overallScore": 42,
    "recommendation": "caution",
    "breakdown": {
      "contentQuality": 15,
      "creatorTrust": 12,
      "engagementHealth": 20,
      "redFlagPenalty": -5
    },
    "redFlags": [
      {
        "type": "length_gaming",
        "severity": "medium",
        "description": "Video is exactly 10:01 (ad threshold gaming)"
      },
      {
        "type": "gatekeeping",
        "severity": "high",
        "description": "Title promises specific outcome with vague delivery"
      }
    ],
    "highlights": [
      "Comment: 'Watched the whole thing, it's just a course pitch'",
      "Channel has 3 'make money' videos in last month"
    ]
  }
}
```

---

## Database Schema (Supabase)

### Tables

```sql
-- Cache analyzed videos (reduce API calls)
CREATE TABLE video_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT UNIQUE NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Track usage (for rate limiting)
CREATE TABLE analysis_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET,
  user_id UUID REFERENCES auth.users(id),
  video_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User saved analyses (future feature)
CREATE TABLE saved_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  video_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Red Flag Detection Rules

### Pattern Definitions

| Pattern | Detection Method | Severity |
|---------|-----------------|----------|
| **10:01 Video** | Duration = 601-610 seconds | Medium |
| **Disabled Comments** | commentCount = null/disabled | High |
| **Wealth Thumbnails** | Keywords in title + high view ratio | Medium |
| **Gatekeeping Language** | NLP patterns: "secret", "method", "revealed" | High |
| **Course Pitch** | Description contains course/program links | Medium |
| **Low Engagement Ratio** | likes/views < 2% | Low |
| **New Channel, Big Claims** | Channel age < 1yr + income claims | High |

### NLP Gatekeeping Patterns

```typescript
const GATEKEEPING_PHRASES = [
  /how i made \$[\d,]+/i,
  /secret (method|strategy|trick)/i,
  /no one is telling you/i,
  /what they don't want you to know/i,
  /link in (description|bio)/i,
  /sign up for my (course|program|coaching)/i,
  /limited spots available/i,
];
```

---

## Tech Stack Summary

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 16 + React 19 | Existing project foundation |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development |
| **Backend** | Next.js API Routes | Unified codebase |
| **Database** | Supabase (PostgreSQL) | Already integrated |
| **Auth** | Supabase Auth | Already integrated |
| **AI/NLP** | OpenAI API | Text analysis |
| **External API** | YouTube Data API v3 | Video metadata |
| **Hosting** | Vercel | Zero-config deploys |

---

## MVP Implementation Phases

### Phase 1: Core Analysis (Day 1-2)
- [ ] URL input component
- [ ] Video metadata fetcher
- [ ] Basic scoring algorithm
- [ ] Score display gauge

### Phase 2: Red Flag Detection (Day 2-3)
- [ ] Pattern matcher for known red flags
- [ ] 10:01 detection
- [ ] Gatekeeping language NLP
- [ ] Red flags panel UI

### Phase 3: Polish & Cache (Day 3-4)
- [ ] Comment analysis integration
- [ ] Results caching (Supabase)
- [ ] Loading states
- [ ] Error handling

### Phase 4: Launch (Day 4-5)
- [ ] Rate limiting
- [ ] Analytics tracking
- [ ] Final UI polish
- [ ] Deploy to production

---

## Security Considerations

1. **API Key Protection**: YouTube API key server-side only
2. **Rate Limiting**: Max 10 analyses/hour per IP (unauthenticated)
3. **Input Validation**: Strict URL parsing, reject non-YouTube URLs
4. **No User Data Storage**: Analysis results not tied to users (MVP)

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Analysis Response Time | < 5 seconds |
| Cache Hit Response | < 500ms |
| First Contentful Paint | < 1.5s |
| Lighthouse Score | > 90 |

---

*Architecture Status: COMPLETE*
*Ready for: Implementation*
