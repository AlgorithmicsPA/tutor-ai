import { CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  completedItems: number[];
  totalItems: number;
  quizScores: { index: number; score: number }[];
  className?: string;
}

export function ProgressIndicator({
  completedItems,
  totalItems,
  quizScores,
  className,
}: ProgressIndicatorProps) {
  const completionPercentage = (completedItems.length / totalItems) * 100;
  const totalQuizzes = quizScores.length;
  const correctQuizzes = quizScores.filter((q) => q.score === 1).length;

  return (
    <Card className={`p-4 ${className}`} data-testid="card-progress">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Progreso de la Lección
      </h3>

      <div className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Completado</span>
            <span className="text-xs font-medium text-foreground">
              {Math.round(completionPercentage)}%
            </span>
          </div>
          <Progress value={completionPercentage} data-testid="progress-bar-completion" />
        </div>

        {/* Quiz Performance */}
        {totalQuizzes > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Preguntas Correctas</span>
              <span className="text-xs font-medium text-foreground">
                {correctQuizzes} / {totalQuizzes}
              </span>
            </div>
            <div className="flex gap-1">
              {quizScores.map((quiz, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  data-testid={`quiz-result-${idx}`}
                >
                  {quiz.score === 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Item Completion */}
        <div>
          <span className="text-xs text-muted-foreground">
            {completedItems.length} de {totalItems} actividades completadas
          </span>
        </div>
      </div>
    </Card>
  );
}
