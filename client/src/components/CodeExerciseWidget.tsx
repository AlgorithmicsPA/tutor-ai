import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Play, CheckCircle2, XCircle } from "lucide-react";

interface CodeExerciseWidgetProps {
  instruction: string;
  language: string;
  starterCode?: string;
  hints?: string[];
  expectedOutput?: string;
}

export function CodeExerciseWidget({ 
  instruction, 
  language,
  starterCode = "",
  hints = [],
  expectedOutput
}: CodeExerciseWidgetProps) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleRun = () => {
    setOutput("// Simulación de ejecución\n// En producción, esto ejecutaría el código de forma segura");
    
    if (expectedOutput) {
      const normalizedCode = code.trim().toLowerCase();
      const normalizedExpected = expectedOutput.trim().toLowerCase();
      setIsCorrect(normalizedCode.includes(normalizedExpected));
    }
  };

  return (
    <Card className="my-4" data-testid="widget-code-exercise">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Ejercicio de Código
          </CardTitle>
          <Badge variant="outline">{language}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{instruction}</p>
        
        {hints.length > 0 && (
          <details className="p-3 bg-muted rounded-lg">
            <summary className="text-sm font-medium cursor-pointer">
              💡 Ver pistas ({hints.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {hints.map((hint, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  • {hint}
                </li>
              ))}
            </ul>
          </details>
        )}
        
        <div className="space-y-2">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Escribe tu código en ${language} aquí...`}
            rows={8}
            className="font-mono text-sm"
            data-testid="input-code"
          />
          
          <Button 
            onClick={handleRun}
            data-testid="button-run-code"
          >
            <Play className="h-4 w-4 mr-2" />
            Ejecutar
          </Button>
        </div>
        
        {output && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Salida:</h4>
            <div className="p-3 bg-black text-green-400 rounded-lg font-mono text-sm">
              <pre className="whitespace-pre-wrap">{output}</pre>
            </div>
          </div>
        )}
        
        {isCorrect !== null && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}>
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ¡Correcto! Tu código funciona como se esperaba.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Casi ahí. Revisa las pistas e intenta nuevamente.
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
