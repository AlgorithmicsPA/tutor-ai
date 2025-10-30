import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Loader2, GraduationCap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage, TutorRequest, TutorResponse } from "@shared/schema";

const SYSTEM_PROMPT = `Eres "Profe DANA", un tutor infantil amable y paciente. 
Explica conceptos de forma breve y clara, usando ejemplos divertidos.
Siempre pregunta: "¿Quieres intentarlo conmigo?" para motivar al estudiante.
Evita temas no aptos para niños.
No des respuestas directas de evaluaciones - guía al estudiante a descubrirlas.`;

interface ChatInterfaceProps {
  provider: "openai" | "gemini";
}

export function ChatInterface({ provider }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await apiRequest<TutorResponse>(
        "POST",
        "/api/tutor",
        {
          messages: [...messages, userMessage],
          provider,
          system: SYSTEM_PROMPT,
        }
      );

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to get tutor response:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Lo siento, tuve un problema. ¿Puedes intentar de nuevo?",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="bg-card rounded-2xl border-2 border-card-border shadow-sm overflow-hidden flex flex-col h-[600px]"
      data-testid="chat-interface"
    >
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 border-b-2 border-primary-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold font-display">Profe DANA</h3>
            <p className="text-xs opacity-90">Tu tutora virtual</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center px-4">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm max-w-xs">
                ¡Hola! Soy Profe DANA. Pregúntame cualquier cosa sobre la lección.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`chat-message-${message.role}`}
            >
              <div
                className={`
                  max-w-xs md:max-w-md rounded-2xl px-4 py-3 text-sm
                  ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-foreground mr-auto"
                  }
                `}
              >
                <p className="leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-muted text-foreground rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Profe DANA está escribiendo...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t-2 border-card-border bg-background">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Escribe tu pregunta aquí..."
            disabled={isLoading}
            className="flex-1 rounded-xl px-4 py-3 border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-full aspect-square rounded-xl"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
