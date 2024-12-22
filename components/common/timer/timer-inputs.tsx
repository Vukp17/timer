import { Input } from "@/components/ui/input";
import { Timer } from "@/app/models/timer";
import { Project } from "@/app/models/project";
import { ProjectMenu } from "../project-menu";

export function TimerInputs({ timer, projects }: { timer: Timer; projects: Project[] }) {
    return (
        <>
            <Input placeholder="Description" value={timer.description || ""} />
            <ProjectMenu projects={projects} selectedProject={String(timer.project?.id || '')} onSelectProject={function (projectId: string): void {
                throw new Error("Function not implemented.");
            }} />
            <Input type="text" placeholder="00:00:00" value={timer.startTime?.toString() || ""} />
            <Input type="text" placeholder="00:00:00" value={timer.endTime?.toString() || ""} />
        </>
    );
}