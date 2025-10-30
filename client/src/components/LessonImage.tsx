import { motion } from "framer-motion";
import { useState } from "react";

interface LessonImageProps {
  src: string;
  alt?: string;
}

export function LessonImage({ src, alt = "" }: LessonImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl shadow-md"
      data-testid="lesson-image"
    >
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className="w-full max-h-96 object-cover"
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />
      {alt && (
        <p className="text-sm text-center text-muted-foreground pt-2 px-2">
          {alt}
        </p>
      )}
    </motion.div>
  );
}
