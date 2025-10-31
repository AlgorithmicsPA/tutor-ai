import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lesson, LessonDSL } from "@shared/schema";
import { LessonRenderer } from "@/components/LessonRenderer";
import { useMemo } from "react";

export default function LessonViewPage() {
  const [, params] = useRoute("/lessons/:lessonId");
  const lessonId = params?.lessonId;

  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
  });

  // Convert lesson to DSL format for renderer
  const lessonDSL = useMemo<LessonDSL | null>(() => {
    if (!lesson) return null;
    
    return {
      meta: {
        id: lesson.lessonId,
        title: lesson.title,
        age: lesson.age,
        lang: lesson.lang,
      },
      objectives: lesson.objectives,
      timeline: lesson.timeline,
      modules: lesson.modules, // Include modules for orchestrator-generated lessons
    };
  }, [lesson]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando lección...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Lección no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            Esta lección no existe o no ha sido publicada aún.
          </p>
          <Link href="/">
            <Button data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Edad: {lesson.age} • Idioma: {lesson.lang}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {lessonDSL && <LessonRenderer lesson={lessonDSL} />}
        </div>
      </main>
    </div>
  );
}
