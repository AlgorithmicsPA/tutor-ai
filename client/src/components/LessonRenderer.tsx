import type { LessonDSL } from "@shared/schema";
import { TutorMessage } from "./TutorMessage";
import { LessonImage } from "./LessonImage";
import { QuizWidget } from "./QuizWidget";
import { OrderStepsWidget } from "./OrderStepsWidget";
import { ReflectionPrompt } from "./ReflectionPrompt";

interface LessonRendererProps {
  lesson: LessonDSL;
}

export function LessonRenderer({ lesson }: LessonRendererProps) {
  return (
    <div className="space-y-6" data-testid="lesson-renderer">
      {/* Lesson Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">
          {lesson.meta.title}
        </h1>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="px-3 py-1 rounded-full bg-muted">
            Edades: {lesson.meta.age}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted">
            Idioma: {lesson.meta.lang.toUpperCase()}
          </span>
        </div>
        {lesson.objectives.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-card-border">
            <h2 className="text-sm font-semibold text-card-foreground mb-2">
              Objetivos de aprendizaje:
            </h2>
            <ul className="space-y-1 text-sm text-card-foreground">
              {lesson.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary flex-shrink-0">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timeline Items */}
      <div className="space-y-6">
        {lesson.timeline.map((item, index) => {
          switch (item.type) {
            case "tutor_say":
              return (
                <TutorMessage
                  key={index}
                  text={item.text}
                  role={item.role}
                />
              );
            case "show_image":
              return (
                <LessonImage
                  key={index}
                  src={item.src}
                  alt={item.alt}
                />
              );
            case "quiz":
              return (
                <QuizWidget
                  key={index}
                  question={item.question}
                  choices={item.choices}
                  answer={item.answer}
                  lessonId={lesson.meta.id}
                />
              );
            case "interactive":
              if (item.widget === "order-steps") {
                return (
                  <OrderStepsWidget
                    key={index}
                    data={item.data}
                  />
                );
              }
              return null;
            case "reflection":
              return (
                <ReflectionPrompt
                  key={index}
                  prompt={item.prompt}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
