import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Sparkles, BookOpen, X, ChevronRight, Check } from 'lucide-react';

interface FirstTimeTourProps {
  onComplete?: () => void;
  forceOpen?: boolean;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Chats',
    subtitle: 'Real human conversations',
    description:
      'Connect with real people in private, safe messages. A conversation opens only after both people accept a request. You can block or report anyone at any time.',
    icon: MessageSquare,
    accentColor: '#00F0FF',
  },
  {
    title: 'Ask AI',
    subtitle: 'Smart multimodal creation',
    description:
      'Ask questions, generate vector images, simulate 60 FPS motion videos, and create calming 432Hz music synthesizers using Google Gemini.',
    icon: Sparkles,
    accentColor: '#A855F7',
  },
  {
    title: 'Journal',
    subtitle: 'Mindful daily reflections',
    description:
      'Write down your thoughts, record your daily mood, and reflect on personal insights. Everything stays private and secure to your account.',
    icon: BookOpen,
    accentColor: '#00FF41',
  },
];

export const FirstTimeTour: React.FC<FirstTimeTourProps> = ({ onComplete, forceOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }
    try {
      const tourDone = localStorage.getItem('somotoz_tour_completed');
      if (tourDone !== 'true') {
        // Wait 1 second after initial load to present the tour smoothly
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, [forceOpen]);

  const handleDismiss = () => {
    try {
      localStorage.setItem('somotoz_tour_completed', 'true');
    } catch {}
    setIsOpen(false);
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 text-[var(--text-primary)] font-sans"
        >
          {/* Close / Skip button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Tour Step Indicator */}
          <div className="flex items-center gap-1.5 mb-4">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-[var(--accent-color)]'
                    : 'w-2 bg-[var(--border-color)]'
                }`}
              />
            ))}
            <span className="text-[11px] font-medium text-[var(--text-secondary)] ml-auto">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          {/* Step Icon & Title */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${step.accentColor}1A`,
                color: step.accentColor,
                border: `1px solid ${step.accentColor}40`,
              }}
            >
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{step.title}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{step.subtitle}</p>
            </div>
          </div>

          {/* Step Description */}
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer px-2 py-1"
            >
              Skip
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-[var(--accent-color)] text-black text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              {isLastStep ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
