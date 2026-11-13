# Somotoz

Somotoz is a personal workspace that brings daily journaling, an AI assistant, human-to-human chat, and simple focus utilities together in one app.

I built it because I wanted one calm place to write daily notes, brainstorm with AI, and talk with real people without switching across five different tools. It is meant for adults (18+) who want a quiet space for journaling, learning, and personal conversations.

Built by Som Maurya.

---

## Table of Contents

- [What is inside](#what-is-inside)
- [System architecture and flows](#system-architecture-and-flows)
  - [1. Full-stack overview](#1-full-stack-overview)
  - [2. Ask AI and media fallback flow](#2-ask-ai-and-media-fallback-flow)
  - [3. Admin authentication and authorization flow](#3-admin-authentication-and-authorization-flow)
  - [4. Theme switcher flow](#4-theme-switcher-flow)
  - [5. Firebase Auth and Firestore access flow](#5-firebase-auth-and-firestore-access-flow)
  - [6. Activity audit logging flow](#6-activity-audit-logging-flow)
  - [7. Voice transcription flow](#7-voice-transcription-flow)
  - [8. Procedural ambient soundscape synthesis](#8-procedural-ambient-soundscape-synthesis)
- [Models used](#models-used)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Deploying to Google Cloud Run](#deploying-to-google-cloud-run)
- [Privacy and safety](#privacy-and-safety)
- [Known limitations](#known-limitations)
- [License](#license)

---

## What is inside

*(Real screenshots of each screen will be added here later.)*

- **Home**: Your starting dashboard with a time-aware greeting, quick links to Ask AI and Journal, recent entries, and a quick look at your journaling streak.
  - *[Screenshot placeholder: Home dashboard]*
- **Chats (SomoChat)**: A directory and messaging space for real users (no bot profiles). Includes public room, peer discovery, connection requests before direct messaging, blocking, reporting, and WebRTC voice/video calls.
  - *[Screenshot placeholder: Chats screen]*
- **Ask AI**: A chat terminal with four modes (`Chat`, `Image`, `Video`, `Music`), file/image attachments, speech-to-text input, and PDF export.
  - **Image Generator** creates SVG vector art using Gemini text/SVG prompts (and falls back to procedural SVG if the API is busy). If you configure an optional `HF_TOKEN`, it can also call a Hugging Face image model and fall back to SVG on limits or errors.
  - **Video Simulator** renders an HTML5 canvas animation with keyframe scenes and a playback scrubber (or uses an optional Hugging Face video model only when `HF_VIDEO_MODEL` and `HF_TOKEN` are explicitly set).
  - **Music Synthesizer** generates procedural Web Audio API melodies and oscillator chords (or uses an optional Hugging Face audio model when `HF_TOKEN` is set).
  - *[Screenshot placeholder: Ask AI terminal]*
- **Journal**: Private daily notes stored per user in Firestore, with offline caching via the PWA service worker, optional voice recording transcription, mood tags, and AI reflection summaries.
  - *[Screenshot placeholder: Journal editor and detail view]*
- **Discover**: Combines the **Knowledge Hub** (web-grounded Q&A via Gemini + Google Search), **Soundscapes** (ambient Web Audio noise/oscillator generator with a focus timer), and rotating quotes.
  - *[Screenshot placeholder: Discover hub]*
- **Profile**: Account details, compressed avatar uploads (<300 KB), mood/accent preferences, 30-day username change cooldown, JSON data export ("Download My Data"), Privacy Policy / Terms links, and scheduled account deletion.
  - *[Screenshot placeholder: Profile and settings]*

---

## System architecture and flows

### 1. Full-stack overview

```text
+-------------------------------------------------------------------+
|                     React 19 + Vite Frontend                      |
|  Home  |  Chats  |  Ask AI  |  Journal  |  Discover  |  Profile   |
+---------------------------------+---------------------------------+
                                  |
          +-----------------------+-----------------------+
          | Firebase Client SDK                           | HTTP / SSE + Bearer ID Token
          v                                               v
+---------------------------------+     +---------------------------------+
|   Firebase Auth & Firestore     |     |   Express Server (server.ts)    |
|  • Google Sign-In               |     |  • Port 3000 (Vite dev / dist)  |
|  • Real-time chats & journals   |     |  • Firebase Admin token check   |
|  • Client security rules        |     |  • Gemini & optional HF proxies |
+---------------------------------+     +---------------------------------+
```

### 2. Ask AI and media fallback flow

```mermaid
flowchart TD
    UserReq([User submits prompt]) --> Router{Selected mode}

    Router -->|Chat| StreamEP[POST /api/chat/stream]
    StreamEP --> ModelL1[GEMINI_MODEL or gemini-3.1-flash-lite]
    ModelL1 -- SSE chunks --> SSEOut[Render streamed reply]
    ModelL1 -- Error / 429 / 503 --> ModelL2[Fallback: gemini-3.7-flash then gemini-flash-latest]
    ModelL2 -- Stream failure --> ChatFallback[Non-streaming /api/chat fallback]
    ChatFallback -- All models unavailable --> ProcChat[Procedural offline reply]

    Router -->|Image| ImgChoice{HF_TOKEN set?}
    ImgChoice -- Yes --> HFImg[POST /api/generate/image]
    HFImg -- Success --> RasterImg[Display raster image]
    HFImg -- Limit / Busy --> SvgChat[POST /api/chat mode: image]
    ImgChoice -- No --> SvgChat
    SvgChat --> SvgRender[SVG art + PNG/SVG download]

    Router -->|Video| VidChoice{HF_TOKEN and HF_VIDEO_MODEL set?}
    VidChoice -- Yes --> HFVid[POST /api/generate/video]
    HFVid -- Success --> VideoEl[Inline video player]
    HFVid -- Unavailable / Busy --> CanvasChat[POST /api/chat mode: video]
    VidChoice -- No --> CanvasChat
    CanvasChat --> CanvasSim[CanvasVideoSimulator HTML5 animation]

    Router -->|Music| MusChoice{HF_TOKEN set?}
    MusChoice -- Yes --> HFMus[POST /api/generate/music]
    HFMus -- Success --> AudioEl[Inline audio player]
    HFMus -- Limit / Busy --> SynthChat[POST /api/chat mode: music]
    MusChoice -- No --> SynthChat
    SynthChat --> WebAudio[MusicSynthesizer Web Audio notes]
```

### 3. Admin authentication and authorization flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin User (<admin-email>)
    participant Client as React Client (AdminDashboard)
    participant AuthSDK as Firebase Auth SDK
    participant Server as Express Server (server.ts)
    participant AdminSDK as Firebase Admin SDK
    participant Firestore as Firestore

    Admin->>Client: Open Admin view
    Client->>AuthSDK: currentUser.getIdToken(true)
    AuthSDK-->>Client: Signed Firebase ID token
    Client->>Server: GET /api/admin/users (Authorization: Bearer token)
    Server->>AdminSDK: verifyIdToken(token, checkRevoked = true)

    alt Token missing, invalid, or lacks admin custom claim
        AdminSDK-->>Server: Rejected
        Server-->>Client: 401 or 403 JSON error
    else Valid token with admin: true and email_verified: true
        AdminSDK-->>Server: Decoded token
        Server->>AdminSDK: listUsers()
        Server->>Firestore: Query user metrics, reports, and logs
        Server-->>Client: 200 OK JSON payload
        Client-->>Admin: Render Admin Dashboard
    end
```

### 4. Theme switcher flow

```mermaid
flowchart LR
    Init([App mount]) --> CheckSession{Manual override in sessionStorage?}

    CheckSession -- Yes --> ApplyManual[Apply Day, Night, or Eye Comfort override]
    CheckSession -- No --> ReadClock[Read local system time]

    ReadClock --> TimeDecision{Current local hour}
    TimeDecision -- 06:00 - 16:59 --> DayTheme[Auto Day mode]
    TimeDecision -- 17:00 - 19:59 --> EyeComfort[Auto Eye Comfort mode]
    TimeDecision -- 20:00 - 05:59 --> NightTheme[Auto Night mode]

    UserClick[User clicks theme switcher] --> SaveSession[Save selection to sessionStorage]
    SaveSession --> ActiveState[Update CSS variables]
```

### 5. Firebase Auth and Firestore access flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Signed-in User
    participant App as React Client
    participant Auth as Firebase Auth
    participant Rules as firestore.rules
    participant DB as Cloud Firestore

    User->>App: Sign in with Google
    App->>Auth: signInWithPopup(GoogleAuthProvider)
    Auth-->>App: User session and UID
    App->>DB: Subscribe to users/{uid}/entries
    DB->>Rules: Check request.auth.uid == userId
    Rules-->>DB: Allow owner read/write
    DB-->>App: Sync user journal entries
    App-->>User: Render Journal and Home views
```

### 6. Activity audit logging flow

```mermaid
flowchart TD
    UserQuery[User runs Chat, Search, Reflection, or Media generation] --> SendReq[Send request with Firebase ID token]
    SendReq --> SrvAuth[server.ts: authenticateUserRequest]
    SrvAuth --> Verify[Verify ID token via Admin SDK or Identity Toolkit]
    Verify --> RunAI[Execute Gemini or Hugging Face request]
    RunAI --> AuditRecord[Build summary log entry]
    AuditRecord --> FSStore[(Firestore: admin_activity_logs)]
```

### 7. Voice transcription flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Mic as Browser MediaRecorder
    participant UI as ReflectionEditor
    participant Server as Express POST /api/transcribe
    participant Gemini as Gemini Transcription Ladder

    User->>Mic: Click record and speak
    Mic->>UI: Capture audio/webm chunks
    User->>UI: Stop recording
    UI->>UI: Convert audio blob to Base64
    UI->>Server: POST /api/transcribe { audioBase64, mimeType }
    Server->>Gemini: Try gemini-3.5-transcribe then flash fallbacks
    Gemini-->>Server: Transcribed text
    Server-->>UI: JSON { success: true, transcription }
    UI-->>User: Insert text into journal editor
```

### 8. Procedural ambient soundscape synthesis

```mermaid
flowchart TD
    UserAction[User starts a soundscape preset] --> InitCtx[Create browser Web AudioContext]
    InitCtx --> SynthModule[soundSynthesizer.ts]

    subgraph Web Audio Graph
        SynthModule --> SineOsc[Sine and triangle oscillators]
        SynthModule --> NoiseGen[Brownian and pink noise buffers]
        SynthModule --> FilterNode[Biquad low-pass filter]
        SynthModule --> GainNode[Gain envelope control]
    end

    SineOsc --> OutputNode[AudioContext destination]
    NoiseGen --> OutputNode
    FilterNode --> OutputNode
    GainNode --> OutputNode
```

---

## Models used

All Gemini calls use `@google/genai` on the server with ordered fallbacks defined in `server.ts`:

- **Text chat & journal reflections** (`CHAT_MODELS`, `REFLECTION_MODELS`):
  1. `GEMINI_MODEL` (if set in environment variables)
  2. `gemini-3.1-flash-lite`
  3. `gemini-3.7-flash`
  4. `gemini-flash-latest`
  5. Procedural text fallback when all upstream models fail or no API key is configured.
- **Audio transcription** (`TRANSCRIBE_MODELS`):
  1. `gemini-3.5-transcribe`
  2. `gemini-3.1-flash-lite`
  3. `gemini-3.7-flash`
  4. `gemini-flash-latest`
- **Ask AI Image SVG generation** (`/api/chat` with `mode: "image"`):
  1. `gemini-4-hydrogen`
  2. `gemini-3.1-flash-lite`
  3. `gemini-flash-latest`
  4. `gemini-3.7-flash`
  5. Procedural SVG generator fallback (`generateProceduralSvg`).
- **Optional Hugging Face media routes** (`/api/generate/*`, active only if `HF_TOKEN` is set):
  - Image: `HF_IMAGE_MODEL` (default `black-forest-labs/FLUX.1-schnell`)
  - Music: `HF_MUSIC_MODEL` (default `facebook/musicgen-small`)
  - Video: `HF_VIDEO_MODEL` (empty by default; disabled unless explicitly set)

---

## Project structure

```text
somotoz/
├── .env.example                 # Environment variable template (no real secrets)
├── .gitignore                   # Ignores node_modules, dist, .env*, service account JSONs
├── README.md                    # Documentation
├── firebase-applet-config.json  # Client Firebase web configuration
├── firebase-blueprint.json      # Firestore collection schema reference
├── firestore.rules              # Firestore security rules
├── index.html                   # HTML shell and initial theme pre-paint script
├── metadata.json                # App metadata and browser permissions
├── package.json                 # Dependencies, Node engine, and build/dev scripts
├── server.ts                    # Unified Express backend + Vite middleware (dev) / dist (prod)
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite + Tailwind v4 + vite-plugin-pwa config
└── src/
    ├── App.tsx                  # Auth gate, routing, onboarding, journal & view coordinator
    ├── main.tsx                 # React entry point
    ├── index.css                # Tailwind v4 imports and theme variables
    ├── types.ts                 # Shared TypeScript interfaces
    ├── config/
    │   └── adminConfig.ts       # Client-side admin configuration
    ├── context/
    │   └── ThemeContext.tsx     # Auto clock-based & session override theme provider
    ├── hooks/
    │   └── useOnlineStatus.ts   # /api/health + navigator connectivity monitor
    ├── lib/
    │   ├── adminService.ts      # Admin API calls and activity logging client helpers
    │   ├── apiClient.ts         # Centralized fetch wrapper with Firebase ID token injection
    │   ├── firebase.ts          # Firebase Web SDK initialization
    │   ├── offlineJournalSync.ts# Local journal queue and sync helper
    │   └── soundSynthesizer.ts  # Web Audio API soundscape generator
    └── components/
        ├── Dashboard.tsx        # Home view
        ├── Somochat.tsx         # Chats view (directory, DMs, public room, calls)
        ├── ChatCompanion.tsx    # Ask AI view
        ├── ReflectionEditor.tsx # Journal writer & audio recorder
        ├── ReflectionDetail.tsx # Journal reader & PDF export
        ├── DiscoverView.tsx     # Knowledge Hub, Soundscapes, and Quotes tabs
        ├── ProfileView.tsx      # Profile, privacy settings, data export, account deletion
        ├── Navbar.tsx           # Top header with offline indicator and theme switcher
        ├── NavigationRail.tsx   # Desktop left rail & mobile bottom navigation bar
        ├── admin/               # AdminDashboard
        ├── media/               # CanvasVideoSimulator & MusicSynthesizer
        └── pwa/                 # OfflineModeIndicator & PWA install prompt
```

---

## Local setup

### Prerequisites

- **Node.js**: 20.x+ (see `engines` in `package.json`)
- **npm**
- A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/)
- A **Firebase project** with Authentication (Google provider) and Cloud Firestore enabled

### Steps

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/your-username/somotoz.git
   cd somotoz
   npm install
   ```

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Fill in at least `GEMINI_API_KEY` and your Firebase Admin credentials (or place your web config in `firebase-applet-config.json` / `VITE_FIREBASE_*` variables).

4. Start the local full-stack development server (Express + Vite middleware on port `3000`):
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

5. Run type checks and verify the production build:
   ```bash
   npm run lint
   npm run build
   npm start
   ```

---

## Environment variables

All variables are listed in `.env.example`.

**Important:** Never prefix secret keys (`GEMINI_API_KEY`, `HF_TOKEN`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_SERVICE_ACCOUNT`) with `VITE_`. Vite bundles every `VITE_*` variable into client-side JavaScript sent to the browser.

### Server-side variables (kept private on the server)

| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Yes (for live AI) | `YOUR_GEMINI_API_KEY` | Gemini API authentication |
| `GEMINI_MODEL` | No | `gemini-3.1-flash-lite` | Optional primary Gemini model override |
| `HF_TOKEN` | No | `""` | Enables `/api/generate/image` & `/api/generate/music` |
| `HF_IMAGE_MODEL` | No | `black-forest-labs/FLUX.1-schnell` | Hugging Face image model |
| `HF_MUSIC_MODEL` | No | `facebook/musicgen-small` | Hugging Face audio model |
| `HF_VIDEO_MODEL` | No | `""` | Enables `/api/generate/video` when non-empty |
| `DAILY_IMAGE_LIMIT` | No | `5` | Daily per-user HF image limit (UTC day) |
| `DAILY_MUSIC_LIMIT` | No | `3` | Daily per-user HF music limit (UTC day) |
| `DAILY_VIDEO_LIMIT` | No | `1` | Daily per-user HF video limit (UTC day) |
| `FIREBASE_PROJECT_ID` | Yes in prod | `your-firebase-project-id` | Firebase Admin target project |
| `FIREBASE_CLIENT_EMAIL` | Yes in prod* | `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com` | Firebase Admin service account email |
| `FIREBASE_PRIVATE_KEY` | Yes in prod* | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` | Firebase Admin private key |
| `FIREBASE_SERVICE_ACCOUNT` | Alternative* | `'{"type":"service_account",...}'` | Single-line JSON alternative to email + private key |
| `ADMIN_EMAIL` / `ADMIN_BOOTSTRAP_EMAIL` | For admin setup | `your-admin-email@example.com` | Email allowed to claim the bootstrap `admin: true` role |
| `CORS_ORIGIN` | Recommended in prod | `https://your-app-url.example.com` | Allowed browser origin(s) |
| `APP_URL` | No | `http://localhost:3000` | Public app URL |
| `RETENTION_DAYS` | No | `90` | Soft-deleted account retention window |

*\* Provide either `FIREBASE_SERVICE_ACCOUNT` or the `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` pair.*

### Client-side variables (`VITE_` prefix, public to browser)

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | If not using `firebase-applet-config.json` | Firebase Web SDK API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | If not using `firebase-applet-config.json` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | If not using `firebase-applet-config.json` | Firebase project ID |
| `VITE_TURN_SERVER_URL` | No | Optional WebRTC TURN server URL for voice/video calls |
| `VITE_TURN_USERNAME` | No | Optional WebRTC TURN username |
| `VITE_TURN_CREDENTIAL` | No | Optional WebRTC TURN credential |

---

## Deploying to Google Cloud Run

Somotoz is built as a unified Node.js + Express server (`server.ts`, compiled to `dist/server.cjs` and listening on port `3000`). Google Cloud Run is the primary supported deployment target.

> **Note on Vercel:** Do not deploy this repository to Vercel unless you refactor the Express server into standalone serverless functions. A persistent Express app with local `dist/` static serving and background tasks is intended for a container runtime like Cloud Run.

### 1. Enable required Google Cloud services

```bash
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
```

### 2. Store server secrets in Google Cloud Secret Manager

```bash
# Create and populate GEMINI_API_KEY
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run runtime service account access to read secrets
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Repeat the secret creation and IAM binding steps for `FIREBASE_PRIVATE_KEY` (and `HF_TOKEN` if you use Hugging Face media routes).

### 3. Deploy Firestore security rules

Deploy `firestore.rules` to your Firebase project before opening traffic:

```bash
firebase deploy --only firestore:rules --project your-firebase-project-id
```

### 4. Deploy to Cloud Run

```bash
gcloud run deploy somotoz \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production,FIREBASE_PROJECT_ID="your-firebase-project-id",FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com",ADMIN_EMAIL="your-admin-email@example.com",CORS_ORIGIN="https://your-cloud-run-url"
```

---

## Privacy and safety

- **18+ only**: Onboarding requires a date of birth and blocks accounts under 18 from completing setup or accessing SomoChat.
- **Human-only directory in Chats**: The `publicProfiles` directory only contains real registered accounts. AI features stay inside **Ask AI**.
- **Consent, blocking, and reporting**: Users must send and accept a connection request before direct messaging. Any user can block another peer or submit a safety report (`reports` / `somo_reports`).
- **Firestore rules isolation**:
  - Private journals (`users/{uid}/entries/{entryId}`), profiles, favourites, and activities are restricted to `request.auth.uid == userId`.
  - Conversations and WebRTC signaling subcollections are restricted to the two `participants`.
  - Audit logs and `hf_daily_usage` are locked on the client (`allow read, write: if false;`) and accessed only by the server via Firebase Admin SDK.
- **Admin boundaries**: Admins do not have client access to browse private journals or private chat history. Moderation operates on account metadata and user-attached report excerpts, with a 5-minute recent-auth check and immutable action logs.
- **Data export and deletion**: Users can download their data as JSON from **Profile** or schedule account deletion with a 90-day retention cleanup window.

---

## Known limitations

- **Chats are not end-to-end encrypted (E2EE)**: Direct messages are encrypted in transit over HTTPS/TLS and guarded by Firestore security rules, but they are stored in Firestore without client-side E2EE keys.
- **Free-tier API limits**: Gemini and optional Hugging Face free-tier quotas can return `429` rate limits or `503` service busy responses. When that happens, Ask AI steps down its model fallback list or switches to simpler procedural output.
- **Simple built-in Video and Music tools**: Without a Hugging Face token (and configured `HF_VIDEO_MODEL`), Video Simulator is an HTML5 canvas animation and Music Synthesizer plays procedural Web Audio API notes rather than generating studio video or audio files. Hugging Face media responses are also capped under 4 MB per request.
- **Offline mode scope**: Journal drafting/syncing works offline via browser storage and the PWA service worker, while AI chat, transcription, and live user messaging require a network connection.

---

## License

MIT License

Copyright (c) 2026 Som Maurya

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
