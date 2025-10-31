import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

interface TimelineInteractiveWidgetProps {
  title: string;
  events: TimelineEvent[];
}

export function TimelineInteractiveWidget({ title, events }: TimelineInteractiveWidgetProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <Card className="my-4" data-testid="widget-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {events.map((event, idx) => (
            <div 
              key={idx}
              className={cn(
                "flex gap-4 p-3 rounded-lg border cursor-pointer transition-all hover-elevate",
                selectedIndex === idx && "bg-primary/10 border-primary"
              )}
              onClick={() => setSelectedIndex(idx === selectedIndex ? null : idx)}
              data-testid={`timeline-event-${idx}`}
            >
              <div className="flex-shrink-0">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center font-bold text-sm",
                  selectedIndex === idx ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {event.year}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{event.title}</h4>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    selectedIndex === idx && "rotate-90"
                  )} />
                </div>
                
                {selectedIndex === idx && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
