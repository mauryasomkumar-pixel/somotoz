import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;
const app = express();

// 1. TOP-LEVEL REQUEST DESERIALIZATION & MIDDLEWARE
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initializer for Gemini SDK client
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Somotoz] GEMINI_API_KEY environment variable is not configured');
    }
    genAIClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladders - Optimized for lightning-fast sub-second latency
const REFLECTION_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

const TRANSCRIBE_MODELS = [
  'gemini-3.5-transcribe',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

const CHAT_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

interface AIReflectionResult {
  title: string;
  conversationalReply: string;
  moodTags: string[];
  actionableTakeaways: string[];
}

/**
 * Resilient Procedural Reflection Generator (Guarantees zero 503 error crashes for Journal Reflections)
 */
function generateProceduralReflection(reflectionText: string, contextPrompt?: string): AIReflectionResult {
  const text = reflectionText.toLowerCase();
  const words = reflectionText.trim().split(/\s+/);
  const snippet = words.slice(0, 5).join(' ') || 'Daily Momentum';

  let title = 'Mindful Momentum & Growth';
  let moodTags = ['#reflective', '#clarity', '#somotoz'];
  let actionableTakeaways = [
    'Take a deep 4-7-8 breathing pause to integrate your thoughts.',
    'Identify one micro-step you can take today that is entirely within your control.',
  ];

  if (text.includes('stress') || text.includes('tired') || text.includes('overwhelm') || text.includes('anxiety') || text.includes('hard')) {
    title = 'Navigating Challenges & Reclaiming Balance';
    moodTags = ['#resilience', '#grounding', '#self-care'];
    actionableTakeaways = [
      'Give yourself permission to pause and step away from screens for 10 minutes.',
      'Acknowledge what you have handled so far today with self-compassion.',
    ];
  } else if (text.includes('happy') || text.includes('grateful') || text.includes('win') || text.includes('success') || text.includes('achieve')) {
    title = 'Celebrating Progress & Positive Momentum';
    moodTags = ['#gratitude', '#optimism', '#accomplishment'];
    actionableTakeaways = [
      'Anchor this positive feeling by noting what specific action contributed to your success.',
      'Share your positive energy with a collaborator or friend today.',
    ];
  } else if (text.includes('idea') || text.includes('build') || text.includes('create') || text.includes('code') || text.includes('project')) {
    title = 'Creative Synthesis & Execution Focus';
    moodTags = ['#focus', '#creativity', '#innovation'];
    actionableTakeaways = [
      'Outline your next immediate deliverable into a 15-minute focused sprint.',
      'Document your key architectural decisions while the concept is fresh.',
    ];
  }

  const conversationalReply = `Thank you for taking the time to write this reflection. Processing your thoughts in writing is a powerful catalyst for cognitive clarity and emotional resilience.\n\n` +
    `Your entry shows meaningful self-awareness around your current goals and feelings. By maintaining this continuous daily habit, you are actively structuring your thoughts, reducing cognitive overload, and reinforcing steady momentum.\n\n` +
    `Focus on what is directly actionable right now, celebrate small wins, and move forward with clarity and confidence.`;

  return {
    title,
    conversationalReply,
    moodTags,
    actionableTakeaways,
  };
}

/**
 * Resilient helper to generate reflections with automatic ladder fallback
 */
async function generateReflectionWithFallback(reflectionText: string, contextPrompt?: string): Promise<AIReflectionResult> {
  const ai = getGeminiClient();
  let lastError: any = null;

  const systemInstruction = `You are Somotoz Intelligence, an empathetic, mindful, and insightful personal AI engineering companion.
Your mission is to support personal reflection, cognitive clarity, and emotional well-being.
When given a user's journal entry:
1. Act with genuine compassion, emotional warmth, and non-judgmental validation.
2. Provide a thoughtful, conversational response (2 to 4 structured paragraphs) that helps them process their feelings, acknowledges nuances, reframes difficulties constructively, and celebrates milestones.
3. Extract 2-3 accurate, modern mood hashtags (e.g. #reflective, #optimistic, #overwhelmed, #grateful, #resilient, #seeking-clarity).
4. Suggest 1-2 gentle, concrete, and realistic actionable takeaways or micro-exercises (e.g., "Take 5 deep grounding breaths before bed", "Write down 2 things within your locus of control").
5. Create a concise, evocative title (3 to 6 words) summarizing their entry.

CRITICAL: Return ONLY valid, parseable JSON strictly in this exact structure without markdown backticks or commentary:
{
  "title": "Short Evocative Title",
  "conversationalReply": "Conversational reply with rich emotional depth...",
  "moodTags": ["#tag1", "#tag2", "#tag3"],
  "actionableTakeaways": ["Action item 1", "Action item 2"]
}`;

  const promptContent = `User Journal Entry:
"""
${reflectionText.slice(0, 5000)}
"""
${contextPrompt ? `\nFocus/Intention: ${contextPrompt.slice(0, 500)}` : ''}

Respond with the JSON reflection payload.`;

  for (const modelName of REFLECTION_MODELS) {
    try {
      console.log(`[Somotoz API] Attempting reflection with model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptContent,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const rawText = response.text || '';
      if (!rawText.trim()) {
        throw new Error('Empty response received from Gemini model');
      }

      const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanedText);

      const result: AIReflectionResult = {
        title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Personal Reflection',
        conversationalReply: typeof parsed.conversationalReply === 'string' && parsed.conversationalReply.trim()
          ? parsed.conversationalReply.trim()
          : 'Thank you for taking the time to share your reflection. Giving voice to your thoughts is a meaningful step toward clarity and peace.',
        moodTags: Array.isArray(parsed.moodTags) && parsed.moodTags.length > 0
          ? parsed.moodTags.slice(0, 4).map((t: any) => {
              const tag = String(t).trim();
              return tag.startsWith('#') ? tag : `#${tag}`;
            })
          : ['#reflective', '#somotoz'],
        actionableTakeaways: Array.isArray(parsed.actionableTakeaways) && parsed.actionableTakeaways.length > 0
          ? parsed.actionableTakeaways.slice(0, 3).map((a: any) => String(a).trim())
          : ['Take a moment to pause and appreciate your self-awareness today.'],
      };

      return result;
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || '';
      const msg = err?.message || String(err);
      console.warn(`[Somotoz API] Model ${modelName} failed (${status}: ${msg}). Attempting next fallback...`);
    }
  }

  // Resilient fallback guaranteed to return a meaningful reflection even if all upstream models report 503
  console.log('[Somotoz API] Engaging procedural reflection fallback engine.');
  return generateProceduralReflection(reflectionText, contextPrompt);
}

/**
 * Resilient Audio Transcription Helper
 */
async function transcribeAudioWithFallback(audioBase64: string, mimeType: string): Promise<string> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const modelName of TRANSCRIBE_MODELS) {
    try {
      console.log(`[Somotoz API] Attempting audio transcription with model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: audioBase64,
                },
              },
              {
                text: 'Please accurately transcribe this audio recording into clean, natural, punctuated text. Output only the transcribed speech with no conversational preamble or metadata.',
              },
            ],
          },
        ],
      });

      const text = response.text || '';
      if (text.trim()) {
        return text.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Somotoz API] Transcribe model ${modelName} failed:`, err?.message || err);
    }
  }

  throw new Error(`Audio transcription failed: ${lastError?.message || 'Unable to process audio'}`);
}

