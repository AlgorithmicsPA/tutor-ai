import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GradeRequest, GradeResponse } from "@shared/schema";

interface QuizWidgetProps {
  question: string;
  choices: string[];
  answer: number;
  lessonId?: string;
}

export function QuizWidget({ question, choices, answer, lessonId = "demo-01" }: QuizWidgetProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (picked === null) return;
    
    setIsSubmitting(true);
    try {
      const data = await apiRequest<GradeResponse, GradeRequest>(
        "POST",
        "/api/grade",
        {
          lessonId,
          itemType: "quiz",
          answerIndex: answer,
          userIndex: picked,
        }
      );
      setResult(data.score === 1);
    } catch (error) {
      console.error("Failed to grade quiz:", error);
      setResult(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCorrect = result === true;
  const isIncorrect = result === false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-2xl p-6 border-2 border-card-border shadow-sm space-y-4"
      data-testid="quiz-widget"
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold">?</span>
        </div>
        <h3 className="text-base md:text-lg font-semibold text-card-foreground flex-1">
          {question}
        </h3>
      </div>

      <div className="space-y-2">
        {choices.map((choice, index) => {
          const isSelected = picked === index;
          const showCorrect = result !== null && index === answer;
          const showIncorrect = result !== null && isSelected && index !== answer;

          return (
            <motion.label
              key={index}
              whileHover={{ scale: result === null ? 1.01 : 1 }}
              whileTap={{ scale: result === null ? 0.99 : 1 }}
              className={`
                flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${isSelected && result === null ? "border-primary bg-primary/5 shadow-sm" : "border-border"}
                ${showCorrect ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}
                ${showIncorrect ? "border-red-500 bg-red-50 dark:bg-red-950" : ""}
                ${result === null ? "hover-elevate" : ""}
              `}
              data-testid={`quiz-choice-${index}`}
            >
              <input
                type="radio"
                name="quiz-answer"
                value={index}
                checked={isSelected}
                onChange={() => result === null && setPicked(index)}
                disabled={result !== null}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary flex-shrink-0"
              />
              <span className="text-base flex-1">{choice}</span>
              {showCorrect && <Check className="w-5 h-5 text-green-600 flex-shrink-0" />}
              {showIncorrect && <X className="w-5 h-5 text-red-600 flex-shrink-0" />}
            </motion.label>
          );
        })}
      </div>

      {result === null && (
        <Button
          onClick={handleSubmit}
          disabled={picked === null || isSubmitting}
          className="w-full py-3 font-semibold"
          data-testid="button-submit-quiz"
        >
          {isSubmitting ? "Comprobando..." : "Comprobar Respuesta"}
        </Button>
      )}

      <AnimatePresence>
        {result !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`
              rounded-lg p-4 flex items-center gap-3
              ${isCorrect ? "bg-green-100 dark:bg-green-950 border-2 border-green-500" : ""}
              ${isIncorrect ? "bg-red-100 dark:bg-red-950 border-2 border-red-500" : ""}
            `}
            data-testid="quiz-feedback"
          >
            {isCorrect ? (
              <>
                <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                <p className="font-medium text-green-700 dark:text-green-300">
                  ¡Muy bien! ¡Respuesta correcta!
                </p>
              </>
            ) : (
              <>
                <X className="w-6 h-6 text-red-600 flex-shrink-0" />
                <p className="font-medium text-red-700 dark:text-red-300">
                  Sigue intentando. La respuesta correcta es: {choices[answer]}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
