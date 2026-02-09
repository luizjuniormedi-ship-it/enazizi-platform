import { CalendarDays, Clock, BookOpen } from "lucide-react";

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const schedule = [
  { day: "Seg", tasks: [{ time: "08:00", subject: "Direito Constitucional", duration: "2h" }, { time: "14:00", subject: "Direito Penal", duration: "2h" }] },
  { day: "Ter", tasks: [{ time: "08:00", subject: "Direito Administrativo", duration: "2h" }, { time: "14:00", subject: "Legislação Especial", duration: "1.5h" }] },
  { day: "Qua", tasks: [{ time: "08:00", subject: "Criminologia", duration: "2h" }, { time: "14:00", subject: "Revisão + Simulado", duration: "3h" }] },
  { day: "Qui", tasks: [{ time: "08:00", subject: "Direito Processual Penal", duration: "2h" }, { time: "14:00", subject: "Direito Civil", duration: "2h" }] },
  { day: "Sex", tasks: [{ time: "08:00", subject: "Direitos Humanos", duration: "2h" }, { time: "14:00", subject: "Informática", duration: "1h" }] },
  { day: "Sáb", tasks: [{ time: "09:00", subject: "Simulado Completo", duration: "4h" }] },
  { day: "Dom", tasks: [{ time: "10:00", subject: "Revisão semanal", duration: "2h" }] },
];

const StudyPlan = () => (
  <div className="space-y-8 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-primary" />
        Cronograma de Estudos
      </h1>
      <p className="text-muted-foreground">Seu plano semanal personalizado por IA.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {schedule.map((day) => (
        <div key={day.day} className="glass-card p-5">
          <h3 className="font-semibold text-primary mb-3">{day.day}</h3>
          <div className="space-y-3">
            {day.tasks.map((task, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-secondary/50">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{task.subject}</div>
                  <div className="text-xs text-muted-foreground">{task.time} • {task.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default StudyPlan;
