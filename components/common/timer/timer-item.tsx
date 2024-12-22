import { Project } from "@/app/models/project";
import { Timer } from "@/app/models/timer";
import { TimerControls } from "./timer-controls";
import { TimerInputs } from "./timer-inputs";


export function TimerItem({ timer, projects }: { timer: Timer | Timer[]; projects: Project[] }) {
  const isGrouped = Array.isArray(timer);
  const groupTimers = isGrouped ? timer : [timer];
  return (
    <div className="flex items-center gap-4 flex-wrap mb-2">
      <TimerInputs timer={groupTimers[0]} projects={projects} />
      <TimerControls timer={groupTimers[0]} isGrouped={isGrouped} />
    </div>
  );
}