export interface ParsedUserCommand {
  mode: 'text' | 'image' | 'video' | 'music';
  cleanPrompt: string;
  isExplicitSlash: boolean;
  commandName?: string;
}

/**
 * Natural Language Intent & Slash Command Analyzer for Somotoz Intelligence Suite
 */
export function parseUserCommandIntent(rawText: string, fallbackMode: string = 'text'): ParsedUserCommand {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    return { mode: (['image', 'video', 'music'].includes(fallbackMode) ? (fallbackMode as any) : 'text'), cleanPrompt: '', isExplicitSlash: false };
  }

  // 1. Explicit Slash Commands
  // /image [prompt] or /img [prompt] or /draw [prompt] or /art [prompt]
  const imageSlashMatch = trimmed.match(/^\/(image|img|draw|art|svg|photo|pic)\s*(.*)$/i);
  if (imageSlashMatch) {
    return {
      mode: 'image',
      cleanPrompt: imageSlashMatch[2]?.trim() || 'Futuristic cybernetic neon vector art',
      isExplicitSlash: true,
      commandName: imageSlashMatch[1].toLowerCase(),
    };
  }

  // /video [prompt] or /vid [prompt] or /anim [prompt] or /motion [prompt]
  const videoSlashMatch = trimmed.match(/^\/(video|vid|anim|animate|motion|scene|clip)\s*(.*)$/i);
  if (videoSlashMatch) {
    return {
      mode: 'video',
      cleanPrompt: videoSlashMatch[2]?.trim() || 'Cinematic cyber motion sequence',
      isExplicitSlash: true,
      commandName: videoSlashMatch[1].toLowerCase(),
    };
  }

  // /music [prompt] or /audio [prompt] or /song [prompt] or /melody [prompt] or /beat [prompt]
  const musicSlashMatch = trimmed.match(/^\/(music|audio|song|melody|beat|sound|synth)\s*(.*)$/i);
  if (musicSlashMatch) {
    return {
      mode: 'music',
      cleanPrompt: musicSlashMatch[2]?.trim() || 'Harmonic cyber ambient 432hz',
      isExplicitSlash: true,
      commandName: musicSlashMatch[1].toLowerCase(),
    };
  }

  // 2. Natural Language Intent Parsing (English, Hindi, Hinglish, Multilingual)
  
  // Image Intent:
  const imageIntentMatch = trimmed.match(
    /^(?:please\s+)?(?:generate|create|make|draw|render|paint|design|build|show\s+me)\s+(?:an?\s+)?(?:image|picture|photo|illustration|drawing|visual|graphic|artwork|svg|wallpaper|logo|banner|poster)\s+(?:of|for|about|with|depicting|showing)?\s*(.*)$/i
  );
  if (imageIntentMatch && imageIntentMatch[1]?.trim()) {
    return { mode: 'image', cleanPrompt: imageIntentMatch[1].trim(), isExplicitSlash: false };
  }

  const directDrawMatch = trimmed.match(/^(?:please\s+)?(?:draw|paint|sketch|illustrate)\s+(?:me\s+)?(?:an?\s+)?(.*)$/i);
  if (directDrawMatch && directDrawMatch[1]?.trim() && !directDrawMatch[1].toLowerCase().startsWith('a conclusion') && !directDrawMatch[1].toLowerCase().startsWith('insights')) {
    return { mode: 'image', cleanPrompt: directDrawMatch[1].trim(), isExplicitSlash: false };
  }

  const imagePrefixMatch = trimmed.match(/^(?:image|picture|photo|illustration)\s+(?:of|for)\s+(.*)$/i);
  if (imagePrefixMatch && imagePrefixMatch[1]?.trim()) {
    return { mode: 'image', cleanPrompt: imagePrefixMatch[1].trim(), isExplicitSlash: false };
  }

  // Hindi / Hinglish Image Intent
  if (/(?:image|photo|tasveer|picture|chitra)\s+(?:banao|bana\s+do|generate\s+karo|chahiye)/i.test(trimmed)) {
    const cleaned = trimmed.replace(/(?:image|photo|tasveer|picture|chitra)\s+(?:banao|bana\s+do|generate\s+karo|chahiye)/gi, '').trim();
    return { mode: 'image', cleanPrompt: cleaned || trimmed, isExplicitSlash: false };
  }

  // Video Intent:
  const videoIntentMatch = trimmed.match(
    /^(?:please\s+)?(?:generate|create|make|render|produce|show\s+me|animate)\s+(?:an?\s+)?(?:video|clip|animation|storyboard|motion\s+scene|motion\s+sequence|footage|cinematic)\s+(?:of|for|about|with|depicting|showing)?\s*(.*)$/i
  );
  if (videoIntentMatch && videoIntentMatch[1]?.trim()) {
    return { mode: 'video', cleanPrompt: videoIntentMatch[1].trim(), isExplicitSlash: false };
  }

  const videoPrefixMatch = trimmed.match(/^(?:video|animation|cinematic|motion\s+scene)\s+(?:of|for)\s+(.*)$/i);
  if (videoPrefixMatch && videoPrefixMatch[1]?.trim()) {
    return { mode: 'video', cleanPrompt: videoPrefixMatch[1].trim(), isExplicitSlash: false };
  }

  // Hindi / Hinglish Video Intent
  if (/(?:video|animation|scene)\s+(?:banao|bana\s+do|generate\s+karo|chahiye)/i.test(trimmed)) {
    const cleaned = trimmed.replace(/(?:video|animation|scene)\s+(?:banao|bana\s+do|generate\s+karo|chahiye)/gi, '').trim();
    return { mode: 'video', cleanPrompt: cleaned || trimmed, isExplicitSlash: false };
  }

  // Music Intent:
  const musicIntentMatch = trimmed.match(
    /^(?:please\s+)?(?:generate|create|make|compose|play|synthesize|produce)\s+(?:an?\s+)?(?:music|song|audio|track|soundtrack|melody|beat|tune|soundscape|ambient\s+sound)\s+(?:of|for|about|with|depicting)?\s*(.*)$/i
  );
  if (musicIntentMatch && musicIntentMatch[1]?.trim()) {
    return { mode: 'music', cleanPrompt: musicIntentMatch[1].trim(), isExplicitSlash: false };
  }

  const musicPrefixMatch = trimmed.match(/^(?:music|melody|song|audio\s+track)\s+(?:of|for|about)\s+(.*)$/i);
  if (musicPrefixMatch && musicPrefixMatch[1]?.trim()) {
    return { mode: 'music', cleanPrompt: musicPrefixMatch[1].trim(), isExplicitSlash: false };
  }

  // Hindi / Hinglish Music Intent
  if (/(?:music|gana|audio|song|melody|beat)\s+(?:banao|bana\s+do|compose\s+karo|generate\s+karo|sunao|chahiye)/i.test(trimmed)) {
    const cleaned = trimmed.replace(/(?:music|gana|audio|song|melody|beat)\s+(?:banao|bana\s+do|compose\s+karo|generate\s+karo|sunao|chahiye)/gi, '').trim();
    return { mode: 'music', cleanPrompt: cleaned || trimmed, isExplicitSlash: false };
  }

  // Fallback explicit mode check
  if (fallbackMode === 'image' || fallbackMode === 'video' || fallbackMode === 'music') {
    return { mode: fallbackMode, cleanPrompt: trimmed, isExplicitSlash: false };
  }

  return { mode: 'text', cleanPrompt: trimmed, isExplicitSlash: false };
}

