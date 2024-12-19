import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTimers, updateOnStopTimer } from "@/app/actions/timer"; // Import the functions to fetch and update timers
import { Timer } from "@/app/models/timer"; // Import the Timer model
import { Project } from "@/app/models/project";
import { Play, Square, Edit } from "lucide-react";
import { ProjectMenu } from "./project-menu";

export function TimerList({ projects }: { projects: Project[] }) {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [editingTimerId, setEditingTimerId] = useState<number | null>(null);
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [editedStartTime, setEditedStartTime] = useState<Date | null>(null);
  const [editedEndTime, setEditedEndTime] = useState<Date | null>(null);
  const [editedProjectId, setEditedProjectId] = useState<number | null>(null);
  const [editedDuration, setEditedDuration] = useState<string>("");

  useEffect(() => {
    const fetchTimers = async () => {
      const data = await getTimers(0);
      setTimers(data);
    };
    fetchTimers();
  }, []);

  const handleSave = async (timerId: number) => {
    const durationInMinutes = convertDurationToMinutes(editedDuration);
    await updateOnStopTimer({
      id: timerId,
      description: editedDescription,
      startTime: editedStartTime ?? undefined,
      endTime: editedEndTime ?? undefined,
      duration: durationInMinutes ?? undefined,
      project: editedProjectId ? projects.find(project => project.id === editedProjectId) : undefined
    });
    setEditingTimerId(null);
    const updatedTimers = await getTimers(0);
    setTimers(updatedTimers);
  };

  const handleStartStop = async (timer: Timer) => {
    if (timer.endTime) {
      // Start the timer
      await updateOnStopTimer({
        id: timer.id,
        startTime: new Date(),
        endTime: undefined,
        duration: undefined,
      });
    } else {
      // Stop the timer
      await updateOnStopTimer({
        id: timer.id,
        endTime: new Date(),
        duration: undefined
      });
    }
    const updatedTimers = await getTimers(0);
    setTimers(updatedTimers);
  };

  const handleBlur = (timerId: number) => {
    handleSave(timerId);
  };

  const editTimer = (timer: Timer) => {
    setEditingTimerId(timer.id);
    setEditedDescription(timer.description ?? "");
    setEditedStartTime(timer.startTime ? new Date(timer.startTime) : null);
    setEditedEndTime(timer.endTime ? new Date(timer.endTime) : null);
    setEditedProjectId(timer.project?.id ?? null);
    setEditedDuration(convertMinutesToDuration(timer.duration ?? 0));
  };

  const convertMinutesToDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const convertDurationToMinutes = (duration: string): number => {
    const [hours, mins, secs] = duration.split(':').map(Number);
    return hours * 60 + mins + secs / 60;
  };

  return (
    <Card className="w-full mt-4">
      <CardContent className="p-6">
        <ul>
          {timers.map((timer) => (
            <li key={timer.id} className="mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Input
                  value={editingTimerId === timer.id ? editedDescription : timer.description ?? ""}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onBlur={() => handleBlur(timer.id)}
                  placeholder="Description"
                  className="flex-1 min-w-[150px]"
                />
                <Input
                  type="datetime-local"
                  value={editingTimerId === timer.id && editedStartTime ? editedStartTime.toISOString().slice(0, 16) : timer.startTime ? new Date(timer.startTime).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditedStartTime(e.target.value ? new Date(e.target.value) : null)}
                  onBlur={() => handleBlur(timer.id)}
                  className="flex-1 min-w-[200px]"
                />
                <Input
                  type="datetime-local"
                  value={editingTimerId === timer.id && editedEndTime ? editedEndTime.toISOString().slice(0, 16) : timer.endTime ? new Date(timer.endTime).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditedEndTime(e.target.value ? new Date(e.target.value) : null)}
                  onBlur={() => handleBlur(timer.id)}
                  className="flex-1 min-w-[200px]"
                />
                <Input
                  type="text"
                  value={editingTimerId === timer.id ? editedDuration : convertMinutesToDuration(timer.duration ?? 0)}
                  onChange={(e) => setEditedDuration(e.target.value)}
                  onBlur={() => handleBlur(timer.id)}
                  placeholder="Duration (HH:MM:SS)"
                  className="flex-1 min-w-[150px]"
                />
                <ProjectMenu
                  projects={projects}
                  selectedProject={editingTimerId === timer.id ? String(editedProjectId) : String(timer.project?.id)}
                  onSelectProject={(projectId) => setEditedProjectId(Number(projectId))}
                />
                <Button onClick={() => handleStartStop(timer)}>
                  {timer.endTime ? <Play className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </Button>

              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}