import type { LessonDSL, TimelineItem } from "@shared/schema";
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

interface LessonRendererProps {
  lesson: LessonDSL;
  onQuizComplete?: (itemIndex: number, score: number) => void;
  userQuizScores?: { index: number; score: number }[];
}

export function LessonRenderer({ lesson, onQuizComplete, userQuizScores = [] }: LessonRendererProps) {
  // Calculate average quiz score (0-1 scale)
  const calculateAverageScore = (): number => {
    if (userQuizScores.length === 0) return 0;
    const totalScore = userQuizScores.reduce((sum, q) => sum + q.score, 0);
    return totalScore / userQuizScores.length;
  };

  const averageScore = calculateAverageScore();

  // Check if an item should be shown based on its condition
  const shouldShowItem = (item: TimelineItem): boolean => {
    if (!("condition" in item) || !item.condition) return true;
    
    const { requireMinScore, requireMaxScore } = item.condition;
    
    if (requireMinScore !== undefined && averageScore < requireMinScore) {
      return false;
    }
    
    if (requireMaxScore !== undefined && averageScore > requireMaxScore) {
      return false;
    }
    
    return true;
  };

  // Render a timeline item (used for both flat timeline and module timeline)
  const renderTimelineItem = (item: TimelineItem, index: number, keyPrefix: string = ""): React.ReactNode => {
    // Check if item should be shown based on conditions
    if (!shouldShowItem(item)) {
      return null;
    }

    const key = `${keyPrefix}${index}`;

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
        return (
          <LessonImage
            key={key}
            src={item.src}
            alt={item.alt}
          />
        );
      case "quiz":
        return (
          <QuizWidget
            key={key}
            question={item.question}
            choices={item.choices}
            answer={item.answer}
            lessonId={lesson.meta.id}
            onComplete={(score) => onQuizComplete?.(index, score)}
          />
        );
      case "interactive":
        if (item.widget === "order-steps") {
          return (
            <OrderStepsWidget
              key={key}
              data={item.data}
            />
          );
        }
        return null;
      case "reflection":
        return (
          <ReflectionPrompt
            key={key}
            prompt={item.prompt}
          />
        );
      case "adaptive_path":
        return (
          <AdaptivePathIndicator
            key={key}
            message={item.message}
            icon={item.icon}
          />
        );
      case "theory_block":
        return (
          <TheoryBlockWidget
            key={key}
            title={item.title}
            content={item.content}
            keyPoints={item.keyPoints}
            imageSrc={item.imageSrc}
            imageAlt={item.imageAlt}
          />
        );
      case "prompt_editor":
        return (
          <PromptEditorWidget
            key={key}
            instruction={item.instruction}
            placeholder={item.placeholder}
            samplePrompts={item.samplePrompts}
            validationCriteria={item.validationCriteria}
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
            instruction={item.instruction}
            language={item.language}
            starterCode={item.starterCode}
            hints={item.hints}
            expectedOutput={item.expectedOutput}
          />
        );
      case "comparison":
        return (
          <ComparisonWidget
            key={key}
            title={item.title}
            leftItem={item.leftItem}
            rightItem={item.rightItem}
          />
        );
      case "timeline_interactive":
        return (
          <TimelineInteractiveWidget
            key={key}
            title={item.title}
            events={item.events}
          />
        );
      case "hotspot_diagram":
        return (
          <HotspotDiagramWidget
            key={key}
            title={item.title}
            imageSrc={item.imageSrc}
            hotspots={item.hotspots}
          />
        );
      case "mini_project":
        return (
          <MiniProjectWidget
            key={key}
            title={item.title}
            description={item.description}
            steps={item.steps}
            estimatedTime={item.estimatedTime}
          />
        );
      default:
        return null;
    }
  };

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
      </div>

      {/* Render Modules or Timeline */}
      {lesson.modules && lesson.modules.length > 0 ? (
        /* Module-based lesson (NEW) */
        <div className="space-y-8">
          {lesson.modules.map((module, moduleIndex) => (
            <div key={module.id} className="space-y-4">
              {/* Module Header */}
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
              {/* Module Timeline */}
              <div className="space-y-6 pl-6">
                {module.timeline.map((item, itemIndex) => 
                  renderTimelineItem(item, itemIndex, `module-${moduleIndex}-`)
                )}
              </div>
            </div>
          ))}
        </div>
      ) : lesson.timeline && lesson.timeline.length > 0 ? (
        /* Flat timeline (LEGACY) */
        <div className="space-y-6">
          {lesson.timeline.map((item, index) => renderTimelineItem(item, index))}
        </div>
      ) : (
        /* No content */
        <div className="text-center text-muted-foreground py-12">
          No hay contenido disponible para esta lección.
        </div>
      )}
    </div>
  );
}
