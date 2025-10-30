import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LessonRenderer } from "@/components/LessonRenderer";
import { ChatInterface } from "@/components/ChatInterface";
import { ProviderSelector } from "@/components/ProviderSelector";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lesson, LessonDSL, UserProgress, InsertUserProgress } from "@shared/schema";

// For demo purposes, using a static user ID. In production, this would come from authentication
const DEMO_USER_ID = "demo-user-001";

export default function Home() {
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");
  const [quizScores, setQuizScores] = useState<{ index: number; score: number }[]>([]);
  const [completedItems, setCompletedItems] = useState<number[]>([]);

  // Fetch the demo lesson from the database
  const { data: lessonData, isLoading, error } = useQuery<Lesson>({
    queryKey: ["/api/lessons", "demo-01"],
    queryFn: async () => {
      const res = await fetch("/api/lessons/demo-01");
      if (!res.ok) throw new Error("Failed to fetch lesson");
      return res.json();
    },
  });

  // Fetch user progress
  const { data: progressData } = useQuery<UserProgress>({
    queryKey: ["/api/progress", DEMO_USER_ID, "demo-01"],
    queryFn: async () => {
      const res = await fetch(`/api/progress/${DEMO_USER_ID}/demo-01`);
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
    enabled: !!lessonData, // Only fetch progress after lesson is loaded
  });

  // Sync local state with progress data
  useEffect(() => {
    if (progressData) {
      setQuizScores(progressData.quizScores || []);
      setCompletedItems(progressData.completedItems || []);
    }
  }, [progressData]);

  // Mutation to save progress
  const saveProgressMutation = useMutation({
    mutationFn: async (data: InsertUserProgress) => {
      return apiRequest<UserProgress>("POST", "/api/progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", DEMO_USER_ID, "demo-01"] });
    },
  });

  // Transform database lesson to DSL format
  const lesson: LessonDSL | null = lessonData
    ? {
        meta: {
          id: lessonData.lessonId,
          title: lessonData.title,
          age: lessonData.age,
          lang: lessonData.lang,
        },
        objectives: lessonData.objectives,
        timeline: lessonData.timeline,
        adaptation: lessonData.adaptation || undefined,
      }
    : null;

  // Handle quiz completion - prevents duplicates by index
  const handleQuizComplete = (itemIndex: number, score: number) => {
    // Remove any existing entry for this quiz index and add the new one
    const filteredQuizScores = quizScores.filter(q => q.index !== itemIndex);
    const newQuizScores = [...filteredQuizScores, { index: itemIndex, score }];
    
    // Add to completed items (Set ensures uniqueness)
    const newCompletedItems = [...new Set([...completedItems, itemIndex])];
    
    setQuizScores(newQuizScores);
    setCompletedItems(newCompletedItems);

    // Save progress to database (POST endpoint handles upsert)
    saveProgressMutation.mutate({
      userId: DEMO_USER_ID,
      lessonId: "demo-01",
      quizScores: newQuizScores,
      completedItems: newCompletedItems,
      lastPosition: Math.max(...newCompletedItems, 0),
      completed: newCompletedItems.length === lessonData?.timeline.length,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
                Tutor IA
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Plataforma de aprendizaje interactivo
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ProviderSelector value={provider} onChange={setProvider} />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-3/4" data-testid="skeleton-lesson-title" />
                  <Skeleton className="h-32 w-full" data-testid="skeleton-lesson-content" />
                  <Skeleton className="h-48 w-full" data-testid="skeleton-lesson-content" />
                </div>
              ) : error ? (
                <div 
                  className="p-6 border border-destructive/50 rounded-lg bg-destructive/10"
                  data-testid="error-lesson-load"
                >
                  <h2 className="text-lg font-semibold text-destructive mb-2">
                    Error cargando la lección
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : "Error desconocido"}
                  </p>
                </div>
              ) : lesson ? (
                <>
                  <ProgressIndicator
                    completedItems={completedItems}
                    totalItems={lesson.timeline.length}
                    quizScores={quizScores}
                  />
                  <LessonRenderer 
                    lesson={lesson} 
                    onQuizComplete={handleQuizComplete}
                    userQuizScores={quizScores}
                  />
                </>
              ) : null}
            </motion.div>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:sticky lg:top-24"
            >
              <ChatInterface provider={provider} />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Tutor IA - Aprendizaje personalizado con inteligencia artificial
          </p>
        </div>
      </footer>
    </div>
  );
}
