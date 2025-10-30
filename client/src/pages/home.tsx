import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Clock, Globe, Play, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lesson } from "@shared/schema";
import { motion } from "framer-motion";

export default function Home() {
  const { data: lessonsData, isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  // Filter for published lessons only (double-check even though backend filters)
  const lessons = lessonsData?.filter(lesson => lesson.published);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">
                Tutor IA
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Aprende sobre Inteligencia Artificial de forma divertida
              </p>
            </motion.div>
            <Link href="/admin">
              <Button variant="outline" size="sm" data-testid="button-admin">
                <Settings className="w-4 h-4 mr-2" />
                Administración
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Page Title */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Lecciones Disponibles
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Selecciona una lección para comenzar tu viaje de aprendizaje sobre Inteligencia Artificial
            </p>
          </div>

          {/* Lessons Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-5/6 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : lessons && lessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className="hover-elevate transition-all duration-300 h-full flex flex-col"
                    data-testid={`card-lesson-${lesson.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <BookOpen className="w-8 h-8 text-primary flex-shrink-0" />
                        <Badge variant="secondary" data-testid={`badge-age-${lesson.id}`}>
                          {lesson.age}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl line-clamp-2">
                        {lesson.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {lesson.objectives.slice(0, 2).join(" • ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {lesson.lang}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.timeline.length} actividades
                        </Badge>
                      </div>
                      <Link href={`/lessons/${lesson.lessonId}`} className="w-full">
                        <Button
                          size="lg"
                          className="w-full"
                          data-testid={`button-start-${lesson.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Comenzar Lección
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="max-w-md mx-auto text-center">
              <CardContent className="pt-12 pb-12">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay lecciones disponibles</h3>
                <p className="text-muted-foreground mb-6">
                  Actualmente no hay lecciones publicadas. Por favor, contacta a tu educador.
                </p>
                <Link href="/admin">
                  <Button variant="outline" data-testid="button-admin-empty">
                    <Settings className="w-4 h-4 mr-2" />
                    Ir a Administración
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/80 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Tutor IA - Aprendizaje personalizado con Inteligencia Artificial
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Diseñado para niños de 7-9 años
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
