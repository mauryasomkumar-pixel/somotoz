import { GenerationMode } from '../types';

export interface ParsedClientCommand {
  mode: GenerationMode;
  cleanPrompt: string;
  isExplicitSlash: boolean;
  commandName?: string;
  badgeLabel: string;
}

export const SLASH_COMMANDS = [
  {
    command: '/image',
    aliases: ['/img', '/draw', '/art', '/svg'],
    mode: 'image' as GenerationMode,
    label: 'Generate Image',
    syntax: '/image [prompt]',
    example: '/image Cyberpunk glowing matrix neon city',
    desc: 'Render high-resolution scalable vector artwork & illustrations',
    icon: '✨',
  },
  {
    command: '/video',
    aliases: ['/vid', '/anim', '/motion'],
    mode: 'video' as GenerationMode,
    label: 'Generate Video',
    syntax: '/video [prompt]',
    example: '/video Neural particle convergence in deep space',
    desc: 'Synthesize 60FPS motion simulations & keyframe sequences',
    icon: '🎬',
  },
  {
    command: '/music',
    aliases: ['/audio', '/song', '/melody', '/synth'],
    mode: 'music' as GenerationMode,
    label: 'Generate Music',
    syntax: '/music [prompt]',
    example: '/music Calming 432Hz ambient meditation soundscape',
    desc: 'Compose procedural frequencies & interactive audio melodies',
    icon: '🎵',
  },
  {
    command: '/pdf',
    aliases: ['/export'],
    mode: 'text' as GenerationMode,
    label: 'PDF Export Format',
    syntax: '/pdf [topic]',
    example: '/pdf AI Architecture cheat sheet for production',
    desc: 'Structure comprehensive response formatted for instant PDF download',
    icon: '📄',
  },
  {
    command: '/search',
    aliases: ['/web', '/find'],
    mode: 'text' as GenerationMode,
    label: 'Google Grounded Search',
    syntax: '/search [query]',
    example: '/search Latest breakthrough in quantum neuromorphic chips',
    desc: 'Retrieve realtime grounded web citations and live data',
    icon: '🌐',
  },
];

/**
 * Parses user input for slash commands or natural language intent
 */
