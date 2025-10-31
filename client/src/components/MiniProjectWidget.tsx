import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2 } from "lucide-react";

interface ProjectStep {
  description: string;
  hint?: string;
}

interface MiniProjectWidgetProps {
  title: string;
  description: string;
  steps: ProjectStep[];
  estimatedTime?: string;
}

export function MiniProjectWidget({ 
  title, 
  description, 
  steps,
  estimatedTime 
}: MiniProjectWidgetProps) {
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    new Array(steps.length).fill(false)
  );

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const completedCount = completedSteps.filter(Boolean).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <Card className="my-4" data-testid="widget-mini-project">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {estimatedTime && (
            <Badge variant="outline">{estimatedTime}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
              data-testid={`project-step-${idx}`}
            >
              <Checkbox
                checked={completedSteps[idx]}
                onCheckedChange={() => toggleStep(idx)}
                className="mt-0.5"
                data-testid={`checkbox-step-${idx}`}
              />
              <div className="flex-1 space-y-1">
                <p className={`text-sm ${completedSteps[idx] ? 'line-through text-muted-foreground' : ''}`}>
                  {step.description}
                </p>
                {step.hint && (
                  <p className="text-xs text-muted-foreground italic">
                    💡 {step.hint}
                  </p>
                )}
              </div>
              {completedSteps[idx] && (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        
        {completedCount === steps.length && (
          <div className="p-4 bg-green-500/10 rounded-lg text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              🎉 ¡Proyecto completado! Excelente trabajo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
