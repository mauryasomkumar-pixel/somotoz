import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smile,
  Sparkles,
  Cpu,
  ThumbsUp,
  Flame,
  Search,
  X,
  Zap,
  Music,
  Compass,
  Star
} from 'lucide-react';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'popular',
    name: 'Top Picks',
    icon: Zap,
    emojis: [
      '⚡', '🤖', '✨', '💡', '🔥', '🧠', '🚀', '💬',
      '📝', '👍', '🎯', '💻', '💚', '⭐', '☕', '🙌'
    ],
  },
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
      '🥲', '☺️', '😊', '😇', '🙂', '😉', '😌', '😍',
      '🥰', '😘', '😋', '😛', '😜', '🤪', '🤨', '🧐',
      '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞',
      '😔', '😟', '😕', '🙁', '😣', '🥺', '😢', '😭',
      '😤', '😠', '😡', '🤯', '😳', '🥵', '🥶', '😱',
      '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😬', '🙄',
      '🥱', '😴', '🤤', '😵', '🤐', '🥴', '🤧', '😷'
    ],
  },
  {
    id: 'tech',
    name: 'Tech & AI',
    icon: Cpu,
    emojis: [
      '🤖', '💻', '🖥️', '📱', '🔋', '🔌', '⚙️', '🔧',
      '🔨', '📡', '🌐', '🛰️', '🔬', '🔭', '🧬', '🧪',
      '💡', '⚡', '🕹️', '💾', '💿', '🖨️', '⌨️', '🖱️',
      '📊', '📈', '📉', '🗄️', '📦', '🔒', '🔓', '🔑',
      '🛡️', '🧭', '⚙️', '🛰️', '🔮', '📐', '📏', '📎'
    ],
  },
  {
    id: 'hands',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️',
      '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆',
      '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙',
      '✍️', '👏', '🤝', '🙌', '👐', '🤲', '🙏', '💪'
    ],
  },
  {
    id: 'media',
    name: 'Media & Art',
    icon: Music,
    emojis: [
      '🎨', '🎬', '🎵', '🎶', '🎸', '🎹', '🎧', '📸',
      '📹', '🎤', '🎙️', '📻', '📼', '🪄', '🎭', '🎪',
      '🎼', '🥁', '🎷', '🎺', '🎻', '🖌️', '🖍️', '🧵'
    ],
  },
  {
    id: 'nature',
    name: 'Nature & Vibes',
    icon: Sparkles,
    emojis: [
      '✨', '⭐', '🌟', '💫', '💥', '🔥', '🌈', '☀️',
      '🌙', '🪐', '🌌', '🌱', '🌿', '🍀', '🌸', '🌺',
      '🌻', '🍂', '🍁', '🌊', '💧', '❄️', '🌪️', '🎯',
      '🏆', '🥇', '💚', '🖤', '🤍', '💯', '⚠️', 'ℹ️'
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Filter emojis by search query or active category
  const displayedEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      const activeCat = EMOJI_CATEGORIES.find((c) => c.id === selectedCategoryId);
      return activeCat ? activeCat.emojis : EMOJI_CATEGORIES[0].emojis;
    }

    // Flatten all emojis and filter
    const all = Array.from(new Set(EMOJI_CATEGORIES.flatMap((c) => c.emojis)));
    return all;
  }, [searchQuery, selectedCategoryId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={pickerRef}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full right-0 sm:right-2 mb-2 w-[310px] sm:w-[340px] bg-[#000000] border border-[#262626] shadow-[4px_4px_0px_0px_#141414] z-50 font-mono overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-2.5 bg-[#0A0A0A] border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-[#EDEDED] font-bold">
            <Smile className="w-3.5 h-3.5 text-[#00FF41]" />
            <span>EXPRESSIONS // EMOJI</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#737373] hover:text-[#EDEDED] hover:bg-[#171717] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center px-2 py-1.5 bg-[#0D0D0D] border-b border-[#262626] gap-1 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategoryId === cat.id && !searchQuery;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSearchQuery('');
                }}
                className={`p-1.5 shrink-0 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-black text-[#00FF41] border-[#00FF41] shadow-[1px_1px_0px_0px_#00FF41]'
                    : 'bg-[#0A0A0A] text-[#737373] hover:text-[#EDEDED] border-[#262626]'
                }`}
                title={cat.name}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="p-2 bg-black border-b border-[#262626]">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#0D0D0D] border border-[#262626] focus-within:border-[#00FF41] transition-colors">
            <Search className="w-3 h-3 text-[#737373]" />
            <input
              type="text"
              placeholder="Search emoji..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#EDEDED] placeholder-[#525252] focus:outline-none font-mono"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#737373] hover:text-[#EDEDED]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Emoji Grid */}
        <div className="p-2 max-h-[210px] overflow-y-auto grid grid-cols-7 sm:grid-cols-8 gap-1 bg-[#000000]">
          {displayedEmojis.map((emoji, idx) => (
            <button
              key={`${emoji}-${idx}`}
              type="button"
              onClick={() => {
                onSelectEmoji(emoji);
              }}
              className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 bg-black hover:bg-[#0A0A0A] border border-transparent hover:border-[#00FF41] transition-all cursor-pointer select-none"
              title={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-2.5 py-1.5 bg-[#0A0A0A] border-t border-[#262626] flex items-center justify-between text-[10px] text-[#737373]">
          <span>Click to insert into prompt</span>
          <span className="text-[#00FF41]">{displayedEmojis.length} emojis</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
