import { useState } from "react";
import { Plus, GripVertical, Trash2, MessageCircle, Image, HelpCircle, Puzzle, Lightbulb, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TimelineItem } from "@shared/schema";

interface TimelineBuilderProps {
  items: TimelineItem[];
  onChange: (items: TimelineItem[]) => void;
}

const itemTypeIcons = {
  tutor_say: MessageCircle,
  show_image: Image,
  quiz: HelpCircle,
  interactive: Puzzle,
  reflection: Lightbulb,
  adaptive_path: Star,
};

const itemTypeLabels = {
  tutor_say: "Mensaje del Tutor",
  show_image: "Mostrar Imagen",
  quiz: "Quiz",
  interactive: "Interactivo",
  reflection: "Reflexión",
  adaptive_path: "Camino Adaptativo",
};

export function TimelineBuilder({ items, onChange }: TimelineBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addItem = (type: TimelineItem["type"]) => {
    let newItem: TimelineItem;

    switch (type) {
      case "tutor_say":
        newItem = {
          type: "tutor_say",
          text: "Mensaje del tutor...",
          voice: true,
          role: "guide",
        };
        break;
      case "show_image":
        newItem = {
          type: "show_image",
          src: "",
          alt: "",
        };
        break;
      case "quiz":
        newItem = {
          type: "quiz",
          question: "Pregunta...",
          choices: ["Opción 1", "Opción 2", "Opción 3"],
          answer: 0,
        };
        break;
      case "interactive":
        newItem = {
          type: "interactive",
          widget: "order-steps",
          data: {},
        };
        break;
      case "reflection":
        newItem = {
          type: "reflection",
          prompt: "Reflexiona sobre...",
        };
        break;
      case "adaptive_path":
        newItem = {
          type: "adaptive_path",
          message: "¡Excelente trabajo!",
          icon: "star",
        };
        break;
    }

    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    onChange(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getItemSummary = (item: TimelineItem): string => {
    switch (item.type) {
      case "tutor_say":
        return item.text.slice(0, 50) + (item.text.length > 50 ? "..." : "");
      case "show_image":
        return item.src || "Sin imagen configurada";
      case "quiz":
        return item.question;
      case "interactive":
        return `Widget: ${item.widget}`;
      case "reflection":
        return item.prompt;
      case "adaptive_path":
        return item.message;
      default:
        return "Item";
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Item Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Timeline de la Lección</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-testid="button-add-item">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Item
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(itemTypeLabels).map(([type, label]) => {
              const Icon = itemTypeIcons[type as keyof typeof itemTypeIcons];
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => addItem(type as TimelineItem["type"])}
                  data-testid={`menuitem-add-${type}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Timeline Items */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Puzzle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Timeline vacío</h3>
            <p className="text-muted-foreground mb-4">
              Agrega items para construir tu lección
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="timeline-items-container">
          {items.map((item, index) => {
            const Icon = itemTypeIcons[item.type];
            const label = itemTypeLabels[item.type];

            return (
              <Card
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`cursor-move transition-all ${
                  draggedIndex === index ? "opacity-50" : "hover-elevate"
                }`}
                data-testid={`timeline-item-${index}`}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="cursor-grab active:cursor-grabbing"
                      data-testid={`drag-handle-${index}`}
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {getItemSummary(item)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      data-testid={`button-remove-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
