import { useState, useEffect } from "react"
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
import { createStart, updateOnStopTimer, getRunningTimer } from "@/app/actions/timer"
import { toast } from "../ui/use-toast"
import { EmptyState } from "./empty-states/empty-state-timer"

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
  const [hasTimers, setHasTimers] = useState(false)
  const handleManualStartTimeBlur = () => {
    setIsManualStartTime(false) // Resume interval updates
  }

  const handleManualStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualStartTime(true) // Pause interval updates temporarily

    const [hours, minutes] = e.target.value.split(":")
    const updatedStartTime = new Date(timerStart || Date.now())
    updatedStartTime.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10))

    setTimerStart(updatedStartTime.getTime())
    setStartTime(updatedStartTime.toISOString())
    console.log(updatedStartTime, "TEST")

    const durationInSeconds = Math.floor((Date.now() - updatedStartTime.getTime()) / 1000)
    console.log(duration)
    setDuration(formatDuration(durationInSeconds))
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
        id: currentTimerId ? Number.parseInt(currentTimerId) : 0,
        endTime: now,
        duration: isManualMode ? undefined : Number.parseInt(duration),
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
      })
    }
  }
  const updateProject = (projectId: string) => {
    if (isTracking && currentTimerId) {
      updateOnStopTimer({
        id: currentTimerId ? Number.parseInt(currentTimerId) : 0,
        projectId: Number.parseInt(projectId),
      }).then(() => {
        toast({ title: "Success", description: "Timer updated successfully" })
      })
    }
  }
  const updateTag = (tagId: string) => {
    if (isTracking && currentTimerId) {
      updateOnStopTimer({
        id: currentTimerId ? Number.parseInt(currentTimerId) : 0,
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
        id: Number.parseInt(currentTimerId),
        duration: isManualMode ? undefined : Number.parseInt(duration),
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

    const checkRunningTimer = async () => {
      const runningTimer = await getRunningTimer()
      if (runningTimer) {
        console
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
      } else {
        setHasTimers(false)
      }
    }
    checkRunningTimer()

    let interval: NodeJS.Timeout

    if (isTracking && !isManualMode && !isManualStartTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const start = timerStart || now
        const durationInSeconds = Math.floor((now - start) / 1000)
        setDuration(formatDuration(durationInSeconds))
      }, 1000)
    }

    return () => clearInterval(interval)
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
              <TagMenu
                tags={tags}
                selectedTag={selectedTag}
                onSelectTag={(tag) => {
                  setSelectedTag(tag)
                  updateTag(tag)
                }}
              />
              <div className="relative">
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setIsStartTimeMenuOpen(!isStartTimeMenuOpen)}
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
                        type="time"
                        value={startTime ? startTime.split("T")[1].substring(0, 5) : ""}
                        onChange={handleManualStartTimeChange}
                        onBlur={handleManualStartTimeBlur}
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

      {hasTimers ? <TimerList projects={projects} /> : <EmptyState />}
    </div>
  )
}

