import { useState, useEffect, useRef } from "react"
import { DollarSign, Play, Square } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { ProjectMenu } from "./project-menu"
import { TagMenu } from "./tag-menu"
import { TimerList } from "./timer-list"
import { getaAllTags } from "@/app/actions/tags"
import { getAllProjects } from "@/app/actions/project"
import type { Project } from "@/app/models/project"
import type { Tag } from "@/app/models/tag"
import { createStart, updateOnStopTimer, getRunningTimer, getTimers } from "@/app/actions/timer"
import { toast } from "../ui/use-toast"
import { EmptyState } from "./empty-states/empty-state-timer"
import type { TimerListHandle } from "./timer-list"

export function TimeTracker() {
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endTime, setEndTime] = useState<string | null>(null)
  const [duration, setDuration] = useState("")
  const [isBillable, setIsBillable] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTag, setSelectedTag] = useState<string>("")
  const [currentTimerId, setCurrentTimerId] = useState<string | null>(null)
  const [isStartTimeMenuOpen, setIsStartTimeMenuOpen] = useState(false)
  const [isManualStartTime, setIsManualStartTime] = useState(false)
  const [manualStartTimeInput, setManualStartTimeInput] = useState<string>("")
  const [hasTimers, setHasTimers] = useState(false)

  const timerListRef = useRef<TimerListHandle>(null)

  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // This function updates the start time locally and recalculates the duration.
  // It does NOT update the start time in the database.
  const updateStartTime = (input: string) => {
    // Remove any colons and trim whitespace
    const timeInput = input.replace(/:/g, "").trim();
  
    // Basic validation for numeric input
    if (!/^\d{1,4}$/.test(timeInput)) {
      return; // Ignore invalid input
    }
  
    let hours = 0, minutes = 0;
  
    if (timeInput.length === 4) {
      // Format: 1230, 0930, etc.
      hours = parseInt(timeInput.substring(0, 2));
      minutes = parseInt(timeInput.substring(2, 4));
    } else if (timeInput.length === 3) {
      // Format: 123 (1:23)
      hours = parseInt(timeInput.substring(0, 1));
      minutes = parseInt(timeInput.substring(1, 3));
    } else if (timeInput.length === 2) {
      // Format: 12 (12:00) or 23 (0:23)
      if (parseInt(timeInput) < 24) {
        hours = parseInt(timeInput);
        minutes = 0;
      } else {
        hours = parseInt(timeInput.substring(0, 1));
        minutes = parseInt(timeInput.substring(1)) * 10;
      }
    } else if (timeInput.length === 1) {
      // Format: 9 (9:00)
      hours = parseInt(timeInput);
      minutes = 0;
    }
  
    // Validate hours and minutes
    if (hours >= 24 || minutes >= 60) {
      return; // Invalid time
    }
  
    const updatedStartTime = new Date();
    updatedStartTime.setHours(hours, minutes, 0, 0);
  
    setTimerStart(updatedStartTime.getTime());
    setStartTime(updatedStartTime.toISOString());
  
    // Recalculate duration
    const durationInSeconds = Math.floor((Date.now() - updatedStartTime.getTime()) / 1000);
    setDuration(formatDuration(durationInSeconds));
    //update db
    if (isTracking && currentTimerId) {
      updateOnStopTimer({
        id: parseInt(currentTimerId),
        startTime: updatedStartTime,
      }).then(() => {
        toast({ title: "Success", description: "Timer updated successfully" });
      });
    }
  };
  
  const handleManualStartTimeBlur = () => {
    if (manualStartTimeInput.trim() !== "") {
      updateStartTime(manualStartTimeInput);
    }
    setIsManualStartTime(false);
    setIsStartTimeMenuOpen(false);
  };
  
  const handleManualStartTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (manualStartTimeInput.trim() !== "") {
        updateStartTime(manualStartTimeInput);
      }
      setIsManualStartTime(false);
      setIsStartTimeMenuOpen(false);
      e.currentTarget.blur();
    }
  };
  


  const handleManualStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualStartTime(true) // Pause interval updates temporarily
    setManualStartTimeInput(e.target.value)
  }

  const handleStartStop = () => {
    if (!isTracking) {
      const now = new Date()
      if (isManualMode) {
        setStartTime(now.toISOString())
      } else {
        setTimerStart(now.getTime())
        setStartTime(now.toISOString())
      }

      createStart({
        startTime: new Date(),
        endTime: null,
        duration: undefined,
        description,
        projectId: Number.parseInt(selectedProject),
        tagId: Number.parseInt(selectedTag),
      }).then((response) => {
        console.log("Timer created successfully")
        setCurrentTimerId(response.id.toString())
        setIsTracking(true)
        setHasTimers(true)
        toast({
          title: "Success",
          description: "Timer started successfully",
          duration: 5000,
          style: { background: "green", color: "white" },
        })
      })
    } else {
      if (!selectedProject) {
        toast({
          title: "Error",
          description: "Please select a project before stopping the timer",
          style: { background: "red", color: "white" },
        })
        return
      }

      const now = new Date()
      if (isManualMode) {
        setEndTime(now.toISOString())
      } else {
        const endTime = Date.now()
        const durationInSeconds = Math.floor((endTime - (timerStart || 0)) / 1000)
        setDuration(formatDuration(durationInSeconds))
        setTimerStart(null)
      }

      updateOnStopTimer({
        id: currentTimerId ? parseInt(currentTimerId) : 0,
        endTime: now,
        duration: isManualMode ? undefined : parseInt(duration),
      }).then(() => {
        toast({ title: "Success", description: "Timer stopped successfully" })
        setIsTracking(false)
        setCurrentTimerId(null)
        // Reset fields
        setDescription("")
        setSelectedProject("")
        setSelectedTag("")
        setStartTime(null)
        setEndTime(null)
        setDuration("")
        // Refresh the timer list
        timerListRef.current?.refreshTimers();
      })
    }
  }

  const updateProject = (projectId: string) => {
    if (isTracking && currentTimerId) {
      updateOnStopTimer({
        id: parseInt(currentTimerId),
        projectId: Number.parseInt(projectId),
      }).then(() => {
        toast({ title: "Success", description: "Timer updated successfully" })
      })
    }
  }

  const updateTag = (tagId: string) => {
    if (isTracking && currentTimerId) {
      updateOnStopTimer({
        id: parseInt(currentTimerId),
        tagId: Number.parseInt(tagId),
      }).then(() => {
        toast({ title: "Success", description: "Timer updated successfully" })
      })
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleBlurOrProjectChange = () => {
    if (isTracking && currentTimerId) {
      updateOnStopTimer({
        id: parseInt(currentTimerId),
        duration: isManualMode ? undefined : parseInt(duration),
        description: description,
        projectId: Number.parseInt(selectedProject),
        tagId: Number.parseInt(selectedTag),
      }).then(() => {
        toast({ title: "Success", description: "Timer updated successfully" })
      })
    }
  }

  useEffect(() => {
    const fetchProjects = async () => {
      const data = await getAllProjects()
      setProjects(data)
    }
    fetchProjects()

    const fetchTags = async () => {
      const data = await getaAllTags()
      setTags(data)
    }
    fetchTags()

    const checkTimers = async () => {
      if (!isTracking) {
        const runningTimer = await getRunningTimer()
        if (runningTimer) {
          setIsTracking(true)
          setCurrentTimerId(runningTimer.id.toString())
          setDescription(runningTimer.description || "")
          setSelectedProject(runningTimer.projectId ? runningTimer.projectId.toString() : "")
          setSelectedTag(runningTimer.tagId ? runningTimer.tagId.toString() : "")
          setHasTimers(true)

          if (runningTimer.startTime) {
            setStartTime(new Date(runningTimer.startTime).toISOString())
            setTimerStart(new Date(runningTimer.startTime).getTime())
          }

          if (!isManualMode) {
            const now = Date.now()
            const start = runningTimer.startTime ? new Date(runningTimer.startTime).getTime() : Date.now()
            const durationInSeconds = Math.floor((now - start) / 1000)
            setDuration(formatDuration(durationInSeconds))
          }
        }
      }

      if (!hasTimers) {
        const { groupedTimers } = await getTimers(0)
        setHasTimers(!!(groupedTimers && groupedTimers.length > 0))
      }
    }
    
    checkTimers()

    let interval: NodeJS.Timeout;

    if (isTracking && !isManualMode && !isManualStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const start = timerStart || now;
        const durationInSeconds = Math.floor((now - start) / 1000);
        setDuration(formatDuration(durationInSeconds));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTracking, isManualMode, timerStart, isManualStartTime])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isStartTimeMenuOpen && !(event.target as Element).closest(".duration-menu")) {
        setIsStartTimeMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isStartTimeMenuOpen])

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
                  setSelectedProject(project)
                  updateProject(project)
                }}
              />
              {/* <TagMenu
                tags={tags}
                selectedTag={selectedTag}
                onSelectTag={(tag) => {
                  setSelectedTag(tag)
                  updateTag(tag)
                }}
              /> */}
              <div className="relative">
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => {
                    setIsStartTimeMenuOpen(!isStartTimeMenuOpen);
                    if (!isStartTimeMenuOpen && startTime) {
                      const startDate = new Date(startTime);
                      setManualStartTimeInput(formatTimeForInput(startDate));
                    }
                  }}
                >
                  <div className="w-24 h-10 border rounded-md flex items-center justify-center">
                    {duration || "00:00:00"}
                  </div>
                </div>
                {isTracking && isStartTimeMenuOpen && (
                  <div
                    className="absolute top-full mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 duration-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <Input
                        value={manualStartTimeInput}
                        onChange={handleManualStartTimeChange}
                        onBlur={handleManualStartTimeBlur}
                        onKeyDown={handleManualStartTimeKeyDown}
                        className="w-full px-4 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
              <Toggle aria-label="Toggle billable" pressed={isBillable} onPressedChange={setIsBillable}>
                <DollarSign className="h-4 w-4" />
              </Toggle>
              <Button onClick={handleStartStop}>
                {isTracking ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isTracking ? "Stop" : "Start"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasTimers ? (
        <TimerList 
          ref={timerListRef}
          projects={projects} 
        />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
