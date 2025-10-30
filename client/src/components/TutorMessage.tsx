import { motion } from "framer-motion";
import { GraduationCap, UserCircle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/contexts/SpeechContext";
import { useEffect, useState } from "react";

interface TutorMessageProps {
  text: string;
  role?: "guide" | "coach";
  enableVoice?: boolean;
  autoplay?: boolean;
  messageId?: string;
}

export function TutorMessage({ text, role = "guide", enableVoice = true, autoplay = false, messageId }: TutorMessageProps) {
  const RoleIcon = role === "coach" ? GraduationCap : UserCircle;
  const { speak, stop, isSpeaking, supported, getChildFriendlyVoices, voices } = useSpeech();
  const [hasPlayed, setHasPlayed] = useState(false);
  
  // Generate unique ID if not provided
  const id = messageId || `tutor-msg-${text.slice(0, 20)}`;

  // Autoplay on mount if enabled
  useEffect(() => {
    if (autoplay && enableVoice && supported && !hasPlayed && voices.length > 0) {
      const childVoices = getChildFriendlyVoices();
      const selectedVoice = childVoices[0] || voices[0];
      
      speak(text, id, {
        voice: selectedVoice,
        rate: 0.9, // Slightly slower for children
        lang: "es-ES",
      });
      setHasPlayed(true);
    }
  }, [autoplay, enableVoice, supported, hasPlayed, voices, text, speak, getChildFriendlyVoices, id]);

  const handleSpeak = () => {
    const isCurrentlySpeaking = isSpeaking(id);
    
    if (isCurrentlySpeaking) {
      stop(id);
    } else {
      const childVoices = getChildFriendlyVoices();
      const selectedVoice = childVoices[0] || voices[0];
      
      speak(text, id, {
        voice: selectedVoice,
        rate: 0.9,
        lang: "es-ES",
      });
      setHasPlayed(true);
    }
  };
  
  const speaking = isSpeaking(id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-2xl p-5 md:p-6 border-2 border-card-border shadow-sm"
      data-testid="tutor-message"
    >
      <div className="flex gap-3 items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <RoleIcon className="w-6 h-6 text-primary" data-testid="tutor-icon" />
        </div>
        <div className="flex-1">
          <p className="text-base md:text-lg font-medium leading-relaxed text-card-foreground">
            {text}
          </p>
        </div>
        {enableVoice && supported && (
          <div className="flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSpeak}
              data-testid="button-speak"
              className="hover-elevate active-elevate-2"
            >
              {speaking ? (
                <VolumeX className="w-5 h-5" data-testid="icon-speaking" />
              ) : (
                <Volume2 className="w-5 h-5" data-testid="icon-stopped" />
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
