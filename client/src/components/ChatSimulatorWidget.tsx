import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSimulatorWidgetProps {
  scenario: string;
  systemPrompt?: string;
  starterMessages?: Message[];
}

export function ChatSimulatorWidget({ 
  scenario, 
  systemPrompt,
  starterMessages = []
}: ChatSimulatorWidgetProps) {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");

  const sendMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest<{ reply: string }>("POST", "/api/tutor", {
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage }
        ],
        system: systemPrompt || `Simula este escenario: ${scenario}`,
        provider: "openai"
      });
      return response.reply;
    },
    onSuccess: (reply) => {
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    },
    // Desde que /api/tutor devuelve 503 cuando ningún LLM contesta (en vez de 200 con texto
    // enlatado), este widget se quedaba mudo: react-query se comía el error y el alumno veía
    // su mensaje sin respuesta. Mejor decirle que falló que dejarlo esperando.
    onError: () => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "No pude responder en este momento. Probá de nuevo en un rato.",
      }]);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    sendMutation.mutate(input);
  };

  return (
    <Card className="my-4" data-testid="widget-chat-simulator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Simulador de Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{scenario}</p>
        
        <div className="space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto p-4 bg-muted/50 rounded-lg">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Inicia la conversación escribiendo un mensaje
            </p>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-lg max-w-[80%]",
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground ml-auto" 
                  : "bg-card"
              )}
              data-testid={`message-${idx}`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
          {sendMutation.isPending && (
            <div className="p-3 rounded-lg max-w-[80%] bg-card">
              <p className="text-sm text-muted-foreground">Escribiendo...</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe tu mensaje..."
            disabled={sendMutation.isPending}
            data-testid="input-chat-message"
          />
          <Button 
            onClick={handleSend}
            disabled={sendMutation.isPending || !input.trim()}
            size="icon"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
