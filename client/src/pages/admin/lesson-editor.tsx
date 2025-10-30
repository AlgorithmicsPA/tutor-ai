import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Lesson, TimelineItem, InsertLesson } from "@shared/schema";
import { useState, useEffect } from "react";
import { TimelineBuilder } from "@/components/TimelineBuilder";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LessonEditorPage() {
  const [, params] = useRoute("/admin/lessons/:lessonId");
  const [, setLocation] = useLocation();
  const lessonId = params?.lessonId;
  const { toast } = useToast();

  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId && lessonId !== "new",
  });

  const [title, setTitle] = useState("");
  const [age, setAge] = useState("");
  const [lang, setLang] = useState("es");
  const [objectives, setObjectives] = useState("");
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // Update form when lesson data loads
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setAge(lesson.age);
      setLang(lesson.lang);
      setObjectives(lesson.objectives.join("\n"));
      setTimeline(lesson.timeline);
    }
  }, [lesson]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const objectivesArray = objectives.split("\n").filter(line => line.trim().length > 0);
      
      const lessonData: InsertLesson = {
        lessonId: lesson?.lessonId || `lesson-${Date.now()}`,
        title,
        age,
        lang,
        objectives: objectivesArray,
        timeline,
        published: lesson?.published ?? false, // Preserve existing published state
      };

      if (lessonId === "new" || !lesson) {
        // Create new lesson
        return apiRequest<Lesson>("POST", "/api/lessons", lessonData);
      } else {
        // Update existing lesson
        return apiRequest<Lesson>("PUT", `/api/lessons/${lesson.id}`, lessonData);
      }
    },
    onSuccess: (data) => {
      // Invalidate lessons list
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      
      // Invalidate the specific lesson - use the returned lessonId for new lessons
      if (lessonId === "new") {
        queryClient.invalidateQueries({ queryKey: ["/api/lessons", data.lessonId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId] });
      }
      
      toast({
        title: "Lección guardada",
        description: "Los cambios se han guardado correctamente",
      });

      // Navigate to edit page if creating new lesson
      if (lessonId === "new") {
        setLocation(`/admin/lessons/${data.lessonId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar la lección",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Basic validation
    if (!title.trim()) {
      toast({
        title: "Error de validación",
        description: "El título es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!age.trim()) {
      toast({
        title: "Error de validación",
        description: "La edad objetivo es obligatoria",
        variant: "destructive",
      });
      return;
    }

    if (timeline.length === 0) {
      toast({
        title: "Error de validación",
        description: "La lección debe tener al menos un item en el timeline",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/lessons">
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {lessonId === "new" ? "Nueva Lección" : "Editar Lección"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {lessonId === "new" ? "Crea una nueva lección educativa" : `Editando: ${lesson?.title || lessonId}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" data-testid="button-preview">
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading && lessonId !== "new" ? (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-32 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="metadata" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="metadata" data-testid="tab-metadata">
                  Metadatos
                </TabsTrigger>
                <TabsTrigger value="content" data-testid="tab-content">
                  Contenido
                </TabsTrigger>
              </TabsList>

              <TabsContent value="metadata" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de la Lección</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        data-testid="input-title"
                        placeholder="Ej: Introducción a la Inteligencia Artificial"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Edad Objetivo</Label>
                        <Input
                          id="age"
                          data-testid="input-age"
                          placeholder="Ej: 7-9 años"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lang">Idioma</Label>
                        <Input
                          id="lang"
                          data-testid="input-lang"
                          placeholder="Ej: es"
                          value={lang}
                          onChange={(e) => setLang(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="objectives">
                        Objetivos de Aprendizaje (uno por línea)
                      </Label>
                      <Textarea
                        id="objectives"
                        data-testid="input-objectives"
                        placeholder="Ej:&#10;Comprender qué es la IA&#10;Conocer a ChatGPT y Gemini"
                        rows={5}
                        value={objectives}
                        onChange={(e) => setObjectives(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Editor de Contenido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimelineBuilder
                      items={timeline}
                      onChange={setTimeline}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
