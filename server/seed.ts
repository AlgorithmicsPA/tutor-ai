import { storage } from "./storage";
import { demoLesson } from "../client/src/data/demo-lesson";

async function seed() {
  try {
    console.log("Seeding database with demo lesson...");
    
    // Check if demo lesson already exists
    const existing = await storage.getLessonByLessonId(demoLesson.meta.id);
    
    if (existing) {
      console.log("Demo lesson already exists, skipping...");
      return;
    }

    // Create the demo lesson
    const lesson = await storage.createLesson({
      lessonId: demoLesson.meta.id,
      title: demoLesson.meta.title,
      age: demoLesson.meta.age,
      lang: demoLesson.meta.lang,
      objectives: demoLesson.objectives,
      timeline: demoLesson.timeline,
      adaptation: demoLesson.adaptation,
      published: true,
    });

    console.log("✓ Demo lesson created:", lesson.lessonId);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed().then(() => {
  console.log("Seed completed successfully!");
  process.exit(0);
});
