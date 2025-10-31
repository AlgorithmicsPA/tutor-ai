import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface Hotspot {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
}

interface HotspotDiagramWidgetProps {
  title: string;
  imageSrc: string;
  hotspots: Hotspot[];
}

export function HotspotDiagramWidget({ title, imageSrc, hotspots }: HotspotDiagramWidgetProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);

  const selectedInfo = hotspots.find(h => h.id === selectedHotspot);

  return (
    <Card className="my-4" data-testid="widget-hotspot-diagram">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative rounded-lg overflow-hidden border">
          <img 
            src={imageSrc} 
            alt={title}
            className="w-full h-auto"
          />
          {hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              className="absolute w-8 h-8 -ml-4 -mt-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs hover-elevate active-elevate-2 transition-all"
              style={{ 
                left: `${hotspot.x}%`, 
                top: `${hotspot.y}%`,
                transform: selectedHotspot === hotspot.id ? 'scale(1.2)' : 'scale(1)'
              }}
              onClick={() => setSelectedHotspot(hotspot.id === selectedHotspot ? null : hotspot.id)}
              data-testid={`hotspot-${hotspot.id}`}
            >
              {hotspot.label}
            </button>
          ))}
        </div>
        
        {selectedInfo && (
          <div className="p-4 bg-primary/10 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default">{selectedInfo.label}</Badge>
              <h4 className="font-semibold text-sm">Punto de interés</h4>
            </div>
            <p className="text-sm">{selectedInfo.description}</p>
          </div>
        )}
        
        {!selectedInfo && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Haz clic en los puntos numerados para ver más información
          </p>
        )}
      </CardContent>
    </Card>
  );
}
