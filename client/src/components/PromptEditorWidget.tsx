import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PromptEditorWidgetProps {
  instruction: string;
  placeholder?: string;
  samplePrompts?: string[];
  validationCriteria?: string[];
}

export function PromptEditorWidget({ 
  instruction, 
  placeholder = "Escribe tu prompt aquí...",
  samplePrompts = [],
  validationCriteria = []
}: PromptEditorWidgetProps) {
  const [prompt, setPrompt] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const { toast } = useToast();

  const evaluateMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      const response = await apiRequest<{ reply: string }>("POST", "/api/tutor", {
        messages: [
          {
            role: "user",
            content: `Evalúa este prompt y da retroalimentación constructiva: "${userPrompt}". Criterios: ${validationCriteria.join(", ") || "claridad, especificidad, efectividad"}`
          }
        ],
        provider: "openai"
      });
      return response.reply;
    },
    onSuccess: (data) => {
      setFeedback(data);
      toast({
        title: "Evaluación completada",
        description: "Revisa la retroalimentación",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo evaluar el prompt",
        variant: "destructive",
      });
    }
  });

  const handleEvaluate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vacío",
        description: "Escribe un prompt primero",
        variant: "destructive",
      });
      return;
    }
    evaluateMutation.mutate(prompt);
  };

  return (
    <Card className="my-4" data-testid="widget-prompt-editor">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Editor de Prompts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{instruction}</p>
        
        {samplePrompts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ejemplos:</h4>
            <div className="space-y-1">
              {samplePrompts.map((sample, idx) => (
                <div 
                  key={idx}
                  className="p-2 bg-muted rounded text-xs cursor-pointer hover-elevate"
                  onClick={() => setPrompt(sample)}
                  data-testid={`sample-prompt-${idx}`}
                >
                  {sample}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          rows={4}
          data-testid="input-prompt"
        />
        
        <Button 
          onClick={handleEvaluate}
          disabled={evaluateMutation.isPending}
          data-testid="button-evaluate-prompt"
        >
          {evaluateMutation.isPending ? (
            "Evaluando..."
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Evaluar Prompt
            </>
          )}
        </Button>
        
        {feedback && (
          <div className="p-4 bg-primary/10 rounded-lg space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Retroalimentación:
            </h4>
            <p className="text-sm">{feedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
