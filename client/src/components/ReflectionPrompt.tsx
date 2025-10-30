import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface ReflectionPromptProps {
  prompt: string;
}

export function ReflectionPrompt({ prompt }: ReflectionPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="border-l-4 border-primary pl-6 py-4"
      data-testid="reflection-prompt"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <p className="text-base md:text-lg italic text-foreground flex-1 leading-relaxed">
          {prompt}
        </p>
      </div>
    </motion.div>
  );
}
