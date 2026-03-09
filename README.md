# bystander

**AI emergency handoff in seconds** Point your phone at an emergency scene and get instant severity assessment, step-by-step first aid guidance, and automated alerts to nearby first aiders.

Built at **Hack Canada 2026** to tackle a real Canadian challenge: improving emergency response times in areas where professional help may be minutes away.

## What It Does:

1. **Capture** — Record a live video or upload one showing the emergency scene
2. **AI Triage** — Gemini 2.5 Flash analyzes the scene to assess injuries, consciousness, bleeding, and body position, producing a severity score from 1-10
3. **Biometric Vitals** — Presage SmartSpectra extracts heart rate and breathing rate directly from the video, no wearables needed
4. **Dashboard** — Displays a full triage breakdown: severity banner, detected injuries, risk flags, and prioritized first aid steps
5. **AI First Aid Coach** — Chat or use voice mode to get real-time, directive guidance from an AI that talks like a 911 dispatcher
6. **Crowdsource Alerts** — When severity hits 8+, registered first aiders in the area are automatically notified via SMS with incident details and location
7. **Incident Report** — Generates a printable ER-ready report with all triage data and chat transcript

## How It Works

```
Camera/Upload → Frame Extraction → Gemini Vision Analysis
                                  ↘
                Video → Cloudinary → Presage SmartSpectra
                                  ↘
                        Merged Triage Data → Dashboard
                                           → SMS Alert (if critical)
                                           → AI Coach (Gemini + ElevenLabs TTS)
                                           → Incident Report
```

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, Framer Motion
- **Backend:** Node.js, Express
- **AI/ML:** Google Gemini 2.5 Flash (vision + chat), Presage SmartSpectra (contactless vitals)
- **Voice:** ElevenLabs (text-to-speech), Web Speech API (speech-to-text)
- **Media:** Cloudinary (video upload, storage, playback)
- **Alerts:** Twilio (SMS notifications)

## Getting Started

### Prerequisites

- Node.js 18+
- API keys for: Gemini, ElevenLabs, Cloudinary, Presage, Twilio

### Install

```bash
git clone https://github.com/hackcanada2026-aaaa/submission.git
cd submission/pulselink

# Frontend
npm install

# Backend
cd server
npm install
```

### Configure

Create a `.env` file in the project root with:

```
VITE_GEMINI_API_KEY=
VITE_ELEVENLABS_API_KEY=
VITE_ELEVENLABS_VOICE_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
PRESAGE_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NOTIFY_PHONE_NUMBER=
```

### Run

```bash
# Terminal 1 — Backend
cd server && node index.js

# Terminal 2 — Frontend
npm run dev
```

Open `http://localhost:5173` on your phone or browser.

## Team

Built by **Team AAAA** at Hack Canada 2026, SPUR Innovation Centre, Waterloo.
