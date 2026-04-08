import { useEffect, useRef, useState, useCallback } from "react";
import type { LessonDSL, TimelineItem, UserProgress } from "@shared/schema";
import { TutorMessage } from "./TutorMessage";
import { LessonImage } from "./LessonImage";
import { QuizWidget } from "./QuizWidget";
import { OrderStepsWidget } from "./OrderStepsWidget";
import { ReflectionPrompt } from "./ReflectionPrompt";
import { AdaptivePathIndicator } from "./AdaptivePathIndicator";
import { TheoryBlockWidget } from "./TheoryBlockWidget";
import { ComparisonWidget } from "./ComparisonWidget";
import { PromptEditorWidget } from "./PromptEditorWidget";
import { ChatSimulatorWidget } from "./ChatSimulatorWidget";
import { MiniProjectWidget } from "./MiniProjectWidget";
import { TimelineInteractiveWidget } from "./TimelineInteractiveWidget";
import { HotspotDiagramWidget } from "./HotspotDiagramWidget";
import { CodeExerciseWidget } from "./CodeExerciseWidget";
import { apiRequest } from "@/lib/queryClient";

interface LessonRendererProps {
  lesson: LessonDSL;
  userId?: string;
  savedProgress?: UserProgress;
  onQuizComplete?: (itemIndex: number, score: number) => void;
  userQuizScores?: { index: number; score: number }[];
}

