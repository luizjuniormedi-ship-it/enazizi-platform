import { useState, useMemo } from "react";
import { ecgCourse, rxCourse, type CourseData, type CourseModule, type CourseLesson } from "@/data/ecgCourseData";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Heart, Image, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LessonQuiz from "@/components/courses/LessonQuiz";

const STORAGE_KEY = "course-progress";

const getProgress = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
};

const markComplete = (lessonId: string) => {
  const p = getProgress();
  p[lessonId] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
};

type View = "catalog" | "course" | "lesson";

const Courses = () => {
  const [view, setView] = useState<View>("catalog");
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(getProgress);

  const courses = [ecgCourse, rxCourse];

  const getCourseProgress = (course: CourseData) => {
    const total = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const done = course.modules.reduce((s, m) => s + m.lessons.filter(l => progress[l.id]).length, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const handleOpenCourse = (c: CourseData) => {
    setSelectedCourse(c);
    setView("course");
    const initial: Record<string, boolean> = {};
    c.modules.forEach((m, i) => { initial[m.id] = i === 0; });
    setOpenModules(initial);
  };

  const handleOpenLesson = (module: CourseModule, lesson: CourseLesson) => {
    setSelectedModule(module);
    setSelectedLesson(lesson);
    setView("lesson");
  };

  const handleCompleteLesson = () => {
    if (!selectedLesson) return;
    markComplete(selectedLesson.id);
    setProgress(getProgress());
  };

  const handleNextLesson = () => {
    if (!selectedCourse || !selectedModule || !selectedLesson) return;
    handleCompleteLesson();
    const allLessons = selectedCourse.modules.flatMap(m => m.lessons.map(l => ({ module: m, lesson: l })));
    const idx = allLessons.findIndex(x => x.lesson.id === selectedLesson.id);
    if (idx < allLessons.length - 1) {
      const next = allLessons[idx + 1];
      setSelectedModule(next.module);
      setSelectedLesson(next.lesson);
      window.scrollTo(0, 0);
    } else {
      setView("course");
    }
  };

  const handlePrevLesson = () => {
    if (!selectedCourse || !selectedLesson) return;
    const allLessons = selectedCourse.modules.flatMap(m => m.lessons.map(l => ({ module: m, lesson: l })));
    const idx = allLessons.findIndex(x => x.lesson.id === selectedLesson.id);
    if (idx > 0) {
      const prev = allLessons[idx - 1];
      setSelectedModule(prev.module);
      setSelectedLesson(prev.lesson);
      window.scrollTo(0, 0);
    }
  };

  const currentLessonIndex = useMemo(() => {
    if (!selectedCourse || !selectedLesson) return 0;
    return selectedCourse.modules.flatMap(m => m.lessons).findIndex(l => l.id === selectedLesson.id);
  }, [selectedCourse, selectedLesson]);

  const totalLessons = selectedCourse?.modules.reduce((s, m) => s + m.lessons.length, 0) || 0;

  // CATALOG VIEW
  if (view === "catalog") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">📚 Cursos de Interpretação</h1>
          <p className="text-muted-foreground">Cursos estruturados com teoria completa e casos clínicos comentados.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map(c => {
            const pct = getCourseProgress(c);
            const total = c.modules.reduce((s, m) => s + m.lessons.length, 0);
            return (
              <button
                key={c.id}
                onClick={() => handleOpenCourse(c)}
                className="glass-card p-6 text-left hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {c.category === "ecg" ? "⚡" : "🫁"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold">{c.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{c.modules.length} módulos</span>
                      <span>•</span>
                      <span>{total} aulas</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold text-primary">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // COURSE VIEW (modules + lessons list)
  if (view === "course" && selectedCourse) {
    const pct = getCourseProgress(selectedCourse);
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setView("catalog")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar aos cursos
        </button>

        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
            {selectedCourse.category === "ecg" ? "⚡" : "🫁"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{selectedCourse.title}</h1>
            <p className="text-muted-foreground">{selectedCourse.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={pct} className="h-2 w-48" />
              <span className="text-sm font-semibold text-primary">{pct}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {selectedCourse.modules.map((mod, mi) => {
            const modDone = mod.lessons.filter(l => progress[l.id]).length;
            const isOpen = openModules[mod.id] ?? false;
            return (
              <div key={mod.id} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenModules(p => ({ ...p, [mod.id]: !p[mod.id] }))}
                  className="flex items-center justify-between w-full p-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{mod.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Módulo {mi + 1}: {mod.title}</div>
                      <div className="text-xs text-muted-foreground">{mod.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{modDone}/{mod.lessons.length}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "" : "-rotate-90")} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border">
                    {mod.lessons.map((lesson, li) => {
                      const done = progress[lesson.id];
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleOpenLesson(mod, lesson)}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent/30 transition-colors text-left border-b border-border/50 last:border-b-0"
                        >
                          <div className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            done ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                          )}>
                            {done ? <CheckCircle2 className="h-4 w-4" /> : li + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{lesson.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{lesson.subtitle}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // LESSON VIEW
  if (view === "lesson" && selectedCourse && selectedModule && selectedLesson) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <button onClick={() => setView("course")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao curso
        </button>

        {/* Progress bar */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Aula {currentLessonIndex + 1} de {totalLessons}</span>
          <Progress value={((currentLessonIndex + 1) / totalLessons) * 100} className="h-1.5 flex-1" />
        </div>

        {/* Header */}
        <div>
          <div className="text-xs text-primary font-semibold uppercase tracking-wider">{selectedModule.icon} {selectedModule.title}</div>
          <h1 className="text-xl font-bold mt-1">{selectedLesson.title}</h1>
          <p className="text-muted-foreground text-sm">{selectedLesson.subtitle}</p>
        </div>

        {/* Theory content */}
        <div className="glass-card p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-td:text-foreground/80 prose-th:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedLesson.theory}
            </ReactMarkdown>
          </div>
        </div>

        {/* Key Points */}
        <div className="glass-card p-5 border-l-4 border-l-primary">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            Pontos-Chave para Prova
          </h3>
          <ul className="space-y-2">
            {selectedLesson.keyPoints.map((kp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{kp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Clinical Tip */}
        {selectedLesson.clinicalTip && (
          <div className="glass-card p-5 border-l-4 border-l-amber-500 bg-amber-500/5">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-amber-500" />
              Pérola Clínica
            </h3>
            <p className="text-sm text-muted-foreground">{selectedLesson.clinicalTip}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevLesson}
            disabled={currentLessonIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <Button onClick={handleNextLesson} size="sm">
            {currentLessonIndex < totalLessons - 1 ? (
              <>Próxima aula <ArrowRight className="h-4 w-4 ml-1" /></>
            ) : (
              <>Concluir curso <CheckCircle2 className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default Courses;
