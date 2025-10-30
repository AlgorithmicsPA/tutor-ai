import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface SpeechOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  lang?: string;
}

interface SpeechContextType {
  speak: (text: string, messageId: string, options?: SpeechOptions) => void;
  stop: (messageId: string) => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: (messageId: string) => boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  getChildFriendlyVoices: () => SpeechSynthesisVoice[];
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);

      // Load voices with event listener (allows multiple subscribers)
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      };

      // Initial load
      loadVoices();
      
      // Listen for voice changes (use addEventListener instead of assignment)
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

      // Cleanup
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      };
    }
  }, []);

  const speak = useCallback((text: string, messageId: string, options: SpeechOptions = {}) => {
    if (!supported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set options
    if (options.voice) {
      utterance.voice = options.voice;
    }
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.lang = options.lang ?? "es-ES";

    utterance.onstart = () => setCurrentMessageId(messageId);
    utterance.onend = () => setCurrentMessageId(null);
    utterance.onerror = () => setCurrentMessageId(null);

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const stop = useCallback((messageId: string) => {
    if (supported && currentMessageId === messageId) {
      window.speechSynthesis.cancel();
      setCurrentMessageId(null);
    }
  }, [supported, currentMessageId]);

  const pause = useCallback(() => {
    if (supported && currentMessageId) {
      window.speechSynthesis.pause();
    }
  }, [supported, currentMessageId]);

  const resume = useCallback(() => {
    if (supported) {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  const isSpeaking = useCallback((messageId: string) => {
    return currentMessageId === messageId;
  }, [currentMessageId]);

  // Get child-friendly Spanish voices
  const getChildFriendlyVoices = useCallback(() => {
    return voices.filter((voice) => {
      const lang = voice.lang.toLowerCase();
      return lang.includes("es") || lang.includes("spanish");
    });
  }, [voices]);

  return (
    <SpeechContext.Provider
      value={{
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        supported,
        voices,
        getChildFriendlyVoices,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const context = useContext(SpeechContext);
  if (context === undefined) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
}
