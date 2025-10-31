import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface TheoryBlockWidgetProps {
  title: string;
  content: string;
  keyPoints?: string[];
  imageSrc?: string;
  imageAlt?: string;
}

export function TheoryBlockWidget({ 
  title, 
  content, 
  keyPoints = [], 
  imageSrc, 
  imageAlt 
}: TheoryBlockWidgetProps) {
  return (
    <Card className="my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{content}</p>
        
        {imageSrc && (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={imageSrc} 
              alt={imageAlt || title}
              className="w-full h-auto"
            />
          </div>
        )}
        
        {keyPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Puntos Clave:</h4>
            <ul className="space-y-1.5">
              {keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
