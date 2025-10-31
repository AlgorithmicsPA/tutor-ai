import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";

interface ComparisonItem {
  label: string;
  features: string[];
}

interface ComparisonWidgetProps {
  title: string;
  leftItem: ComparisonItem;
  rightItem: ComparisonItem;
}

export function ComparisonWidget({ title, leftItem, rightItem }: ComparisonWidgetProps) {
  return (
    <Card className="my-4" data-testid="widget-comparison">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-primary">{leftItem.label}</h4>
            <ul className="space-y-2">
              {leftItem.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-primary">{rightItem.label}</h4>
            <ul className="space-y-2">
              {rightItem.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
