import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Save, Eye, Sparkles, Globe, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import type { Lesson, TimelineItem, InsertLesson, LessonDSL, GenerateLessonResponse } from "@shared/schema";
import { useState, useEffect, useMemo } from "react";
import { TimelineBuilder } from "@/components/TimelineBuilder";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LessonRenderer } from "@/components/LessonRenderer";

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
  const [published, setPublished] = useState(false);

  // Update form when lesson data loads
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setAge(lesson.age);
      setLang(lesson.lang);
      setObjectives(lesson.objectives.join("\n"));
      setTimeline(lesson.timeline);
      setPublished(lesson.published);
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
        published,
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
      // Invalidate admin lessons list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      
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

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const objectivesArray = objectives.split("\n").filter(line => line.trim().length > 0);
      
      return apiRequest<GenerateLessonResponse>("POST", "/api/lessons/generate", {
        title,
        age,
        objectives: objectivesArray,
        lang,
      });
    },
    onSuccess: (data) => {
      setTimeline(data.timeline as TimelineItem[]);
      toast({
        title: "¡Contenido generado!",
        description: "La lección ha sido generada automáticamente. Revisa y ajusta según necesites.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al generar",
        description: error.message || "No se pudo generar el contenido automáticamente",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    // Validation for generation
    if (!title.trim()) {
      toast({
        title: "Error de validación",
        description: "El título es obligatorio para generar contenido",
        variant: "destructive",
      });
      return;
    }

    if (!age.trim()) {
      toast({
        title: "Error de validación",
        description: "La edad objetivo es obligatoria para generar contenido",
        variant: "destructive",
      });
      return;
    }

    const objectivesArray = objectives.split("\n").filter(line => line.trim().length > 0);
    if (objectivesArray.length === 0) {
      toast({
        title: "Error de validación",
        description: "Debes incluir al menos un objetivo de aprendizaje",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate();
  };

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

  // Build preview lesson object from current form state
  const previewLesson = useMemo<LessonDSL>(() => {
    const objectivesArray = objectives.split("\n").filter(line => line.trim().length > 0);
    
    return {
      meta: {
        id: lesson?.lessonId || "preview",
        title: title || "Sin título",
        age: age || "N/A",
        lang: lang || "es",
      },
      objectives: objectivesArray,
      timeline: timeline,
    };
  }, [title, age, lang, objectives, timeline, lesson?.lessonId]);

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
              <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                <TabsTrigger value="metadata" data-testid="tab-metadata">
                  Metadatos
                </TabsTrigger>
                <TabsTrigger value="content" data-testid="tab-content">
                  Contenido
                </TabsTrigger>
                <TabsTrigger value="preview" data-testid="tab-preview">
                  Vista Previa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="metadata" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de la Lección</CardTitle>
                    <CardDescription>
                      Completa los metadatos básicos y genera contenido automáticamente con IA
                    </CardDescription>
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

                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-primary" />
                          <Label htmlFor="published" className="text-lg font-semibold text-foreground cursor-pointer">
                            Publicar Lección
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 ml-7">
                          {published ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <p className="text-sm text-muted-foreground">
                                Esta lección es visible para los estudiantes
                              </p>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                              <p className="text-sm text-muted-foreground">
                                Esta lección es un borrador y NO es visible para los estudiantes
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <Switch
                        id="published"
                        checked={published}
                        onCheckedChange={setPublished}
                        data-testid="switch-published"
                        className="scale-125"
                      />
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-foreground mb-1 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Generación Automática con IA
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Completa los campos anteriores y la IA creará automáticamente todo el contenido de la lección: mensajes del tutor, quizzes, reflexiones e imágenes educativas.
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        data-testid="button-generate"
                        className="flex-shrink-0"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {generateMutation.isPending ? "Generando..." : "Generar Automáticamente"}
                      </Button>
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

              <TabsContent value="preview" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Vista Previa de la Lección</CardTitle>
                        <CardDescription className="mt-2">
                          {published 
                            ? "Esta lección está publicada y visible para estudiantes" 
                            : "Activa 'Publicar Lección' en Metadatos para que sea visible"}
                        </CardDescription>
                      </div>
                      {published && lesson && (
                        <Link href={`/lessons/${lesson.lessonId}`} target="_blank">
                          <Button size="lg" data-testid="button-view-lesson">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Lección Completa
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="bg-muted/30 rounded-lg p-6 border border-muted">
                      <LessonRenderer lesson={previewLesson} />
                    </div>
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