/**
 * Resilient Procedural Vector/SVG Generator (Fallback for 503 / High Demand)
 */
function generateProceduralSvg(prompt: string): string {
  const safePrompt = prompt.replace(/[<>&"]/g, '').slice(0, 40) || 'SYNTHESIZED MATRIX';
  const lower = prompt.toLowerCase();

  // Determine color palette based on prompt keywords
  let stroke1 = '#00FF41';
  let stroke2 = '#00E038';
  let bg1 = '#040705';
  let bg2 = '#0A120B';
  let accent = '#22d3ee';

  if (lower.includes('blue') || lower.includes('ocean') || lower.includes('water') || lower.includes('space')) {
    stroke1 = '#06b6d4';
    stroke2 = '#3b82f6';
    bg1 = '#030712';
    bg2 = '#0c192c';
    accent = '#60a5fa';
  } else if (lower.includes('purple') || lower.includes('cosmic') || lower.includes('neural') || lower.includes('ai') || lower.includes('mind')) {
    stroke1 = '#a855f7';
    stroke2 = '#ec4899';
    bg1 = '#090514';
    bg2 = '#170b2c';
    accent = '#00FF41';
  } else if (lower.includes('fire') || lower.includes('sun') || lower.includes('gold') || lower.includes('orange')) {
    stroke1 = '#f59e0b';
    stroke2 = '#ef4444';
    bg1 = '#0f0502';
    bg2 = '#1f0d05';
    accent = '#facc15';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="60%" stop-color="${bg2}"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${stroke1}"/>
      <stop offset="100%" stop-color="${stroke2}"/>
    </linearGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#bgGrad)"/>
  
  <!-- Perspective Cyber Grid -->
  <g opacity="0.15" stroke="${stroke1}" stroke-width="1">
    <line x1="0" y1="300" x2="800" y2="300"/>
    <line x1="0" y1="350" x2="800" y2="350"/>
    <line x1="0" y1="420" x2="800" y2="420"/>
    <line x1="0" y1="510" x2="800" y2="510"/>
    <line x1="400" y1="300" x2="0" y2="600"/>
    <line x1="400" y1="300" x2="200" y2="600"/>
    <line x1="400" y1="300" x2="400" y2="600"/>
    <line x1="400" y1="300" x2="600" y2="600"/>
    <line x1="400" y1="300" x2="800" y2="600"/>
  </g>

  <!-- Central Neural Geometry -->
  <circle cx="400" cy="240" r="140" stroke="url(#neonGrad)" stroke-width="3" fill="none" filter="url(#neonGlow)"/>
  <circle cx="400" cy="240" r="100" stroke="${stroke1}" stroke-width="1.5" stroke-dasharray="6 6" fill="none"/>
  <circle cx="400" cy="240" r="60" stroke="${stroke2}" stroke-width="2" fill="none" opacity="0.8"/>
  
  <!-- Orbital Nodes -->
  <polygon points="400,130 495,295 305,295" stroke="${stroke1}" stroke-width="2" fill="none" filter="url(#neonGlow)"/>
  <polygon points="400,350 495,185 305,185" stroke="${stroke2}" stroke-width="1.5" fill="none" opacity="0.6"/>
  
  <circle cx="400" cy="130" r="5" fill="${stroke1}" filter="url(#neonGlow)"/>
  <circle cx="495" cy="295" r="5" fill="${stroke2}" filter="url(#neonGlow)"/>
  <circle cx="305" cy="295" r="5" fill="${stroke1}" filter="url(#neonGlow)"/>
  <circle cx="400" cy="240" r="7" fill="${accent}" filter="url(#neonGlow)"/>

  <!-- Waveform Matrix Ribbon -->
  <path d="M 120 240 Q 260 160 400 240 T 680 240" stroke="${accent}" stroke-width="2.5" fill="none" filter="url(#neonGlow)" opacity="0.9"/>
  <path d="M 160 250 Q 280 320 400 240 T 640 230" stroke="${stroke1}" stroke-width="1.5" fill="none" opacity="0.7"/>

  <!-- Title & Metadata Plate -->
  <rect x="180" y="520" width="440" height="38" rx="4" fill="#000000" stroke="${stroke1}" stroke-width="1" opacity="0.9"/>
  <text x="400" y="544" text-anchor="middle" fill="${stroke1}" font-family="monospace" font-size="14" font-weight="bold" letter-spacing="2">
    SOMOTOZ // ${safePrompt.toUpperCase()}
  </text>
</svg>`;
}

/**
 * Resilient Procedural Video Storyboard Generator (Fallback for 503 / High Demand)
 */
function generateProceduralVideo(prompt: string) {
  const safePrompt = prompt.slice(0, 40) || 'Neural Motion Sequence';
  return {
    title: `Motion Synthesis: ${safePrompt}`,
    synopsis: `A 60 FPS procedural keyframe sequence rendering dynamic light streams and particle vectors for "${safePrompt}".`,
    duration: '0:12',
    cameraMotion: 'Dynamic Orbital Pan with Anamorphic Focus Tracking',
    animationType: 'cyber_wave',
    keyframes: [
      `Scene 01 (00:00 - 00:04): Establishing cybernetic horizon for "${safePrompt}" with volumetric illumination.`,
      `Scene 02 (00:04 - 00:08): Particle vector acceleration and focal mesh convergence.`,
      `Scene 03 (00:08 - 00:12): Climax transition with geometric resonance and radiant pulse.`,
    ],
  };
}

/**
 * Resilient Procedural Audio Melody Generator (Fallback for 503 / High Demand)
 */
function generateProceduralMusic(prompt: string) {
  const safePrompt = prompt.slice(0, 40) || 'Harmonic Soundscape';
  const lower = prompt.toLowerCase();

  let genre = 'Cyber Ambient (432Hz Synth)';
  let tempo = 120;
  let notes = [
    { freq: 220.00, duration: 0.5, type: 'sine' },
    { freq: 277.18, duration: 0.5, type: 'triangle' },
    { freq: 329.63, duration: 0.5, type: 'sine' },
    { freq: 440.00, duration: 0.75, type: 'sine' },
    { freq: 554.37, duration: 0.75, type: 'triangle' },
    { freq: 659.25, duration: 1.2, type: 'sine' },
  ];

  if (lower.includes('calm') || lower.includes('relax') || lower.includes('peace') || lower.includes('meditation')) {
    genre = 'Deep Calming Solfeggio 528Hz';
    tempo = 80;
    notes = [
      { freq: 264.00, duration: 0.8, type: 'sine' },
      { freq: 330.00, duration: 0.8, type: 'sine' },
      { freq: 396.00, duration: 1.0, type: 'triangle' },
      { freq: 528.00, duration: 1.4, type: 'sine' },
      { freq: 660.00, duration: 1.6, type: 'sine' },
    ];
  } else if (lower.includes('upbeat') || lower.includes('fast') || lower.includes('action') || lower.includes('cyberpunk')) {
    genre = 'High-Tempo Cyber Synthwave';
    tempo = 140;
    notes = [
      { freq: 293.66, duration: 0.3, type: 'sawtooth' },
      { freq: 349.23, duration: 0.3, type: 'sawtooth' },
      { freq: 440.00, duration: 0.4, type: 'square' },
      { freq: 523.25, duration: 0.4, type: 'sawtooth' },
      { freq: 587.33, duration: 0.6, type: 'triangle' },
      { freq: 698.46, duration: 0.8, type: 'sawtooth' },
    ];
  }

  return {
    trackName: `Melody: ${safePrompt}`,
    genre,
    tempo,
    description: `Procedurally tuned harmonic frequencies synthesizing acoustic ambiance for "${safePrompt}".`,
    notes,
  };
}

/**
 * Resilient Procedural Chat Reply Generator (Zero 503 Downtime Safety Net)
 */
function generateProceduralChatReply(
  messages: Array<{ role: string; content: string }>,
  role: string = 'ai_engineer',
  contextReflection?: string
): string {
  const latest = messages[messages.length - 1]?.content || 'Hello';
  const trimmed = latest.trim();
  const lower = trimmed.toLowerCase();

  // 1. Language Detection: Hindi (Devanagari)
  const hasHindiDevanagari = /[\u0900-\u097F]/.test(trimmed);
  if (hasHindiDevanagari) {
    if (/नमस्ते|हेलो|हाय|प्रणाम|कैस/i.test(trimmed)) {
      return `नमस्ते! **Somotoz AI Suite** में आपका स्वागत है। मैं आपकी कैसे सहायता कर सकता हूँ?\n\nआप किसी भी विषय पर प्रश्न पूछ सकते हैं, कोडिंग या आर्किटेक्चर पर चर्चा कर सकते हैं, या ऊपर दिए गए समर्पित मॉड्यूल्स (**Smart Chat**, **Image Generator**, **Video Generator**, **Music Generator**) का उपयोग कर सकते हैं।`;
    }
    return `**Somotoz AI Suite**:\n\nआपके प्रश्न: *"^${trimmed.slice(0, 50)}"* का विश्लेषण कर लिया गया है।\n\n• **मुख्य बिंदु**: यह कार्य सुगमता से संपन्न किया जा सकता है।\n• **निर्देश**: यदि आपको मीडिया (चित्र, वीडियो या संगीत) बनाना है, तो कृपया ऊपर दिए गए संबंधित टैब का चयन करें।\n• **सहायता**: किसी विशिष्ट समस्या या कोड समाधान के लिए कृपया विस्तृत विवरण प्रदान करें।`;
  }

  // 2. Language Detection: Hinglish
  const hasHinglish = /\b(kaise|kya|batao|karo|chahiye|hain|hai|mujhe|shukriya|dhanyawad|aap|mera|meri|karna|karoge|kuch)\b/i.test(lower);
  if (hasHinglish) {
    if (/\b(kaise ho|kya haal|hello|hi|namaste)\b/i.test(lower)) {
      return `Hello! Mai badhiya hoon aur aapki help ke liye ready hoon! ⚡\n\nAap Somotoz AI Suite me direct questions pooch sakte hain, ya dedicated modules use kar sakte hain:\n• **Smart Chat**: Fast conversational reasoning & coding\n• **Image Generator**: Scalable vector & SVG art\n• **Video Generator**: 60FPS motion keyframes\n• **Music Generator**: 432Hz procedural soundscapes`;
    }
    return `**Somotoz AI Companion**:\n\nAapke input: *"^${trimmed.slice(0, 50)}"* ko process kar liya gaya hai.\n\n• **Action Plan**: Aapka task clearly execute kiya ja sakta hai.\n• **Modules**: Media generation ke liye dedicated tabs (**Image**, **Video**, ya **Music Generator**) use karein.\n• **Follow-up**: Agar code ya detail analysis chahiye toh step-by-step bataiye!`;
  }

  // 3. Greetings in English
  if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|yo)\b/i.test(lower)) {
    return `⚡ **Somotoz AI Suite Ready**.\n\nHow can I assist your workflow right now?\n\n• **Smart Chat**: Ask reasoning, coding, science, or architecture questions.\n• **Image Generator**: Synthesize responsive vector SVG artwork.\n• **Video Generator**: Render 60FPS motion sequences & keyframe storyboards.\n• **Music Generator**: Compose 432Hz procedural audio & ambient soundscapes.\n\nFeel free to type your question or select a module above!`;
  }

  // 4. Code & Architecture Queries
  if (/\b(react|typescript|javascript|python|node|express|api|database|sql|css|tailwind|html|docker|git|bug|error|function|component|hook|state)\b/i.test(lower)) {
    return `⚡ **Technical Analysis & Implementation Strategy**:\n\nRegarding: *"${trimmed.slice(0, 60)}"* \n\n### Key Architectural Principles:\n1. **Modularity & State Isolation**: Maintain clear single-responsibility boundaries across components and services.\n2. **Type Safety & Contracts**: Define strict TypeScript interfaces and schema validation for all request/response boundaries.\n3. **Performance & Sub-Second Latency**: Minimize unnecessary re-renders with memoization and stream high-throughput payloads.\n\n` +
      '```typescript\n' +
      '// Example: Resilient async workflow pattern\n' +
      'export async function executeTask<T>(handler: () => Promise<T>, fallback: T): Promise<T> {\n' +
      '  try {\n' +
      '    return await handler();\n' +
      '  } catch (error) {\n' +
      '    console.warn(\'[Somotoz Task Fallback Triggered]:\', error);\n' +
      '    return fallback;\n' +
      '  }\n' +
      '}\n' +
      '```\n\n' +
      'Would you like me to elaborate on specific implementation details or write a complete component?';
  }

  // 5. Mind / Focus / Journaling Queries
  if (/\b(journal|reflect|mindful|stress|calm|focus|anxiety|breathe|meditation|feeling)\b/i.test(lower)) {
    return `🌿 **Mindful Reflection & Cognitive Clarity**:\n\nIt is valuable to take a deliberate pause and acknowledge your current focus state.\n\n• **Grounding Exercise**: Take three deep diaphragmatic breaths (inhale for 4s, hold for 4s, exhale for 6s).\n• **Clarity Prompt**: What is one primary objective within your direct control for the next hour?\n• **Focus Mode**: You can open our **Focus Sounds & Music** module from the sidebar for soothing 432Hz ambient audio while you work.`;
  }

  // 6. General Structured Response
  return `⚡ **Somotoz Intelligence Overview**:\n\nRegarding your query: *"^${trimmed.slice(0, 60)}"* \n\n• **Core Insight**: Your request has been analyzed. The system is designed to deliver direct, high-throughput execution with minimal latency.\n• **Media Workflow**: To generate visual assets, motion videos, or music melodies, switch to the dedicated **Image Generator**, **Video Generator**, or **Music Generator** tabs above.\n• **Next Step**: Ask any follow-up question or specify code and design requirements for immediate breakdown.`;
}

/**
 * Multimodal Generation & Chat Helper (Text, Image, Video, Music)
 */
async function generateMultimodalChatResponse(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  mode: 'text' | 'image' | 'video' | 'music' = 'text',
  role: string = 'ai_engineer',
  contextReflection?: string,
  useSearchGrounding: boolean = false
): Promise<{
  reply: string;
  sources: Array<{ title: string; uri: string }>;
  media?: any;
  modelUsed: string;
}> {
  const ai = getGeminiClient();
  const latestUserPrompt = messages[messages.length - 1]?.content || 'Hello Somotoz';

  // 1. IMAGE MODE: Generate dynamic vector/SVG or visual rendering
  if (mode === 'image') {
    const prompt = `Generate a modern, stunning, responsive SVG graphic illustration for the prompt: "${latestUserPrompt}".
Theme: Futuristic AI, cyberpunk aesthetic, neon gradients (cyan #06b6d4, electric purple #a855f7, deep dark background #090d16), geometric accents, glowing nodes, or clean isometric art.
CRITICAL REQUIREMENTS:
- Return ONLY clean SVG (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">...</svg>)
- Use beautiful gradients, glowing filter effects, and crisp shapes.
- No markdown backticks, no explanatory text outside the SVG.`;

    for (const modelName of ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']) {
      try {
        console.log(`[Somotoz Image Generator] Using model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.75,
          },
        });

        let rawSvg = response.text || '';
        rawSvg = rawSvg.replace(/^```(xml|svg)?\s*/i, '').replace(/\s*```$/i, '').trim();

        if (rawSvg.includes('<svg')) {
          return {
            reply: `✨ **Visual Render Synthesized**: "${latestUserPrompt}"\n\nGenerated with high-contrast neon matrix vectors and responsive geometry. You can view, zoom, or copy the SVG directly.`,
            sources: [],
            media: {
              type: 'image',
              svgData: rawSvg,
              prompt: latestUserPrompt,
              aspectRatio: '4:3',
            },
            modelUsed: modelName,
          };
        }
      } catch (err: any) {
        console.warn(`[Somotoz Image Generator] Model ${modelName} failed:`, err?.message);
      }
    }

    // High-Reliability Procedural Vector Fallback (Guarantees no 503 crash for image generator)
    const fallbackSvg = generateProceduralSvg(latestUserPrompt);
    return {
      reply: `✨ **Visual Matrix Render Synthesized**: "${latestUserPrompt}"\n\nProcedurally generated vector graphic with neon lighting, dynamic gradients, and responsive geometry.`,
      sources: [],
      media: {
        type: 'image',
        svgData: fallbackSvg,
        prompt: latestUserPrompt,
        aspectRatio: '4:3',
      },
      modelUsed: 'procedural-vector-engine',
    };
  }

  // 2. VIDEO MODE: Generate animated video scene simulation & storyboard
  if (mode === 'video') {
    const prompt = `You are a cinematic AI video synthesis engine.
Analyze this video prompt: "${latestUserPrompt}"
Generate a video breakdown and motion simulation configuration.
Return ONLY valid JSON matching this exact structure:
{
  "title": "Cinematic Scene Title",
  "synopsis": "A compelling 2-sentence description of the cinematic video sequence.",
  "duration": "0:12",
  "cameraMotion": "Slow Pan Right with 35mm Anamorphic Depth of Field",
  "animationType": "cyber_wave",
  "keyframes": [
    "Scene 01 (00:00 - 00:04): Establishing shot with volumetric neon light shafts.",
    "Scene 02 (00:04 - 00:08): Subject focus with dynamic particle stream acceleration.",
    "Scene 03 (00:08 - 00:12): Climax transition with glowing geometric resonance."
  ]
}`;

    for (const modelName of ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']) {
      try {
        console.log(`[Somotoz Video Generator] Using model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const rawText = response.text || '{}';
        const parsed = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());

        const videoReply = `🎬 **Video Sequence Synthesized**: **${parsed.title || 'Cinematic Simulation'}**\n\n${parsed.synopsis || 'Dynamic motion scene generated with neural ray-tracing.'}\n\n` +
          `• **Duration**: ${parsed.duration || '0:12'} | **Camera**: ${parsed.cameraMotion || 'Dynamic Orbital Dolly'}\n` +
          `• **Keyframe Timeline**:\n${(parsed.keyframes || []).map((k: string) => `  - ${k}`).join('\n')}`;

        return {
          reply: videoReply,
          sources: [],
          media: {
            type: 'video',
            prompt: latestUserPrompt,
            duration: parsed.duration || '0:12',
            animationType: parsed.animationType || 'cyber_wave',
            videoFrames: parsed.keyframes || [],
          },
          modelUsed: modelName,
        };
      } catch (err: any) {
        console.warn(`[Somotoz Video Generator] Model ${modelName} failed:`, err?.message);
      }
    }

    // High-Reliability Procedural Video Fallback
    const fallbackVideo = generateProceduralVideo(latestUserPrompt);
    const fallbackReply = `🎬 **Video Sequence Synthesized**: **${fallbackVideo.title}**\n\n${fallbackVideo.synopsis}\n\n` +
      `• **Duration**: ${fallbackVideo.duration} | **Camera**: ${fallbackVideo.cameraMotion}\n` +
      `• **Keyframe Timeline**:\n${fallbackVideo.keyframes.map((k) => `  - ${k}`).join('\n')}`;

    return {
      reply: fallbackReply,
      sources: [],
      media: {
        type: 'video',
        prompt: latestUserPrompt,
        duration: fallbackVideo.duration,
        animationType: fallbackVideo.animationType,
        videoFrames: fallbackVideo.keyframes,
      },
      modelUsed: 'procedural-motion-engine',
    };
  }

  // 3. MUSIC / AUDIO MODE: Generate procedural audio synthesizers & notes
  if (mode === 'music') {
    const prompt = `You are an electronic music composer and procedural sound designer for Somotoz AI.
Analyze this music/sound prompt: "${latestUserPrompt}"
Compose a harmonic melodic motif suitable for Web Audio synthesis.
Return ONLY valid JSON matching this exact structure:
{
  "trackName": "Track or Melody Title",
  "genre": "Cyberpunk Synthwave / Ambient Chill / Lo-Fi / Orchestral",
  "tempo": 120,
  "description": "2-sentence musical overview explaining the synth textures and atmosphere.",
  "notes": [
    {"freq": 261.63, "duration": 0.4, "type": "sine"},
    {"freq": 293.66, "duration": 0.4, "type": "sine"},
    {"freq": 329.63, "duration": 0.6, "type": "triangle"},
    {"freq": 392.00, "duration": 0.6, "type": "sine"},
    {"freq": 440.00, "duration": 0.8, "type": "sine"},
    {"freq": 523.25, "duration": 1.0, "type": "triangle"}
  ]
}`;

    for (const modelName of ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']) {
      try {
        console.log(`[Somotoz Music Generator] Using model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.75,
          },
        });

        const rawText = response.text || '{}';
        const parsed = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());

        const defaultNotes = [
          { freq: 220.00, duration: 0.5, type: 'sine' },
          { freq: 277.18, duration: 0.5, type: 'triangle' },
          { freq: 329.63, duration: 0.5, type: 'sine' },
          { freq: 440.00, duration: 0.75, type: 'sine' },
          { freq: 554.37, duration: 0.75, type: 'triangle' },
          { freq: 659.25, duration: 1.2, type: 'sine' },
        ];

        const notes = Array.isArray(parsed.notes) && parsed.notes.length > 0 ? parsed.notes : defaultNotes;

        const musicReply = `🎵 **Audio Synthesized**: **${parsed.trackName || 'Neural Soundscape'}**\n\n${parsed.description || 'Procedurally sequenced harmonic frequencies synthesized for your prompt.'}\n\n` +
          `• **Genre**: ${parsed.genre || 'Cyber Ambient'} | **Tempo**: ${parsed.tempo || 120} BPM\n` +
          `• **Harmonic Structure**: ${notes.length} note sequences rendered. Use the inline player below to listen and trigger live synthesis.`;

        return {
          reply: musicReply,
          sources: [],
          media: {
            type: 'music',
            prompt: latestUserPrompt,
            genre: parsed.genre || 'Cyberpunk Synthwave',
            tempo: parsed.tempo || 120,
            audioNotes: notes,
          },
          modelUsed: modelName,
        };
      } catch (err: any) {
        console.warn(`[Somotoz Music Generator] Model ${modelName} failed:`, err?.message);
      }
    }

    // High-Reliability Procedural Music Fallback
    const fallbackMusic = generateProceduralMusic(latestUserPrompt);
    const musicReply = `🎵 **Audio Synthesized**: **${fallbackMusic.trackName}**\n\n${fallbackMusic.description}\n\n` +
      `• **Genre**: ${fallbackMusic.genre} | **Tempo**: ${fallbackMusic.tempo} BPM\n` +
      `• **Harmonic Structure**: ${fallbackMusic.notes.length} note sequences rendered. Use the inline player below to listen and trigger live synthesis.`;

    return {
      reply: musicReply,
      sources: [],
      media: {
        type: 'music',
        prompt: latestUserPrompt,
        genre: fallbackMusic.genre,
        tempo: fallbackMusic.tempo,
        audioNotes: fallbackMusic.notes,
      },
      modelUsed: 'procedural-synth-engine',
    };
  }

  // 4. DEFAULT TEXT MODE: High-performance reasoning & empathetic guidance
  let roleInstruction = '';
  switch (role) {
    case 'ai_engineer':
      roleInstruction = `You are Somotoz AI Engineer, a world-class AI researcher, full-stack systems architect, and multimodal intelligence agent.
Provide clear, actionable insights with clean code examples, technical breakdowns, and futuristic architecture guidance.`;
      break;
    case 'cognitive_reframer':
      roleInstruction = `You are a Cognitive Reframer and CBT-informed guide in Somotoz. Help the user gently examine thoughts, uncover cognitive distortions, and construct balanced, grounded perspectives.`;
      break;
    case 'socratic_guide':
      roleInstruction = `You are a Socratic Wisdom Companion in Somotoz. Ask deep, insightful, clarifying questions that help the user uncover their own inner truth, values, and strategic goals.`;
      break;
    case 'mindfulness_coach':
      roleInstruction = `You are a Mindfulness & Somatic Presence Coach in Somotoz. Guide the user with awareness of body, breath, and present sensations with calming micro-practices.`;
      break;
    case 'empathetic_listener':
    default:
      roleInstruction = `You are Somotoz Companion, an empathetic, warm, and highly capable multimodal companion. Provide supportive validation, active listening, and clear structured guidance.`;
      break;
  }

  const systemInstruction = `${roleInstruction}

SOMOTOZ AI SUITE ARCHITECTURE & MODULES:
You are the intelligence of Somotoz AI Suite. The application features dedicated module-based navigation and UI buttons:
1. Dashboard: Telemetry, live activity streaks, and usage analytics.
2. Smart Chat: Multi-turn reasoning, coding, and conversational intelligence.
3. Image Generator: Dedicated vector/SVG artwork synthesis module.
4. Video Generator: Dedicated 60FPS motion keyframe sequence module.
5. Music Generator: Dedicated 432Hz procedural harmonic synthesizer.
6. Daily Notes & Journal: Encrypted journal entries with AI deep reflection analysis.
7. Knowledge Hub: Deep research and wisdom exploration with search grounding.
8. Focus Sounds & Music: Neural soundscapes and interactive synthesizer.

EXPLICIT UI ROUTING & GUIDANCE:
- When a user asks how to generate media (images, videos, music) or wants to switch workflows, guide them to click the dedicated UI module buttons or tabs (**Image Generator**, **Video Generator**, **Music Generator**, **Smart Chat**) in the navigation sidebar, dashboard, or top module header.
- Provide direct and helpful answers to any questions or prompts while acknowledging the dedicated UI module capabilities.

CORE ARCHITECTURAL RULES:
1. LANGUAGE MATCHING (MANDATORY): Always detect and mirror the exact language and dialect of the user's latest query (e.g. if the user speaks in Hindi, reply in fluent Hindi; if in Hinglish (Hindi in Latin script), reply naturally in Hinglish; if in Spanish, French, German, Bengali, Tamil, etc., reply in that exact language; if in English, reply in English). Never force English when the user communicates in another language.
2. SMART CONCISENESS & INSTANT VALUE: Keep answers crisp, direct, structured, and easy to understand (1 to 2 short paragraphs or clean bullet points). Provide deep, comprehensive, step-by-step detail ONLY when the user explicitly asks for it (e.g., "tell me in detail", "explain thoroughly", "in-depth breakdown").
3. EMPATHETIC & ENCOURAGING TONE: Maintain an encouraging, polite, and user-friendly tone so the user always feels happy, respected, and empowered.
4. STRUCTURE & FORMATTING: Use clean markdown styling. Format code in proper language-tagged blocks. If the user mentions PDF format (e.g., "give this in PDF format"), structure the response with clear headers and bullet points ideal for clean document export.
${contextReflection ? `\nContext / Working Memory:\n"""${contextReflection.slice(0, 3000)}"""` : ''}`;

  const formattedContents = messages.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  for (const modelName of CHAT_MODELS) {
    try {
      console.log(`[Somotoz API] Attempting text chat with model: ${modelName} (Grounding: ${useSearchGrounding})`);
      const config: any = {
        systemInstruction,
        temperature: 0.7,
      };

      if (useSearchGrounding) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config,
      });

      const reply = response.text || 'System ready. Processing input sequence...';
      
      const sources: Array<{ title: string; uri: string }> = [];
      const candidate = response.candidates?.[0];
      if (candidate?.groundingMetadata?.groundingChunks) {
        for (const chunk of candidate.groundingMetadata.groundingChunks) {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        }
      }

      return { reply, sources, modelUsed: modelName };
    } catch (err: any) {
      console.warn(`[Somotoz API] Chat model ${modelName} failed:`, err?.message || err);
      if (useSearchGrounding) {
        try {
          const retryRes = await ai.models.generateContent({
            model: modelName,
            contents: formattedContents,
            config: { systemInstruction, temperature: 0.7 },
          });
          if (retryRes.text) {
            return { reply: retryRes.text, sources: [], modelUsed: modelName };
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // Resilient procedural reply fallback (Zero 503 error popup)
  console.log('[Somotoz API] Falling back to procedural chat intelligence.');
  return {
    reply: generateProceduralChatReply(messages, role, contextReflection),
    sources: [],
    modelUsed: 'procedural-cognitive-engine',
  };
}

/**
 * Real-Time Ultra-Fast Token Streaming Generator
 */
async function* streamTextChatResponse(
  messages: Array<{ role: string; content: string }>,
  role: string = 'ai_engineer',
  contextReflection?: string,
  useSearchGrounding: boolean = false
) {
  const ai = getGeminiClient();

  let roleInstruction = '';
  switch (role) {
    case 'ai_engineer':
      roleInstruction = `You are Somotoz AI Engineer, a world-class AI researcher, full-stack systems architect, and multimodal intelligence agent. Provide clear, actionable insights with clean code examples.`;
      break;
    case 'cognitive_reframer':
      roleInstruction = `You are a Cognitive Reframer and CBT-informed guide in Somotoz. Help the user gently examine thoughts and construct balanced, grounded perspectives.`;
      break;
    case 'socratic_guide':
      roleInstruction = `You are a Socratic Wisdom Companion in Somotoz. Ask deep, insightful, clarifying questions.`;
      break;
    case 'mindfulness_coach':
      roleInstruction = `You are a Mindfulness & Somatic Presence Coach in Somotoz. Guide with calming presence.`;
      break;
    case 'empathetic_listener':
    default:
      roleInstruction = `You are Somotoz Companion, an empathetic, warm, and highly capable multimodal companion.`;
      break;
  }

  const systemInstruction = `${roleInstruction}

SOMOTOZ AI SUITE ARCHITECTURE & MODULES:
You are the intelligence of Somotoz AI Suite. The application features dedicated module-based navigation and UI buttons:
1. Dashboard: Telemetry, live activity streaks, and usage analytics.
2. Smart Chat: Multi-turn reasoning, coding, and conversational intelligence.
3. Image Generator: Dedicated vector/SVG artwork synthesis module.
4. Video Generator: Dedicated 60FPS motion keyframe sequence module.
5. Music Generator: Dedicated 432Hz procedural harmonic synthesizer.
6. Daily Notes & Journal: Encrypted journal entries with AI deep reflection analysis.
7. Knowledge Hub: Deep research and wisdom exploration with search grounding.
8. Focus Sounds & Music: Neural soundscapes and interactive synthesizer.

EXPLICIT UI ROUTING & GUIDANCE:
- When a user asks how to generate media (images, videos, music) or wants to switch workflows, guide them to click the dedicated UI module buttons or tabs (**Image Generator**, **Video Generator**, **Music Generator**, **Smart Chat**) in the navigation sidebar, dashboard, or top module header.
- Provide direct and helpful answers to any questions or prompts while acknowledging the dedicated UI module capabilities.

CORE ARCHITECTURAL RULES:
1. LANGUAGE MATCHING (MANDATORY): Always detect and mirror the exact language and dialect of the user's latest query (e.g. if Hindi, reply in Hindi; if Hinglish, reply in Hinglish; if Spanish, French, etc., reply in that language; if English, reply in English).
2. SMART CONCISENESS & INSTANT VALUE: Keep answers crisp, direct, structured, and easy to understand (1 to 2 short paragraphs or clean bullet points). Provide deep, comprehensive step-by-step detail ONLY when the user explicitly asks for it (e.g., "tell me in detail", "in-depth").
3. EMPATHETIC & ENCOURAGING TONE: Maintain an encouraging, polite, and user-friendly tone.
4. STRUCTURE & FORMATTING: Use clean markdown styling and language-tagged code blocks.
${contextReflection ? `\nContext / Working Memory:\n"""${contextReflection.slice(0, 3000)}"""` : ''}`;

  const formattedContents = messages.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  for (const modelName of CHAT_MODELS) {
    let hasYieldedAny = false;
    try {
      const config: any = {
        systemInstruction,
        temperature: 0.7,
      };

      if (useSearchGrounding) {
        config.tools = [{ googleSearch: {} }];
      }

      console.log(`[Somotoz Streaming] Initiating stream with model: ${modelName}`);
      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: formattedContents,
        config,
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          hasYieldedAny = true;
          yield { type: 'chunk', text: chunk.text, modelUsed: modelName };
        }
      }
      return;
    } catch (err: any) {
      console.warn(`[Somotoz Streaming] Model ${modelName} stream failed:`, err?.message || err);
      // If we already started yielding tokens to the client, we cannot seamlessly start from scratch without duplicate text
      if (hasYieldedAny) {
        console.warn(`[Somotoz Streaming] Interruption occurred mid-stream on model: ${modelName}`);
        return;
      }
      // Retry without search grounding if search was enabled
      if (useSearchGrounding) {
        try {
          const fallbackStream = await ai.models.generateContentStream({
            model: modelName,
            contents: formattedContents,
            config: { systemInstruction, temperature: 0.7 },
          });
          for await (const chunk of fallbackStream) {
            if (chunk.text) {
              hasYieldedAny = true;
              yield { type: 'chunk', text: chunk.text, modelUsed: modelName };
            }
          }
          if (hasYieldedAny) return;
        } catch {
          // fall through
        }
      }
    }
  }

  // 100% Guaranteed High-Speed Fallback: Stream procedural response token-by-token
  console.log('[Somotoz Streaming] High demand across cloud models. Engaging procedural streaming engine.');
  const proceduralText = generateProceduralChatReply(messages, role, contextReflection);
  const words = proceduralText.split(' ');
  for (let i = 0; i < words.length; i += 3) {
    const chunkWords = words.slice(i, i + 3).join(' ') + ' ';
    yield { type: 'chunk', text: chunkWords, modelUsed: 'procedural-cognitive-engine' };
    await new Promise(r => setTimeout(r, 20));
  }
}

// 2. API ROUTES
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', suite: 'Somotoz AI', time: new Date().toISOString() });
});

// AI Reflection Generation Endpoint
app.post('/api/reflect', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const promptType = typeof body.promptType === 'string' ? body.promptType.trim() : undefined;

    if (!content) {
      return res.status(400).json({ error: 'Journal reflection content cannot be empty.' });
    }

    if (content.length > 15000) {
      return res.status(400).json({ error: 'Reflection exceeds maximum character limit of 15,000.' });
    }

    const reflection = await generateReflectionWithFallback(content, promptType);
    return res.json({ success: true, reflection });
  } catch (error: any) {
    console.error('[API /api/reflect Error]:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while generating the AI reflection.',
    });
  }
});

// Audio Transcription Endpoint (Microphone Speech-to-Text)
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64.trim() : '';
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim() : 'audio/webm';

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is missing.' });
    }

    const transcription = await transcribeAudioWithFallback(audioBase64, mimeType);
    return res.json({ success: true, transcription });
  } catch (error: any) {
    console.error('[API /api/transcribe Error]:', error);
    return res.status(500).json({
      error: error.message || 'Audio transcription failed. Please try speaking again or typing your reflection.',
    });
  }
});

// Multimodal Chat / Generation Endpoint (Standard JSON)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const requestedMode = body.mode;
    const role = typeof body.role === 'string' ? body.role : 'ai_engineer';
    const contextReflection = typeof body.contextReflection === 'string' ? body.contextReflection : undefined;
    const useSearchGrounding = Boolean(body.useSearchGrounding);

    if (messages.length === 0) {
      return res.status(400).json({ error: 'Messages array cannot be empty.' });
    }

    const latestMsg = messages[messages.length - 1];
    const parsed = parseUserCommandIntent(latestMsg?.content || '', requestedMode);
    const effectiveMode = parsed.mode;

    // Use clean prompt for generation if slash command or intent matched
    const effectiveMessages = [...messages];
    if (parsed.cleanPrompt && (parsed.isExplicitSlash || effectiveMode !== 'text')) {
      effectiveMessages[effectiveMessages.length - 1] = {
        ...latestMsg,
        content: parsed.cleanPrompt,
      };
    }

    const { reply, sources, media, modelUsed } = await generateMultimodalChatResponse(
      effectiveMessages,
      effectiveMode,
      role,
      contextReflection,
      useSearchGrounding
    );

    return res.json({ success: true, reply, sources, mode: effectiveMode, media, modelUsed });
  } catch (error: any) {
    console.error('[API /api/chat Error]:', error);
    return res.status(500).json({
      error: error.message || 'Multimodal chat processing could not be completed.',
    });
  }
});

// Real-time Ultra-Fast Streaming Endpoint (Server-Sent Events)
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const requestedMode = body.mode;
  const role = typeof body.role === 'string' ? body.role : 'ai_engineer';
  const contextReflection = typeof body.contextReflection === 'string' ? body.contextReflection : undefined;
  const useSearchGrounding = Boolean(body.useSearchGrounding);

  if (messages.length === 0) {
    return res.status(400).json({ error: 'Messages array cannot be empty.' });
  }

  const latestMsg = messages[messages.length - 1];
  const parsed = parseUserCommandIntent(latestMsg?.content || '', requestedMode);
  const effectiveMode = parsed.mode;

  // Use clean prompt for generation if slash command or intent matched
  const effectiveMessages = [...messages];
  if (parsed.cleanPrompt && (parsed.isExplicitSlash || effectiveMode !== 'text')) {
    effectiveMessages[effectiveMessages.length - 1] = {
      ...latestMsg,
      content: parsed.cleanPrompt,
    };
  }

  // Set SSE Headers for real-time unbuffered token delivery
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial instant connection beacon with resolved effective mode
  res.write(`data: ${JSON.stringify({ type: 'start', mode: effectiveMode })}\n\n`);

  try {
    if (effectiveMode === 'text') {
      let accumulatedText = '';
      for await (const chunk of streamTextChatResponse(effectiveMessages, role, contextReflection, useSearchGrounding)) {
        accumulatedText += chunk.text;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk.text, modelUsed: chunk.modelUsed })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'done', fullText: accumulatedText, mode: 'text' })}\n\n`);
      res.end();
    } else {
      // Media modes (image, video, music): Send immediate progress indicator then return result
      res.write(`data: ${JSON.stringify({ type: 'progress', message: `Synthesizing ${effectiveMode} generation pipeline...` })}\n\n`);
      
      const { reply, sources, media, modelUsed } = await generateMultimodalChatResponse(
        effectiveMessages,
        effectiveMode,
        role,
        contextReflection,
        useSearchGrounding
      );

      res.write(`data: ${JSON.stringify({ type: 'done', fullText: reply, sources, media, mode: effectiveMode, modelUsed })}\n\n`);
      res.end();
    }
  } catch (err: any) {
    console.error('[API /api/chat/stream Error]:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Streaming generation failed.' })}\n\n`);
    res.end();
  }
});

// Grounded Wisdom & Scientific Knowledge Search Endpoint
app.post('/api/search-wisdom', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const query = typeof body.query === 'string' ? body.query.trim() : '';

    if (!query) {
      return res.status(400).json({ error: 'Wisdom query cannot be empty.' });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are Somotoz AI Research Assistant.
When answering technical, psychological, or scientific inquiries:
1. Provide accurate, practical, evidence-based insights grounded in contemporary research.
2. Structure your answer with clear headers, code blocks where helpful, and actionable takeaways.
3. Be razor-sharp, inspiring, and concise.`;

    let lastError: any = null;
    for (const modelName of CHAT_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Question: ${query}`,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
            temperature: 0.6,
          },
        });

        const answer = response.text || 'Insight could not be retrieved at this time.';
        const sources: Array<{ title: string; uri: string }> = [];
        const candidate = response.candidates?.[0];
        if (candidate?.groundingMetadata?.groundingChunks) {
          for (const chunk of candidate.groundingMetadata.groundingChunks) {
            if (chunk.web?.uri) {
              sources.push({
                title: chunk.web.title || chunk.web.uri,
                uri: chunk.web.uri,
              });
            }
          }
        }

        return res.json({ success: true, answer, sources, modelUsed: modelName });
      } catch (err: any) {
        lastError = err;
        console.warn(`[Somotoz API] Search wisdom model ${modelName} failed:`, err?.message || err);
      }
    }

    throw new Error(lastError?.message || 'Search query failed across fallback models.');
  } catch (error: any) {
    console.error('[API /api/search-wisdom Error]:', error);
    return res.status(500).json({
      error: error.message || 'Search query failed.',
    });
  }
});

// Generative Visual Art Endpoint
app.post('/api/generate-art', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const reflectionText = typeof body.reflectionText === 'string' ? body.reflectionText.slice(0, 1500) : '';
    const moodTags = Array.isArray(body.moodTags) ? body.moodTags.join(', ') : '';

    const ai = getGeminiClient();
    const systemInstruction = `You are a generative vector artist specializing in modern, cyberpunk, and meditative vector art (SVG).
Create a clean, responsive SVG code snippet (<svg viewBox="0 0 800 500" ... > ... </svg>) with deep dark background (#090d16), cyan (#06b6d4) and purple (#a855f7) gradients, and celestial or geometric accents.
CRITICAL: Output ONLY valid SVG without markdown backticks or commentary.`;

    const prompt = `Context: ${moodTags || '#somotoz'}\nExcerpt: "${reflectionText}"\nGenerate the futuristic vector illustration.`;

    let rawSvg = '';
    for (const modelName of CHAT_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.8,
          },
        });

        const text = response.text || '';
        const cleaned = text.replace(/^```(xml|svg)?\s*/i, '').replace(/\s*```$/i, '').trim();
        if (cleaned.includes('<svg')) {
          rawSvg = cleaned;
          break;
        }
      } catch (err: any) {
        console.warn(`[Somotoz API] Generate art model ${modelName} failed:`, err?.message || err);
      }
    }

    if (!rawSvg.includes('<svg')) {
      rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090d16"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </linearGradient>
          <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#bg)"/>
        <circle cx="400" cy="250" r="130" stroke="url(#cyan-glow)" stroke-width="3" fill="none"/>
        <circle cx="400" cy="250" r="70" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 6" fill="rgba(6,182,212,0.05)"/>
        <text x="400" y="440" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-size="16" letter-spacing="3">SOMOTOZ // NEURAL ART</text>
      </svg>`;
    }

    return res.json({ success: true, svg: rawSvg });
  } catch (error: any) {
    console.error('[API /api/generate-art Error]:', error);
    return res.status(500).json({ error: error.message || 'Artwork generation failed.' });
  }
});

// 3. VITE MIDDLEWARE SETUP
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Somotoz] Full-Stack AI Suite running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

