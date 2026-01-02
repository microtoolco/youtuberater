-- Transcript Caching Tables
-- Migration: 001_transcript_tables
-- Created: 2024-01-01

-- Video Transcripts table
CREATE TABLE IF NOT EXISTS video_transcripts (
  video_id TEXT PRIMARY KEY,
  language TEXT,
  segments_json JSONB,
  full_text TEXT,
  source TEXT NOT NULL DEFAULT 'innertube',
  status TEXT NOT NULL DEFAULT 'available',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('available', 'unavailable', 'processing'))
);

-- Transcript Insights table
CREATE TABLE IF NOT EXISTS transcript_insights (
  video_id TEXT PRIMARY KEY,
  insights_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Foreign key (optional, since we might cache insights even if transcript expires)
  CONSTRAINT fk_video_transcript
    FOREIGN KEY (video_id)
    REFERENCES video_transcripts(video_id)
    ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_transcripts_expires
  ON video_transcripts(expires_at);

CREATE INDEX IF NOT EXISTS idx_transcripts_status
  ON video_transcripts(status);

CREATE INDEX IF NOT EXISTS idx_insights_expires
  ON transcript_insights(expires_at);

-- Function to clean up expired entries (can be called by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_transcripts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM video_transcripts
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE video_transcripts IS 'Cached YouTube video transcripts with TTL';
COMMENT ON TABLE transcript_insights IS 'Extracted insights from video transcripts';
COMMENT ON COLUMN video_transcripts.segments_json IS 'Array of transcript segments with timestamps';
COMMENT ON COLUMN video_transcripts.status IS 'available = transcript cached, unavailable = no captions, processing = currently fetching';
COMMENT ON COLUMN transcript_insights.insights_json IS 'Extracted insights: keyMoments, steps, tools, pitchSignals, contentDensity';