export function LessonRenderer({
  lesson,
  userId,
  savedProgress,
  onQuizComplete,
  userQuizScores: externalQuizScores,
}: LessonRendererProps) {
  // Track completed items and quiz scores locally
  const [completedItems, setCompletedItems] = useState<number[]>(
    savedProgress?.completedItems ?? []
  );
  const [quizScores, setQuizScores] = useState<{ index: number; score: number }[]>(
    externalQuizScores ?? savedProgress?.quizScores ?? []
  );

  // Ref for the item to scroll to on mount
  const resumeRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Build a flat list of all item indices for progress tracking
  const totalItems = (() => {
    if (lesson.modules && lesson.modules.length > 0) {
      let count = 0;
      for (const mod of lesson.modules) {
        count += mod.timeline.length;
      }
      return count;
    }
    return lesson.timeline?.length ?? 0;
  })();

  // Scroll to last position on mount
  useEffect(() => {
    if (hasScrolled.current) return;
    if (!savedProgress || savedProgress.lastPosition === 0) return;

    // Small delay so DOM has rendered
    const timer = setTimeout(() => {
      if (resumeRef.current) {
        resumeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        hasScrolled.current = true;
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [savedProgress]);

  // Save progress to backend (debounced via the caller)
  const saveProgress = useCallback(
    (newCompleted: number[], newQuizScores: { index: number; score: number }[], lastPos: number) => {
      if (!userId) return;

      const isCompleted = newCompleted.length >= totalItems && totalItems > 0;

      apiRequest("POST", "/api/progress", {
        userId,
        lessonId: lesson.meta.id,
        completedItems: newCompleted,
        quizScores: newQuizScores,
        lastPosition: lastPos,
        completed: isCompleted,
      }).catch((err) => console.error("Error saving progress:", err));
    },
    [userId, lesson.meta.id, totalItems]
  );

  // Mark an item as completed and save
  const markCompleted = useCallback(
    (flatIndex: number) => {
      setCompletedItems((prev) => {
        if (prev.includes(flatIndex)) return prev;
        const next = [...prev, flatIndex];
        // Save with the latest quiz scores
        setQuizScores((currentScores) => {
          saveProgress(next, currentScores, flatIndex);
          return currentScores;
        });
        return next;
      });
    },
    [saveProgress]
  );

  // Handle quiz completion
  const handleQuizComplete = useCallback(
    (flatIndex: number, score: number) => {
      onQuizComplete?.(flatIndex, score);

      setQuizScores((prev) => {
        const existing = prev.filter((q) => q.index !== flatIndex);
        const next = [...existing, { index: flatIndex, score }];

        setCompletedItems((currentCompleted) => {
          const nextCompleted = currentCompleted.includes(flatIndex)
            ? currentCompleted
            : [...currentCompleted, flatIndex];
          saveProgress(nextCompleted, next, flatIndex);
          return nextCompleted;
        });

        return next;
      });
    },
    [onQuizComplete, saveProgress]
  );

  // Calculate average quiz score (0-1 scale)
  const averageScore = (() => {
    const scores = quizScores.length > 0 ? quizScores : [];
    if (scores.length === 0) return 0;
    return scores.reduce((sum, q) => sum + q.score, 0) / scores.length;
  })();

  // Check if an item should be shown based on its condition
  const shouldShowItem = (item: TimelineItem): boolean => {
    if (!("condition" in item) || !item.condition) return true;
    const { requireMinScore, requireMaxScore } = item.condition;
    if (requireMinScore !== undefined && averageScore < requireMinScore) return false;
    if (requireMaxScore !== undefined && averageScore > requireMaxScore) return false;
    return true;
  };

  // Determine the flat index to resume from
  const resumePosition = savedProgress?.lastPosition ?? 0;

  // Render a timeline item
  const renderTimelineItem = (
    item: TimelineItem,
    index: number,
    flatIndex: number,
    keyPrefix: string = ""
  ): React.ReactNode => {
    if (!shouldShowItem(item)) return null;

    const key = `${keyPrefix}${index}`;
    const isResumePoint = flatIndex === resumePosition && resumePosition > 0;
    const isCompleted = completedItems.includes(flatIndex);

    // Observer to mark item as seen/completed when it enters viewport
    const ItemWrapper = ({ children }: { children: React.ReactNode }) => {
      const ref = useRef<HTMLDivElement>(null);

      useEffect(() => {
        const el = ref.current;
        if (!el || !userId) return;

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              // Non-interactive items get auto-completed when visible
              const nonInteractive = ["tutor_say", "show_image", "theory_block", "comparison", "timeline_interactive", "hotspot_diagram", "adaptive_path"];
              if (nonInteractive.includes(item.type)) {
                markCompleted(flatIndex);
              }
              observer.disconnect();
            }
          },
          { threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
      }, []);

      return (
        <div ref={isResumePoint ? resumeRef : ref} className="relative">
          {isResumePoint && (
            <div className="flex items-center gap-2 mb-3 text-sm text-primary font-medium">
              <div className="h-px flex-1 bg-primary/30" />
              <span>Continuar desde aquí</span>
              <div className="h-px flex-1 bg-primary/30" />
            </div>
          )}
          {children}
        </div>
      );
    };

    const rendered = (() => {
      switch (item.type) {
        case "tutor_say":
          return (
            <TutorMessage
              key={key}
              messageId={`${lesson.meta.id}-msg-${index}`}
              text={item.text}
              role={item.role}
              enableVoice={item.voice ?? true}
              autoplay={item.voice === true}
            />
          );
        case "show_image":
          return <LessonImage key={key} src={item.src} alt={item.alt} />;
        case "quiz":
          return (
            <QuizWidget
              key={key}
              question={item.question}
              choices={item.choices}
              answer={item.answer}
              lessonId={lesson.meta.id}
              onComplete={(score) => handleQuizComplete(flatIndex, score)}
            />
          );
        case "interactive":
          if (item.widget === "order-steps") {
            return <OrderStepsWidget key={key} data={item.data} />;
          }
          return null;
        case "reflection":
          return <ReflectionPrompt key={key} prompt={item.prompt} />;
        case "adaptive_path":
          return <AdaptivePathIndicator key={key} message={item.message} icon={item.icon} />;
        case "theory_block":
          return (
            <TheoryBlockWidget
              key={key}
              title={item.title}
              content={item.content}
              keyPoints={item.keyPoints}
              imageSrc={item.imageSrc}
              imageAlt={item.title}
            />
          );
        case "prompt_editor":
          return (
            <PromptEditorWidget
              key={key}
              instruction={`${item.description}\n\n${item.challenge}`}
              placeholder={item.starterPrompt}
              samplePrompts={item.hints}
              validationCriteria={item.expectedConcepts}
            />
          );
        case "chat_simulator":
          return (
            <ChatSimulatorWidget
              key={key}
              scenario={item.scenario}
              systemPrompt={item.systemPrompt}
              starterMessages={item.starterMessages}
            />
          );
        case "code_exercise":
          return (
            <CodeExerciseWidget
              key={key}
              instruction={item.description}
              language={item.language}
              starterCode={item.starterCode}
              hints={item.hints}
              expectedOutput={item.solution}
            />
          );
        case "comparison":
          return (
            <ComparisonWidget
              key={key}
              title={item.title}
              leftItem={{
                label: item.leftSide.title,
                features: item.leftSide.content.split("\n").filter(Boolean),
              }}
              rightItem={{
                label: item.rightSide.title,
                features: item.rightSide.content.split("\n").filter(Boolean),
              }}
            />
          );
        case "timeline_interactive":
          return (
            <TimelineInteractiveWidget
              key={key}
              title={item.title}
              events={item.events.map((e) => ({
                year: e.date,
                title: e.title,
                description: e.description,
              }))}
            />
          );
        case "hotspot_diagram":
          return (
            <HotspotDiagramWidget
              key={key}
              title={item.title}
              imageSrc={item.imageSrc || ""}
              hotspots={item.hotspots.map((h) => ({
                id: h.id,
                label: h.title,
                description: h.content,
                x: h.x,
                y: h.y,
              }))}
            />
          );
        case "mini_project":
          return (
            <MiniProjectWidget
              key={key}
              title={item.title}
              description={item.description}
              steps={item.steps.map((s) => ({
                description: s.title,
                hint: s.description,
              }))}
              estimatedTime={item.estimatedTime ? `${item.estimatedTime} min` : undefined}
            />
          );
        default:
          return null;
      }
    })();

    if (!rendered) return null;

    return (
      <ItemWrapper key={`wrapper-${key}`}>
        {rendered}
      </ItemWrapper>
    );
  };

  // Track flat index across modules
  let flatIndex = 0;

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
          {lesson.meta.duration && (
            <span className="px-3 py-1 rounded-full bg-muted">
              Duración: {lesson.meta.duration} min
            </span>
          )}
          {lesson.meta.level && (
            <span className="px-3 py-1 rounded-full bg-muted">
              Nivel: {lesson.meta.level}
            </span>
          )}
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

        {/* Progress bar */}
        {userId && totalItems > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(completedItems.length / totalItems) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedItems.length}/{totalItems}
            </span>
          </div>
        )}
      </div>

      {/* Render Modules or Timeline */}
      {lesson.modules && lesson.modules.length > 0 ? (
        <div className="space-y-8">
          {lesson.modules.map((module, moduleIndex) => {
            const moduleItems = module.timeline.map((item, itemIndex) => {
              const currentFlat = flatIndex;
              flatIndex++;
              return renderTimelineItem(item, itemIndex, currentFlat, `module-${moduleIndex}-`);
            });

            return (
              <div key={module.id} className="space-y-4">
                <div className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-display text-foreground">
                      Módulo {moduleIndex + 1}: {module.title}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {module.estimatedMinutes} min
                    </span>
                  </div>
                  {module.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {module.description}
                    </p>
                  )}
                </div>
                <div className="space-y-6 pl-6">{moduleItems}</div>
              </div>
            );
          })}
        </div>
      ) : lesson.timeline && lesson.timeline.length > 0 ? (
        <div className="space-y-6">
          {lesson.timeline.map((item, index) => {
            const currentFlat = flatIndex;
            flatIndex++;
            return renderTimelineItem(item, index, currentFlat);
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          No hay contenido disponible para esta lección.
        </div>
      )}
    </div>
  );
}
