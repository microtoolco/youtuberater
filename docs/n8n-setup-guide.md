# n8n Setup Guide for Tuborial

## Overview

This n8n workflow extracts YouTube transcripts for videos without captions. It tries multiple methods:
1. **YouTube Transcript API** - Fast, free
2. **yt-dlp subtitles** - Downloads auto-generated captions
3. **Whisper transcription** - Downloads audio and transcribes (costs ~$0.006/min)

## Prerequisites

- n8n instance (cloud or self-hosted)
- yt-dlp installed on n8n server (for self-hosted)
- OpenAI API key (for Whisper fallback)

## Quick Setup

### 1. Import the Workflow

1. Open n8n
2. Go to **Workflows** → **Import from File**
3. Select `n8n-workflow.json` from this folder
4. Click **Import**

### 2. Configure Credentials

**OpenAI API (for Whisper):**
1. Go to **Credentials** → **Add Credential**
2. Select **OpenAI API**
3. Enter your API key
4. Save

### 3. Activate the Workflow

1. Open the imported workflow
2. Click **Active** toggle (top right)
3. Copy the webhook URL (shown in the Webhook node)

### 4. Add to Vercel

Add this environment variable to your Vercel project:

```
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/tuborial-transcript
```

Then redeploy.

---

## Simplified Workflow (Manual Setup)

If the import doesn't work, create this workflow manually:

### Node 1: Webhook (Trigger)
- **Type:** Webhook
- **HTTP Method:** POST
- **Path:** `tuborial-transcript`
- **Response Mode:** Response Node

### Node 2: HTTP Request (Get Transcript)
- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://api.kome.ai/api/tools/youtube-transcripts`
- **Body:** JSON
```json
{
  "video_id": "{{ $json.videoId }}",
  "format": true
}
```

### Node 3: Code (Format Response)
- **Type:** Code
- **Language:** JavaScript
```javascript
const input = $input.first().json;
let transcript = '';

try {
  if (input.transcript) {
    if (Array.isArray(input.transcript)) {
      transcript = input.transcript.map(t => t.text || t).join(' ');
    } else {
      transcript = String(input.transcript);
    }
  }
} catch (e) {
  console.log('Parse error:', e);
}

return {
  success: transcript.length > 50,
  transcript: transcript || null,
  error: transcript.length > 50 ? null : 'Failed to get transcript'
};
```

### Node 4: Respond to Webhook
- **Type:** Respond to Webhook
- **Response Body:** `{{ JSON.stringify($json) }}`

---

## Testing

1. Activate the workflow
2. Send a test request:

```bash
curl -X POST https://your-n8n.com/webhook/tuborial-transcript \
  -H "Content-Type: application/json" \
  -d '{"videoId": "dQw4w9WgXcQ", "videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ", "action": "get_transcript"}'
```

Expected response:
```json
{
  "success": true,
  "transcript": "We're no strangers to love..."
}
```

---

## Self-Hosted with yt-dlp

For self-hosted n8n with yt-dlp installed:

### Execute Command Node
```bash
yt-dlp --write-auto-sub --skip-download --sub-lang en \
  -o "/tmp/{{ $json.videoId }}" "{{ $json.videoUrl }}" \
  && cat /tmp/{{ $json.videoId }}.en.vtt
```

Then parse the VTT format in a Code node.

---

## Troubleshooting

**Webhook not responding:**
- Make sure workflow is **Active**
- Check the webhook URL is correct
- Test with curl first

**No transcript returned:**
- Some videos have transcripts disabled
- Try the yt-dlp method instead
- Check n8n execution logs

**Timeout errors:**
- Increase timeout in Tuborial's fetch call
- Use n8n's async webhook mode

---

## Cost Estimates

| Method | Cost |
|--------|------|
| Transcript API | Free |
| yt-dlp | Free |
| Whisper | ~$0.006/min |

A 10-minute video costs ~$0.06 with Whisper.
