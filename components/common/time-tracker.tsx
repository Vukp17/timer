import { useState, useEffect } from "react";
import { DollarSign, Play, Square, Clock, StopCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ProjectMenu } from "./project-menu";
import { TagMenu } from "./tag-menu";
import { TimerList } from "./timer/timer-list";
import { getaAllTags } from "@/app/actions/tags";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAll } from "@/app/actions/project";
import { Project } from "@/app/models/project";
import { Tag } from "@/app/models/tag";
import { createStart, updateOnStopTimer } from "@/app/actions/timer";
import { toast } from "../ui/use-toast";

export function TimeTracker() {
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [currentTimerId, setCurrentTimerId] = useState<string | null>(null);

  const handleStartStop = () => {
    if (!isTracking) {
      if (isManualMode) {
        setStartTime(new Date().toISOString());
      } else {
        setTimerStart(Date.now());
      }

      createStart({
        startTime: new Date(),
        endTime: null,
        duration: undefined,
        description,
        projectId: parseInt(selectedProject),
        tagId: parseInt(selectedTag),
      }).then((response) => {
        console.log("Timer created successfully");
        setCurrentTimerId(response.id.toString());
        setIsTracking(true);
        toast({ title: "Success", description: "Timer started successfully" });
      });
    } else {
      if (isManualMode) {
        setEndTime(new Date().toISOString());
      } else {
        const endTime = Date.now();
        const durationInSeconds = Math.floor((endTime - (timerStart || 0)) / 1000);
        setDuration(formatDuration(durationInSeconds));
        setTimerStart(null);
      }

      updateOnStopTimer({
        id: currentTimerId ? parseInt(currentTimerId) : 0,
        endTime: new Date(),
        duration: isManualMode ? undefined : parseInt(duration),
      }).then(() => {
        toast({ title: "Success", description: "Timer stopped successfully" });
        setIsTracking(false);
        setCurrentTimerId(null);
        // Reset fields
        setDescription("");
        setSelectedProject("");
        setSelectedTag("");
        setStartTime(null);
        setEndTime(null);
        setDuration("");
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleBlurOrProjectChange = () => {
    if (isTracking && currentTimerId) {
      updateOnStopTimer({
        id: parseInt(currentTimerId),
        endTime: new Date(),
        duration: isManualMode ? undefined : parseInt(duration),
      }).then(() => {
        toast({ title: "Success", description: "Timer updated successfully" });
      });
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const data = await getAll();
      setProjects(data);
    };
    fetchProjects();

    const fetchTags = async () => {
      const data = await getaAllTags();
      setTags(data);
    };
    fetchTags();

    let interval: NodeJS.Timeout;
    if (isTracking && !isManualMode) {
      interval = setInterval(() => {
        const now = Date.now();
        const durationInSeconds = Math.floor((now - (timerStart || 0)) / 1000);
        setDuration(formatDuration(durationInSeconds));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, isManualMode, timerStart]);

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
            <Input
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleBlurOrProjectChange}
              className="flex-grow h-12 text-lg"
            />
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 lg:flex-nowrap">
              <ProjectMenu
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={(project) => {
                  setSelectedProject(project);
                  handleBlurOrProjectChange();
                }}
              />
              <TagMenu
                tags={tags}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
              />
              <div className="flex items-center space-x-2">
                {isManualMode ? (
                  <>
                    <Input
                      type="time"
                      value={startTime ? startTime.split("T")[1].substring(0, 5) : ""}
                      onChange={(e) => setStartTime(new Date().toISOString().split("T")[0] + "T" + e.target.value + ":00Z")}
                      className="w-24"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={endTime ? endTime.split("T")[1].substring(0, 5) : ""}
                      onChange={(e) => setEndTime(new Date().toISOString().split("T")[0] + "T" + e.target.value + ":00Z")}
                      className="w-24"
                    />
                  </>
                ) : (
                  <Input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="00:00:00"
                    className="w-24"
                  />
                )}
              </div>
              <Toggle
                aria-label="Toggle billable"
                pressed={isBillable}
                onPressedChange={setIsBillable}
              >
                <DollarSign className="h-4 w-4" />
              </Toggle>
              <div className="flex items-center space-x-2">
                <Switch
                  id="mode-switch"
                  checked={!isManualMode}
                  onCheckedChange={(checked) => setIsManualMode(!checked)}
                />
                <Label htmlFor="mode-switch" className="sr-only">
                  {isManualMode ? "Manual mode" : "Automatic mode"}
                </Label>
                {isManualMode ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <StopCircle className="h-4 w-4" />
                )}
              </div>
              <Button onClick={handleStartStop}>
                {isTracking ? (
                  <Square className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isTracking ? "Stop" : "Start"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <TimerList projects={projects} />
    </div>
  );
}
