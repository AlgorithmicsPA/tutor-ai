import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Edit, Trash2, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Lesson } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminLessonsPage() {
  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/admin/lessons"],
  });
  const { toast } = useToast();
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      toast({
        title: "Lección eliminada",
        description: "La lección se ha eliminado correctamente",
      });
      setLessonToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la lección",
        variant: "destructive",
      });
    },
  });

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
                <h1 className="text-2xl font-bold text-foreground">Gestión de Lecciones</h1>
                <p className="text-sm text-muted-foreground">Crea y administra lecciones educativas</p>
              </div>
            </div>
            <Link href="/admin/lessons/new">
              <Button data-testid="button-create-lesson">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Lección
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
            {lessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="hover-elevate transition-all duration-200"
                data-testid={`card-lesson-${lesson.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl truncate">{lesson.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {lesson.objectives.join(", ")}
                      </CardDescription>
                    </div>
                    <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" data-testid={`badge-age-${lesson.id}`}>
                      {lesson.age}
                    </Badge>
                    <Badge variant="outline" data-testid={`badge-lang-${lesson.id}`}>
                      {lesson.lang}
                    </Badge>
                    <Badge variant="outline" data-testid={`badge-items-${lesson.id}`}>
                      {lesson.timeline.length} items
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/lessons/${lesson.lessonId}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        data-testid={`button-edit-${lesson.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLessonToDelete(lesson)}
                      data-testid={`button-delete-${lesson.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay lecciones</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primera lección educativa
              </p>
              <Link href="/admin/lessons/new">
                <Button data-testid="button-create-first">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Lección
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!lessonToDelete} onOpenChange={() => setLessonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la lección{" "}
              <span className="font-semibold">"{lessonToDelete?.title}"</span> y toda su información.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => lessonToDelete && deleteMutation.mutate(lessonToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
