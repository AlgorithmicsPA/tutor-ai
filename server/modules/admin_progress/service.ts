/**
 * Service layer del módulo admin_progress.
 *
 * Agrega progreso de todos los students sobre lecciones publicadas. Wraps el
 * storage compartido (`server/storage.ts`) para que la modularización del
 * storage en el futuro toque solo este archivo.
 */
import { storage } from "../../storage";

export interface UserProgressSummary {
  userId: number;
  userName: string;
  username: string;
  lessonsCompleted: number;
  totalLessons: number;
  averageScore: number;
  lastActivity: Date | string | null;
}

/**
 * Computa el resumen de progreso para TODOS los students contra todas las
 * lecciones publicadas. Replica exactamente el shape que consume el admin
 * frontend (`/admin/progress`).
 */
export async function getProgressSummary(): Promise<UserProgressSummary[]> {
  const allUsers = await storage.getAllUsers();
  const allLessons = await storage.getAllLessons();
  const publishedLessons = allLessons.filter((l) => l.published);

  const progressData: UserProgressSummary[] = [];

  for (const user of allUsers) {
    if (user.role !== "student") continue;

    let completedCount = 0;
    let totalScore = 0;
    let quizCount = 0;
    let lastActivity: Date | string | null = null;

    for (const lesson of publishedLessons) {
      const progress = await storage.getUserProgress(
        user.id.toString(),
        lesson.lessonId,
      );

      if (progress) {
        if (progress.completed) completedCount++;

        // Handle quiz scores - they might be stored as numbers or objects {index, score}
        if (
          progress.quizScores &&
          Array.isArray(progress.quizScores) &&
          progress.quizScores.length > 0
        ) {
          try {
            const scores = progress.quizScores.map((s: any) => {
              // Handle both object format {index, score} and legacy number format
              return typeof s === "object" && s !== null && "score" in s
                ? s.score
                : typeof s === "number"
                  ? s
                  : 0;
            });

            if (scores.length > 0) {
              const avgScore =
                scores.reduce((sum: number, score: number) => sum + score, 0) /
                scores.length;
              totalScore += avgScore;
              quizCount++;
            }
          } catch (error) {
            // Skip malformed quiz scores
            console.warn(
              `Malformed quiz scores for user ${user.id}, lesson ${lesson.lessonId}`,
              error,
            );
          }
        }

        if (
          progress.updatedAt &&
          (!lastActivity ||
            new Date(progress.updatedAt) > new Date(lastActivity))
        ) {
          lastActivity = progress.updatedAt;
        }
      }
    }

    progressData.push({
      userId: user.id,
      userName: user.name || user.username,
      username: user.username,
      lessonsCompleted: completedCount,
      totalLessons: publishedLessons.length,
      averageScore: quizCount > 0 ? (totalScore / quizCount) * 100 : 0,
      lastActivity: lastActivity,
    });
  }

  return progressData;
}
