import { useState } from "react";
import { LessonRenderer } from "@/components/LessonRenderer";
import { ChatInterface } from "@/components/ChatInterface";
import { ProviderSelector } from "@/components/ProviderSelector";
import { demoLesson } from "@/data/demo-lesson";
import { motion } from "framer-motion";

export default function Home() {
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
                Tutor IA
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Plataforma de aprendizaje interactivo
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ProviderSelector value={provider} onChange={setProvider} />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <LessonRenderer lesson={demoLesson} />
            </motion.div>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:sticky lg:top-24"
            >
              <ChatInterface provider={provider} />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Tutor IA - Aprendizaje personalizado con inteligencia artificial
          </p>
        </div>
      </footer>
    </div>
  );
}
