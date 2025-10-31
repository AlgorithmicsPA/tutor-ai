import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, CheckCircle2, Wand2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LessonParams {
  title?: string;
  audience?: "children" | "teens" | "adults" | "professional";
  duration?: number;
  level?: "beginner" | "intermediate" | "advanced";
  type?: "theory" | "practice" | "mixed";
  objectives?: string[];
}

const ORCHESTRATOR_SYSTEM_PROMPT = `Eres un asistente que ayuda a planificar lecciones educativas.

Recopila esta información haciendo una pregunta a la vez:
1. Tema de la lección
2. Audiencia (niños, adolescentes, adultos, profesionales)
3. Duración en minutos
4. Nivel (principiante, intermedio, avanzado)
5. Tipo (teoría, práctica, o balanceado)

Sé breve y amigable. Usa español. Cuando tengas toda la información, di: "¡Listo! ¿Quieres que genere la lección?"

Comienza saludando y preguntando sobre qué tema quieren la lección.`;

export default function LessonOrchestrator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [params, setParams] = useState<LessonParams>({});
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest<{ reply: string }>("POST", "/api/tutor", {
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage }
        ],
        system: ORCHESTRATOR_SYSTEM_PROMPT,
        provider: "openai"
      });
      return response.reply;
    },
    onSuccess: (reply) => {
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      
      // Check if conversation is complete
      if (reply.toLowerCase().includes("genere la lección") || 
          reply.toLowerCase().includes("crear la lección")) {
        setIsComplete(true);
      }
      
      // Try to extract parameters from the conversation
      extractParams([...messages, { role: "assistant", content: reply }]);
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!params.title || !params.audience || !params.duration || !params.level || !params.type) {
        throw new Error("Faltan parámetros necesarios");
      }

      // Map audience to age range for backward compatibility
      const ageMap = {
        children: "7-9",
        teens: "13-17",
        adults: "18-65",
        professional: "65+"
      };

      const response = await apiRequest<{ lesson: any }>("POST", "/api/lessons/generate", {
        title: params.title,
        age: ageMap[params.audience],
        objectives: params.objectives || ["Comprender el tema", "Aplicar conocimientos"],
        audience: params.audience,
        duration: params.duration,
        level: params.level,
        type: params.type,
        generateImages: true
      });
      
      return response.lesson;
    },
    onSuccess: (lesson) => {
      toast({
        title: "¡Lección creada!",
        description: `"${lesson.meta.title}" se ha generado exitosamente.`,
      });
      
      // Redirect to lesson editor
      setLocation(`/admin/lessons/${lesson.meta.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error al generar lección",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const extractParams = (allMessages: Message[]) => {
    const conversation = allMessages.map(m => `${m.role}: ${m.content}`).join("\n");
    const newParams: LessonParams = { ...params };

    // Extract audience
    if (conversation.match(/niños|children|7-9/i)) newParams.audience = "children";
    else if (conversation.match(/adolescentes|teens|13-17/i)) newParams.audience = "teens";
    else if (conversation.match(/adultos|adults|18-65/i)) newParams.audience = "adults";
    else if (conversation.match(/profesionales|professional|65\+/i)) newParams.audience = "professional";

    // Extract level
    if (conversation.match(/principiante|beginner|básico/i)) newParams.level = "beginner";
    else if (conversation.match(/intermedio|intermediate/i)) newParams.level = "intermediate";
    else if (conversation.match(/avanzado|advanced/i)) newParams.level = "advanced";

    // Extract type
    if (conversation.match(/teoría|theory|teórico/i) && !conversation.match(/práctica|practice/i)) {
      newParams.type = "theory";
    } else if (conversation.match(/práctica|practice|práctico/i) && !conversation.match(/teoría|theory/i)) {
      newParams.type = "practice";
    } else if (conversation.match(/balanceado|mixed|equilibrado|mixto/i)) {
      newParams.type = "mixed";
    }

    // Extract duration (look for numbers followed by "minutos" or standalone numbers in context)
    const durationMatch = conversation.match(/(\d+)\s*(?:minutos|min|minutes)/i);
    if (durationMatch) {
      const duration = parseInt(durationMatch[1]);
      if (duration >= 10 && duration <= 240) {
        newParams.duration = duration;
      }
    }

    setParams(newParams);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    chatMutation.mutate(input);
  };

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const startConversation = () => {
    const initialMessage = "¡Hola! Soy tu asistente para crear lecciones de IA. Voy a hacerte algunas preguntas para diseñar la lección perfecta. ¿Qué tema de Inteligencia Artificial te gustaría enseñar?";
    setMessages([{ role: "assistant", content: initialMessage }]);
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <Wand2 className="h-8 w-8 text-primary" />
          Orquestador de Lecciones
        </h1>
        <p className="text-muted-foreground">
          Conversa con la IA para diseñar la lección perfecta. El asistente te guiará paso a paso.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Conversación
            </CardTitle>
            <CardDescription>
              El asistente te ayudará a definir todos los parámetros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold">Inicia la conversación</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    El asistente te hará preguntas para entender exactamente qué lección quieres crear
                  </p>
                </div>
                <Button onClick={startConversation} data-testid="button-start-orchestrator">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Comenzar
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg p-3",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                          data-testid={`message-${idx}`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Escribe tu respuesta..."
                    disabled={chatMutation.isPending || isComplete}
                    data-testid="input-orchestrator-message"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={chatMutation.isPending || !input.trim() || isComplete}
                    size="icon"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Parameters Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parámetros Detectados</CardTitle>
            <CardDescription className="text-xs">
              Automáticamente extraídos de la conversación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Título</label>
              <Input
                value={params.title || ""}
                onChange={(e) => setParams({ ...params, title: e.target.value })}
                placeholder="Título de la lección"
                className="text-sm"
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Audiencia</label>
              <div>
                {params.audience ? (
                  <Badge variant="default">{params.audience}</Badge>
                ) : (
                  <Badge variant="outline">No detectado</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Duración</label>
              <div>
                {params.duration ? (
                  <Badge variant="default">{params.duration} min</Badge>
                ) : (
                  <Badge variant="outline">No detectado</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Nivel</label>
              <div>
                {params.level ? (
                  <Badge variant="default">{params.level}</Badge>
                ) : (
                  <Badge variant="outline">No detectado</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <div>
                {params.type ? (
                  <Badge variant="default">{params.type}</Badge>
                ) : (
                  <Badge variant="outline">No detectado</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Objetivos</label>
              <Input
                value={params.objectives?.join(", ") || ""}
                onChange={(e) => setParams({ 
                  ...params, 
                  objectives: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Separados por comas"
                className="text-sm"
                data-testid="input-objectives"
              />
            </div>

            {params.title && params.audience && params.duration && params.level && params.type && (
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="w-full"
                data-testid="button-generate-lesson"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generar Lección
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
