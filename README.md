# MindReflect - AI Journaling & Personal Reflection Companion

A modern, empathetic AI journaling application built with React 19, Tailwind CSS, Google Gemini AI, and Firebase Cloud Firestore. MindReflect empowers users to process daily thoughts, receive empathetic validation, track mood tags, and receive gentle actionable takeaways—with complete private data isolation secured by Firebase Authentication and Firestore Security Rules.

---

## 🌟 Key Features

1. **Secure Google Authentication**: Streamlined sign-in via Firebase Auth (Federated Google Identity), keeping credentials secure.
2. **Empathetic AI Companion**: Powered by Gemini (`gemini-3.6-flash` with resilient multi-tier fallback ladder) to provide non-judgmental conversational reflections, mood hashtag extraction (e.g., `#optimistic`, `#overwhelmed`), and practical micro-takeaways.
3. **Private Firestore Data Isolation**: Every journal entry is stored strictly under the authenticated user's isolated document tree: `users/{userId}/entries/{entryId}`.
4. **Interactive Dashboard & History**:
   - Real-time search across thoughts and mood tags.
   - Favorite / star entries.
   - Rich reflection details with interactive takeaway checklist.
   - Quick guided reflection prompts for daily mindfulness.
5. **Calm, Responsive UI**: Minimalist aesthetic with mobile-friendly collapsible drawer, smooth Framer Motion animations, skeleton loaders, and zero AI slop.

---

## 🔒 Security Architecture & Firestore Rules

User data is strictly protected so that each user can only read, create, update, and delete their own entries.

### `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Google Cloud Run Deployment Guide

### Prerequisites
1. **Google Cloud Project**: Set up a GCP project with billing enabled.
2. **Google Cloud SDK (`gcloud` CLI)**: Installed and authenticated (`gcloud auth login`).
3. **Firebase & Gemini API**: Enable the required Google Cloud and Firebase APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     aiplatform.googleapis.com
   ```

---

### Step 1: Secret Management Setup

Store your Gemini API key in Google Cloud Secret Manager to prevent hardcoded credentials:

```bash
# 1. Create the Secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API Key as a secret version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the default Cloud Run Compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### Step 2: Build & Deploy to Google Cloud Run

Deploy directly from source to Cloud Run with automatic secret mounting:

```bash
gcloud run deploy mindreflect \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

---

### Step 3: Required Campaign Labeling (Verification Binding)

Apply the mandatory challenge verification label to your deployed Cloud Run service:

```bash
gcloud run services update mindreflect \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🛠️ Local Development

1. **Clone the repository & install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY in .env
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 📋 Security Threat Summary

| Threat Zone | Identified Risk | Implemented Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection or oversized payload in journal submission | Top-level body limits (2MB), character caps (15k), sanitization, and structured JSON parsing. |
| **Planning & Reasoning** | Indirect prompt injection attempting to hijack AI persona | System prompt boundaries and schema-enforced output structure without raw markdown execution. |
| **Tool Execution** | API endpoint abuse or model rate limit failures | Multi-tier model fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`). |
| **Memory & State** | Cross-user data leakage or unauthorized document access | Owner-bound Firestore security rules (`request.auth.uid == userId`) and strict undefined-stripping. |
| **Inter-System Comms** | Secret leakage in browser client | Gemini API key strictly confined to backend Express routes (`/api/reflect`); Secret Manager in Cloud Run. |
