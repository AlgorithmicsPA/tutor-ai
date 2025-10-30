import { Card } from "@/components/ui/card";
import { Star, Lightbulb, Rocket } from "lucide-react";

interface AdaptivePathIndicatorProps {
  message: string;
  icon?: "star" | "lightbulb" | "rocket";
}

export function AdaptivePathIndicator({ message, icon = "lightbulb" }: AdaptivePathIndicatorProps) {
  const Icon = icon === "star" ? Star : icon === "rocket" ? Rocket : Lightbulb;
  
  return (
    <Card className="p-6 border-2 border-primary/30 bg-primary/5" data-testid="adaptive-path-indicator">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" data-testid="adaptive-path-icon" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary mb-1">
            ¡Tu ruta de aprendizaje se ha adaptado!
          </h3>
          <p className="text-sm text-foreground">
            {message}
          </p>
        </div>
      </div>
    </Card>
  );
}
