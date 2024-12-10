"use client"

import * as React from "react"
import { DollarSign, Play, Square, Clock, StopCircle } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { ProjectMenu } from "./project-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function TimeTracker() {
  const [description, setDescription] = React.useState("")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [duration, setDuration] = React.useState("")
  const [isBillable, setIsBillable] = React.useState(false)
  const [isTracking, setIsTracking] = React.useState(false)
  const [isManualMode, setIsManualMode] = React.useState(true)
  const [timerStart, setTimerStart] = React.useState<number | null>(null)

  const handleStartStop = () => {
    if (!isTracking) {
      if (isManualMode) {
        setStartTime(new Date().toLocaleTimeString())
      } else {
        setTimerStart(Date.now())
      }
    } else {
      if (isManualMode) {
        setEndTime(new Date().toLocaleTimeString())
      } else {
        const endTime = Date.now()
        const durationInSeconds = Math.floor((endTime - (timerStart || 0)) / 1000)
        setDuration(formatDuration(durationInSeconds))
        setTimerStart(null)
      }
    }
    setIsTracking(!isTracking)
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTracking && !isManualMode) {
      interval = setInterval(() => {
        const now = Date.now()
        const durationInSeconds = Math.floor((now - (timerStart || 0)) / 1000)
        setDuration(formatDuration(durationInSeconds))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, isManualMode, timerStart])

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-grow mr-4"
            />
            <ProjectMenu />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="mode-switch"
                  checked={!isManualMode}
                  onCheckedChange={(checked) => setIsManualMode(!checked)}
                />
                <Label htmlFor="mode-switch">
                  {isManualMode ? <Clock className="h-4 w-4" /> : <StopCircle className="h-4 w-4" />}
                </Label>
              </div>
              <Button onClick={handleStartStop}>
                {isTracking ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isTracking ? "Stop" : "Start"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

