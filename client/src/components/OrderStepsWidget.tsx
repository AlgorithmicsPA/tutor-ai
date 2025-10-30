import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";

interface OrderStepsWidgetProps {
  data: {
    steps: string[];
    answer: number[];
  };
}

export function OrderStepsWidget({ data }: OrderStepsWidgetProps) {
  const [order, setOrder] = useState<number[]>(
    data.steps.map((_, i) => i)
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function move(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= order.length) return;

    const newOrder = [...order];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setOrder(newOrder);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...order];
    const draggedItem = newOrder[draggedIndex];
    
    // Remove from old position
    newOrder.splice(draggedIndex, 1);
    
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  const isCorrect = JSON.stringify(order) === JSON.stringify(data.answer);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-2xl p-6 border-2 border-card-border shadow-sm space-y-4"
      data-testid="order-steps-widget"
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold">#</span>
        </div>
        <h3 className="text-base md:text-lg font-semibold text-card-foreground flex-1">
          Ordena los pasos correctamente
        </h3>
      </div>

      <ul className="space-y-2">
        {order.map((stepIndex, position) => (
          <motion.li
            key={position}
            layout
            className="flex items-center gap-2"
            data-testid={`order-step-${position}`}
          >
            <div
              draggable
              onDragStart={() => handleDragStart(position)}
              onDragOver={(e) => handleDragOver(e, position)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, position)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-2 flex-1 border-2 rounded-xl px-4 py-3 bg-background cursor-move transition-all
                ${draggedIndex === position ? "opacity-50 scale-95" : "opacity-100 scale-100"}
                ${dragOverIndex === position && draggedIndex !== position ? "border-primary bg-primary/5" : "border-border"}
                ${draggedIndex === null ? "hover-elevate" : ""}
              `}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {position + 1}
              </span>
              <span className="flex-1 text-sm md:text-base">
                {data.steps[stepIndex]}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                size="icon"
                variant="outline"
                onClick={() => move(position, -1)}
                disabled={position === 0}
                className="h-8 w-8"
                data-testid={`button-move-up-${position}`}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => move(position, 1)}
                disabled={position === order.length - 1}
                className="h-8 w-8"
                data-testid={`button-move-down-${position}`}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            </div>
          </motion.li>
        ))}
      </ul>

      <div
        className={`
          rounded-lg p-4 text-center font-medium
          ${isCorrect ? "bg-green-100 dark:bg-green-950 border-2 border-green-500 text-green-700 dark:text-green-300" : "bg-muted text-muted-foreground"}
        `}
        data-testid="order-steps-feedback"
      >
        {isCorrect ? "¡Correcto! Has ordenado los pasos perfectamente." : "Organiza los pasos en el orden correcto usando las flechas."}
      </div>
    </motion.div>
  );
}
