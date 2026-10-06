import { Badge, Button, ProgressBar } from "@/components/ui";
import { MascotSays } from "@/components/brand";

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  progress: number;
  currentExercise: string;
  totalExercises: number;
  completedExercises: number;
  category: string;
  difficulty: string;
}

interface JumpBackInProps {
  courseProgress?: CourseProgress;
}

export function JumpBackIn({ courseProgress }: JumpBackInProps) {
  return (
    <section>
      <h2 className="text-display-2 mb-6 !text-[clamp(1.15rem,1.8vw,1.5rem)]">Continue</h2>
      {!courseProgress ? (
        <div className="pixel-panel flex flex-col items-start gap-6 p-6 md:flex-row md:items-center md:p-8">
          <MascotSays mood="coffee" className="flex-1">
            No save file yet. Pick a course and start your first quest!
          </MascotSays>
          <Button href="/courses" size="lg">
            Browse courses
          </Button>
        </div>
      ) : (
        <div className="pixel-panel !border-cyber-primary p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{courseProgress.category}</Badge>
                {courseProgress.difficulty && <Badge>{courseProgress.difficulty}</Badge>}
              </div>
              <h3 className="mb-1 text-2xl text-cyber-text-primary">{courseProgress.courseTitle}</h3>
              <p className="mb-5 text-cyber-text-secondary">
                Next up: <span className="font-ui text-cyber-primary">{courseProgress.currentExercise}</span>
              </p>
              <ProgressBar
                label="Progress"
                current={courseProgress.completedExercises}
                total={courseProgress.totalExercises}
              />
            </div>
            <Button href={`/courses/${courseProgress.courseSlug}`} size="lg" className="shrink-0">
              Continue ▶
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
