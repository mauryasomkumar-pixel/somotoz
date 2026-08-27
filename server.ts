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

// Resilient Model Fallback Ladders
const REFLECTION_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

const TRANSCRIBE_MODELS = [
  'gemini-3.5-transcribe',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

const CHAT_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

interface AIReflectionResult {
  title: string;
  conversationalReply: string;
  moodTags: string[];
  actionableTakeaways: string[];
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

  throw new Error(`Failed to generate reflection across all fallback models: ${lastError?.message || 'Unknown error'}`);
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

    for (const modelName of ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-flash-latest']) {
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

        if (!rawSvg.includes('<svg')) {
          rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
            <defs>
              <linearGradient id="cyber-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#090d16"/>
                <stop offset="50%" stop-color="#0f172a"/>
                <stop offset="100%" stop-color="#1e1b4b"/>
              </linearGradient>
              <linearGradient id="neon-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#06b6d4"/>
                <stop offset="100%" stop-color="#a855f7"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect width="800" height="600" fill="url(#cyber-bg)"/>
            <circle cx="400" cy="300" r="160" stroke="url(#neon-glow)" stroke-width="4" fill="none" filter="url(#glow)"/>
            <circle cx="400" cy="300" r="100" stroke="#06b6d4" stroke-width="2" stroke-dasharray="8 8" fill="none"/>
            <polygon points="400,200 480,340 320,340" stroke="#a855f7" stroke-width="3" fill="rgba(168,85,247,0.15)" filter="url(#glow)"/>
            <text x="400" y="520" text-anchor="middle" fill="#22d3ee" font-family="monospace" font-size="20" letter-spacing="4">SOMOTOZ // SYNTHESIZED VISUAL</text>
          </svg>`;
        }

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
      } catch (err: any) {
        console.warn(`[Somotoz Image Generator] Model ${modelName} failed:`, err?.message);
      }
    }
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

    for (const modelName of ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-flash-latest']) {
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

    for (const modelName of ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-flash-latest']) {
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
  }

  // 4. DEFAULT TEXT MODE: High-performance reasoning & empathetic guidance
  let roleInstruction = '';
  switch (role) {
    case 'ai_engineer':
      roleInstruction = `You are Somotoz AI Engineer, a world-class AI researcher, full-stack systems architect, and multimodal intelligence agent.
Provide deep, rigorous, and actionable insights with clean code examples, technical breakdowns, mathematical intuition, and futuristic architecture guidance.`;
      break;
    case 'cognitive_reframer':
      roleInstruction = `You are a Cognitive Reframer and CBT-informed guide in Somotoz. Help the user gently examine automatic thoughts, uncover cognitive distortions, and construct balanced, grounded perspectives.`;
      break;
    case 'socratic_guide':
      roleInstruction = `You are a Socratic Wisdom Companion in Somotoz. Ask deep, insightful, clarifying open-ended questions that help the user uncover their own inner truth, values, and strategic goals.`;
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
Format code with proper markdown backticks and specify language. Keep answers lucid, well-structured, and inspiring.
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
    }
  }

  throw new Error('Chat generation failed across all available fallback models.');
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

// Multimodal Chat / Generation Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const mode = (body.mode === 'image' || body.mode === 'video' || body.mode === 'music') ? body.mode : 'text';
    const role = typeof body.role === 'string' ? body.role : 'ai_engineer';
    const contextReflection = typeof body.contextReflection === 'string' ? body.contextReflection : undefined;
    const useSearchGrounding = Boolean(body.useSearchGrounding);

    if (messages.length === 0) {
      return res.status(400).json({ error: 'Messages array cannot be empty.' });
    }

    const { reply, sources, media, modelUsed } = await generateMultimodalChatResponse(
      messages,
      mode,
      role,
      contextReflection,
      useSearchGrounding
    );

    return res.json({ success: true, reply, sources, mode, media, modelUsed });
  } catch (error: any) {
    console.error('[API /api/chat Error]:', error);
    return res.status(500).json({
      error: error.message || 'Multimodal chat processing could not be completed.',
    });
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
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

    return res.json({ success: true, answer, sources });
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    let rawSvg = response.text || '';
    rawSvg = rawSvg.replace(/^```(xml|svg)?\s*/i, '').replace(/\s*```$/i, '').trim();

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

