import { motion } from "framer-motion";
import { GraduationCap, UserCircle } from "lucide-react";

interface TutorMessageProps {
  text: string;
  role?: "guide" | "coach";
}

export function TutorMessage({ text, role = "guide" }: TutorMessageProps) {
  const RoleIcon = role === "coach" ? GraduationCap : UserCircle;
  
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
          <RoleIcon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-base md:text-lg font-medium leading-relaxed text-card-foreground">
            {text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
