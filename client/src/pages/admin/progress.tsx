import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TrendingUp, Award, Clock, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { User } from "@shared/schema";

interface UserProgress {
  userId: number;
  userName: string;
  username: string;
  lessonsCompleted: number;
  totalLessons: number;
  averageScore: number;
  lastActivity: string;
}

export default function ProgressPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: progressData, isLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/admin/progress"],
  });

  const students = users?.filter((u) => u.role === "student") || [];
  const totalStudents = students.length;

  const avgCompletionRate =
    progressData && progressData.length > 0
      ? Math.round(
          progressData.reduce((sum, p) => {
            // Only include students with lessons in the average
            const rate = p.totalLessons > 0 ? (p.lessonsCompleted / p.totalLessons) * 100 : 0;
            return sum + rate;
          }, 0) / progressData.length
        )
      : 0;

  const avgScore =
    progressData && progressData.length > 0
      ? Math.round(progressData.reduce((sum, p) => sum + p.averageScore, 0) / progressData.length)
      : 0;

  const filteredProgress = progressData?.filter((progress) =>
    progress.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    progress.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Seguimiento de Progreso</h1>
          <p className="text-muted-foreground">Monitorea el avance de tus estudiantes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estudiantes Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Total registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Completitud</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">Promedio general</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgScore}%</div>
              <p className="text-xs text-muted-foreground">En quizzes completados</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar estudiantes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-progress"
              />
            </div>
          </CardContent>
        </Card>

        {/* Progress Table */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso por Estudiante</CardTitle>
            <CardDescription>
              {filteredProgress.length} estudiante{filteredProgress.length !== 1 ? "s" : ""} encontrado{filteredProgress.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando datos...</div>
            ) : filteredProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de progreso disponibles
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Última Actividad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProgress.map((progress) => {
                    // Safely calculate completion rate, default to 0 if no lessons
                    const completionRate = progress.totalLessons > 0 
                      ? Math.round((progress.lessonsCompleted / progress.totalLessons) * 100)
                      : 0;
                    
                    return (
                      <TableRow key={progress.userId} data-testid={`row-progress-${progress.userId}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{progress.userName}</span>
                            <span className="text-sm text-muted-foreground">@{progress.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{progress.lessonsCompleted} / {progress.totalLessons} lecciones</span>
                              <span className="font-medium">{completionRate}%</span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              progress.averageScore >= 80
                                ? "default"
                                : progress.averageScore >= 60
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {Math.round(progress.averageScore)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {progress.lastActivity
                            ? new Date(progress.lastActivity).toLocaleDateString("es-ES")
                            : "Sin actividad"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