export function parseClientInputIntent(text: string, activeFallbackMode: GenerationMode = 'text'): ParsedClientCommand {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return {
      mode: activeFallbackMode,
      cleanPrompt: '',
      isExplicitSlash: false,
      badgeLabel: activeFallbackMode === 'text' ? 'SMART CHAT' : activeFallbackMode.toUpperCase(),
    };
  }

  // 1. Explicit Slash Commands
  const imageSlashMatch = trimmed.match(/^\/(image|img|draw|art|svg|photo|pic)\s*(.*)$/i);
  if (imageSlashMatch) {
    return {
      mode: 'image',
      cleanPrompt: imageSlashMatch[2]?.trim() || '',
      isExplicitSlash: true,
      commandName: `/${imageSlashMatch[1].toLowerCase()}`,
      badgeLabel: 'IMAGE GENERATION PIPELINE',
    };
  }

  const videoSlashMatch = trimmed.match(/^\/(video|vid|anim|animate|motion|scene|clip)\s*(.*)$/i);
  if (videoSlashMatch) {
    return {
      mode: 'video',
      cleanPrompt: videoSlashMatch[2]?.trim() || '',
      isExplicitSlash: true,
      commandName: `/${videoSlashMatch[1].toLowerCase()}`,
      badgeLabel: 'VIDEO MOTION PIPELINE',
    };
  }

  const musicSlashMatch = trimmed.match(/^\/(music|audio|song|melody|beat|sound|synth)\s*(.*)$/i);
  if (musicSlashMatch) {
    return {
      mode: 'music',
      cleanPrompt: musicSlashMatch[2]?.trim() || '',
      isExplicitSlash: true,
      commandName: `/${musicSlashMatch[1].toLowerCase()}`,
      badgeLabel: '432HZ AUDIO SYNTHESIS',
    };
  }

  // 2. Natural Language Intent Parsing (English, Hindi, Hinglish)
  // Image Intent
  const imageIntentMatch = trimmed.match(
    /^(?:please\s+)?(?:generate|create|make|draw|render|paint|design|build|show\s+me)\s+(?:an?\s+)?(?:image|picture|photo|illustration|drawing|visual|graphic|artwork|svg|wallpaper|logo|banner|poster)\s+(?:of|for|about|with|depicting|showing)?\s*(.*)$/i
  );
  if (imageIntentMatch && imageIntentMatch[1]?.trim()) {
    return {
      mode: 'image',
      cleanPrompt: imageIntentMatch[1].trim(),
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: IMAGE PIPELINE',
    };
  }

  const directDrawMatch = trimmed.match(/^(?:please\s+)?(?:draw|paint|sketch|illustrate)\s+(?:me\s+)?(?:an?\s+)?(.*)$/i);
  if (directDrawMatch && directDrawMatch[1]?.trim() && !directDrawMatch[1].toLowerCase().startsWith('a conclusion') && !directDrawMatch[1].toLowerCase().startsWith('insights')) {
    return {
      mode: 'image',
      cleanPrompt: directDrawMatch[1].trim(),
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: IMAGE PIPELINE',
    };
  }

  const imagePrefixMatch = trimmed.match(/^(?:image|picture|photo|illustration)\s+(?:of|for)\s+(.*)$/i);
  if (imagePrefixMatch && imagePrefixMatch[1]?.trim()) {
    return {
      mode: 'image',
      cleanPrompt: imagePrefixMatch[1].trim(),
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: IMAGE PIPELINE',
    };
  }

  // Hindi / Hinglish Image Intent
  if (/(?:image|photo|tasveer|picture|chitra)\s+(?:banao|bana\s+do|generate\s+karo|chahiye)/i.test(trimmed)) {
    const cleaned = trimmed.replace(/(?:image|photo|tasveer|picture|chitra)\s+(?:banao|bana\s+do|generate\s+karo|chahiye)/gi, '').trim();
    return {
      mode: 'image',
      cleanPrompt: cleaned || trimmed,
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: IMAGE PIPELINE',
    };
  }

  // Video Intent
  const videoIntentMatch = trimmed.match(
    /^(?:please\s+)?(?:generate|create|make|render|produce|show\s+me|animate)\s+(?:an?\s+)?(?:video|clip|animation|storyboard|motion\s+scene|motion\s+sequence|footage|cinematic)\s+(?:of|for|about|with|depicting|showing)?\s*(.*)$/i
  );
  if (videoIntentMatch && videoIntentMatch[1]?.trim()) {
    return {
      mode: 'video',
      cleanPrompt: videoIntentMatch[1].trim(),
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: VIDEO PIPELINE',
    };
  }

  const videoPrefixMatch = trimmed.match(/^(?:video|animation|cinematic|motion\s+scene)\s+(?:of|for)\s+(.*)$/i);
  if (videoPrefixMatch && videoPrefixMatch[1]?.trim()) {
    return {
      mode: 'video',
      cleanPrompt: videoPrefixMatch[1].trim(),
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: VIDEO PIPELINE',
    };
  }

  // Hindi / Hinglish Video Intent
  if (/(?:video|animation|scene)\s+(?:banao|bana\s+do|generate\s+karo|chahiye)/i.test(trimmed)) {
    const cleaned = trimmed.replace(/(?:video|animation|scene)\s+(?:banao|bana\s+do|generate\s+karo|chahiye)/gi, '').trim();
    return {
      mode: 'video',
      cleanPrompt: cleaned || trimmed,
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: VIDEO PIPELINE',
    };
  }

  // Music Intent
  const musicIntentMatch = trimmed.match(
    /^(?:please\s+)?(?:generate|create|make|compose|play|synthesize|produce)\s+(?:an?\s+)?(?:music|song|audio|track|soundtrack|melody|beat|tune|soundscape|ambient\s+sound)\s+(?:of|for|about|with|depicting)?\s*(.*)$/i
  );
  if (musicIntentMatch && musicIntentMatch[1]?.trim()) {
    return {
      mode: 'music',
      cleanPrompt: musicIntentMatch[1].trim(),
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: MUSIC SYNTHESIS',
    };
  }

  const musicPrefixMatch = trimmed.match(/^(?:music|melody|song|audio\s+track)\s+(?:of|for|about)\s+(.*)$/i);
  if (musicPrefixMatch && musicPrefixMatch[1]?.trim()) {
    return {
      mode: 'music',
      cleanPrompt: musicPrefixMatch[1].trim(),
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: MUSIC SYNTHESIS',
    };
  }

  // Hindi / Hinglish Music Intent
  if (/(?:music|gana|audio|song|melody|beat)\s+(?:banao|bana\s+do|compose\s+karo|generate\s+karo|sunao|chahiye)/i.test(trimmed)) {
    const cleaned = trimmed.replace(/(?:music|gana|audio|song|melody|beat)\s+(?:banao|bana\s+do|compose\s+karo|generate\s+karo|sunao|chahiye)/gi, '').trim();
    return {
      mode: 'music',
      cleanPrompt: cleaned || trimmed,
      isExplicitSlash: false,
      badgeLabel: 'AUTO-ROUTED: MUSIC SYNTHESIS',
    };
  }

  // Fallback explicit mode check
  if (activeFallbackMode === 'image' || activeFallbackMode === 'video' || activeFallbackMode === 'music') {
    return {
      mode: activeFallbackMode,
      cleanPrompt: trimmed,
      isExplicitSlash: false,
      badgeLabel: activeFallbackMode.toUpperCase(),
    };
  }

  return {
    mode: 'text',
    cleanPrompt: trimmed,
    isExplicitSlash: false,
    badgeLabel: 'SMART CHAT',
  };
}
