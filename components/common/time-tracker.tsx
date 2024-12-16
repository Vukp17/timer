import { useState, useEffect } from "react";
import { DollarSign, Play, Square, Clock, StopCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ProjectMenu } from "./project-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAll } from "@/app/actions/project";
import { Project } from "@/app/models/project";

export function TimeTracker() {
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isManualMode, setIsManualMode] = useState(true);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");

  const handleStartStop = () => {
    if (!isTracking) {
      if (isManualMode) {
        setStartTime(new Date().toLocaleTimeString());
      } else {
        setTimerStart(Date.now());
      }
    } else {
      if (isManualMode) {
        setEndTime(new Date().toLocaleTimeString());
      } else {
        const endTime = Date.now();
        const durationInSeconds = Math.floor(
          (endTime - (timerStart || 0)) / 1000
        );
        setDuration(formatDuration(durationInSeconds));
        setTimerStart(null);
      }
    }
    setIsTracking(!isTracking);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const data = await getAll();
      setProjects(data);
    };
    fetchProjects();

    let interval: NodeJS.Timeout;
    if (isTracking && !isManualMode) {
      interval = setInterval(() => {
        const now = Date.now();
        const durationInSeconds = Math.floor(
          (now - (timerStart || 0)) / 1000
        );
        setDuration(formatDuration(durationInSeconds));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, isManualMode, timerStart]);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-wrap lg:flex-nowrap gap-4">
          {/* First Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:flex-grow gap-4">
            <Input
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-grow"
            />
            <ProjectMenu
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
            />
          </div>

          {/* Second Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {isManualMode ? (
                <>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32"
                  />
                  <span>-</span>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-32"
                  />
                </>
              ) : (
                <Input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="00:00:00"
                  className="w-32"
                />
              )}
              <Toggle
                aria-label="Toggle billable"
                pressed={isBillable}
                onPressedChange={setIsBillable}
              >
                <DollarSign className="h-4 w-4" />
              </Toggle>
            </div>
            <div className="flex items-center space-x-4">
            <Button onClick={handleStartStop}>
                {isTracking ? (
                  <Square className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isTracking ? "Stop" : "Start"}
              </Button>
              <div className="flex items-center space-x-2">
                <Switch
                  id="mode-switch"
                  checked={!isManualMode}
                  onCheckedChange={(checked) => setIsManualMode(!checked)}
                />
                <Label htmlFor="mode-switch">
                  {isManualMode ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <StopCircle className="h-4 w-4" />
                  )}
                </Label>
              </div>

            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
