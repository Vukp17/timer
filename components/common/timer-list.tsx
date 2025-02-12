import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTimers, updateOnStopTimer, } from "@/app/actions/timer";
import { GroupedTimers, Timer } from "@/app/models/timer";
import { Project } from "@/app/models/project";
import { Play, Square, ChevronLeft, ChevronRight, ChevronDown, ChevronRightIcon, Trash2 } from 'lucide-react';
import { ProjectMenu } from "./project-menu";
import { debounce } from "@/utils/debounce";
import { Toaster } from "../ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { convertDurationToMinutes, convertMinutesToDuration, combineDateAndTime, validateAndFormatTime } from "@/utils/time";

export function TimerList({ projects }: { projects: Project[] }) {
  const [timers, setTimers] = useState<GroupedTimers[]>([]);
  const [editingTimerId, setEditingTimerId] = useState<number | null>(null);
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [editedProjectId, setEditedProjectId] = useState<number | null>(null);
  const [editedDuration, setEditedDuration] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0); // Updated: Start from page 1
  const [totalPages, setTotalPages] = useState<number>(1);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupedTimers, setGroupedTimers] = useState<Record<string, (Timer | Timer[])[]>>({});
  const [currentEditingTimer, setCurrentEditingTimer] = useState<Timer | null>(null);
  const [editedStartTimeString, setEditedStartTimeString] = useState<string>("");
  const [editedEndTimeString, setEditedEndTimeString] = useState<string>("");
  const [displayStartTime, setDisplayStartTime] = useState<string>("");
  const [displayEndTime, setDisplayEndTime] = useState<string>("");

  const debouncedSave = useCallback(
    debounce(async (timer: Timer, description: string) => {
      await updateOnStopTimer({
        id: timer.id,
        description: description,
        startTime: undefined,
      });
      const { groupedTimers } = await getTimers(currentPage);
      setTimers(groupedTimers);
    }, 500),
    [currentPage]
  );

  useEffect(() => {
    const fetchTimers = async () => {
      const { groupedTimers, totalCount } = await getTimers(currentPage);
      setTimers(groupedTimers);
      setTotalPages(totalCount);
    };
    fetchTimers();
  }, [currentPage]);

  useEffect(() => {
    const grouped: Record<string, (Timer | Timer[])[]> = {};
    console.log(timers, "timers");

    timers.forEach(({ date, timers }) => {
      grouped[date] = [];
      const groupMap: Record<string, Timer[]> = {};
      timers.forEach((timer: Timer) => {
        const key = `${timer.description}-${timer.project?.id || 'no-project'}`;
        if (!groupMap[key]) {
          groupMap[key] = [];
        }
        groupMap[key].push(timer);
      });
      Object.values(groupMap).forEach(group => {
        if (group.length > 1) {
          grouped[date].push(group);
        } else {
          grouped[date].push(group[0]);
        }
      });
    });
    setGroupedTimers(grouped);
  }, [timers]);

  const toggleGroup = (date: string, groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      const fullKey = `${date}-${groupKey}`;
      if (newSet.has(fullKey)) {
        newSet.delete(fullKey);
      } else {
        newSet.add(fullKey);
      }
      return newSet;
    });
  };

  const handleTimeUpdate = async (
    timerId: number,
    isGrouped: boolean,
    groupTimers: Timer[],
    updates: {
      startTime?: Date,
      endTime?: Date,
      duration?: number
    }
  ) => {
    try {
      if (isGrouped) {
        // For grouped timers, update all timers maintaining their relative times
        const firstTimer = groupTimers[0];
        const originalStart = firstTimer.startTime ? new Date(firstTimer.startTime).getTime() : 0;
        const timeShift = updates.startTime ? updates.startTime.getTime() - originalStart : 0;

        await Promise.all(groupTimers.map(timer => {
          const timerStart = timer.startTime ? new Date(timer.startTime).getTime() + timeShift : null;
          const timerEnd = timer.endTime ? new Date(timer.endTime).getTime() + timeShift : null;

          return updateOnStopTimer({
            id: timer.id,
            startTime: timerStart ? new Date(timerStart) : undefined,
            endTime: timerEnd ? new Date(timerEnd) : undefined,
            duration: updates.duration
          });
        }));
      } else {
        // For individual timer
        await updateOnStopTimer({
          id: timerId,
          ...updates
        });
      }

      // Refresh timer list
      const { groupedTimers } = await getTimers(currentPage);
      setTimers(groupedTimers);

      toast({
        title: "Success",
        description: "Timer(s) updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update timer(s)",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (timerId: number, isGrouped: boolean = false, groupTimers: Timer[] = []) => {
    updateDuration();

    const startTime = editedStartTimeString ? combineDateAndTime(new Date(currentEditingTimer?.startTime || Date.now()), editedStartTimeString) : undefined;
    const endTime = editedEndTimeString ? combineDateAndTime(new Date(currentEditingTimer?.endTime || Date.now()), editedEndTimeString) : undefined;
    const duration = editedDuration ? convertDurationToMinutes(editedDuration) : undefined;

    const updateData = {
      id: timerId,
      startTime,
      endTime,
      duration,
      project: editedProjectId ? projects.find(project => project.id === editedProjectId) : undefined
    };
    try {
      if (isGrouped) {
        // Update all timers in the group
        await Promise.all(groupTimers.map(timer =>
          updateOnStopTimer({
            id: timer.id,
            startTime: timer.startTime,
            endTime: timer.endTime,
            duration: timer.duration,
            projectId: updateData.project?.id,
            tagId: undefined,
            description: editedDescription
          })
        ));
      } else {
        await updateOnStopTimer({
          id: timerId,
          startTime: updateData.startTime,
          endTime: updateData.endTime,
          duration: updateData.duration,
          projectId: updateData.project?.id,
          tagId: undefined,
          description: editedDescription
        });
      }

      setEditingTimerId(null);
      const { groupedTimers } = await getTimers(currentPage);
      setTimers(groupedTimers);

      toast({
        title: "Timer updated",
        description: "Your timer has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the timer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateDuration = () => {
    const currentStartTime = currentEditingTimer?.startTime ? new Date(currentEditingTimer.startTime).toISOString().slice(11, 19) : "";
    const currentEndTime = currentEditingTimer?.endTime ? new Date(currentEditingTimer.endTime).toISOString().slice(11, 19) : "";

    const startTimeString = editedStartTimeString || currentStartTime;
    const endTimeString = editedEndTimeString || currentEndTime;

    if (startTimeString && endTimeString) {
      const t1 = validateAndFormatTime(startTimeString);
      const t2 = validateAndFormatTime(endTimeString);
      console.log('T end time', t2)
      console.log('T start time', t1)
      if (t1 && t2) {
        const start = new Date(`1970-01-01T${t1}Z`);
        const end = new Date(`1970-01-01T${t2}Z`);
        const durationInMinutes = (end.getTime() - start.getTime()) / 60000;
        setEditedDuration(convertMinutesToDuration(durationInMinutes));
      } else {
        console.log("Invalid time format");
      }
    }
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
        startTime: timer.startTime ?? new Date(),
        endTime: new Date(),
        duration: undefined
      });
    }
    const { groupedTimers } = await getTimers(currentPage);
    setTimers(groupedTimers);
  };

  const handleBlur = (timerId: number, isGrouped: boolean = false, groupTimers: Timer[] = []) => {
    if (isGrouped) {
      handleSave(timerId, isGrouped, groupTimers);
    } else {
      handleSave(timerId);
    }
  };

  const handleDelete = async (timerId: number, isGrouped: boolean = false, groupTimers: Timer[] = []) => {
    try {
      // if (isGrouped) {
      //   await Promise.all(groupTimers.map(timer => deleteTimer(timer.id)));
      // } else {
      //   await deleteTimer(timerId);
      // }

      const { groupedTimers } = await getTimers(currentPage);
      setTimers(groupedTimers);

      toast({
        title: "Timer deleted",
        description: "Your timer has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the timer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const parseDurationInput = (input: string): number | undefined => {
    // Remove any whitespace
    input = input.trim();
    
    // Handle "2" or "2.5" format (hours)
    if (/^\d+(\.\d+)?$/.test(input)) {
      const hours = parseFloat(input);
      return Math.round(hours * 60);
    }
    
    // Handle "2:30" format
    if (/^\d+:\d{1,2}$/.test(input)) {
      const [hours, minutes] = input.split(':').map(Number);
      return (hours * 60) + minutes;
    }
    
    // Handle "230" format (2 hours 30 minutes)
    if (/^\d{3,4}$/.test(input)) {
      const hours = parseInt(input.slice(0, -2));
      const minutes = parseInt(input.slice(-2));
      if (minutes < 60) {
        return (hours * 60) + minutes;
      }
    }
    
    return undefined;
  };
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>, timer: Timer) => {
    const newDuration = e.target.value;
    setEditedDuration(newDuration);
    setCurrentEditingTimer(timer);
    setEditingTimerId(timer.id);
  };

  const handleDurationBlur = async (timer: Timer) => {
    if (!editedDuration) {
      setEditedDuration("");
      return;
    }

    const durationMinutes = parseDurationInput(editedDuration);
    if (durationMinutes === undefined) {
      setEditedDuration("");
      toast({
        title: "Invalid duration format",
        description: "Please use formats like: 2, 2:30, 230, or 2.5",
        variant: "destructive",
      });
      return;
    }

    try {
      // Only update duration and end time if timer is stopped
      if (timer.endTime) {
        if (timer.startTime) {
          // If timer is stopped and has start time, update end time based on duration
          const startDate = new Date(timer.startTime);
          const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
          await handleTimeUpdate(timer.id, false, [], {
            duration: durationMinutes,
            endTime: endDate
          });
        } else {
          // If timer is stopped but no start time, just update duration
          await handleTimeUpdate(timer.id, false, [], { 
            duration: durationMinutes 
          });
        }
      } else {
        // If timer is running, just update duration without affecting times
        await handleTimeUpdate(timer.id, false, [], { 
          duration: durationMinutes 
        });
      }

      // Only clear states after successful update
      setEditingTimerId(null);
      setCurrentEditingTimer(null);
      setEditedDuration("");
    } catch (error) {
      console.error('Failed to update duration:', error);
      toast({
        title: "Error",
        description: "Failed to update duration",
        variant: "destructive",
      });
    }
  };

  const renderTimer = (timer: Timer | Timer[], isGrouped: boolean = false) => {
    const firstTimer = Array.isArray(timer) ? timer[0] : timer;
    const groupTimers = Array.isArray(timer) ? timer : [timer];

    // Calculate total duration for grouped timers
    const totalDuration = groupTimers.reduce((sum, t) => sum + (t.duration || 0), 0);

    // For grouped timers, find latest start time and oldest end time
    let groupStartTime = "";
    let groupEndTime = "";
    if (isGrouped && groupTimers.length > 0) {
      // Find latest start time
      const latestStart = new Date(Math.max(...groupTimers.map(t =>
        t.startTime ? new Date(t.startTime).getTime() : 0
      )));
      groupStartTime = latestStart.toTimeString().slice(0, 8);

      // Find oldest end time
      const oldestEnd = new Date(Math.min(...groupTimers
        .filter(t => t.endTime) // Only consider timers with end times
        .map(t => new Date(t.endTime!).getTime())
      ));
      groupEndTime = oldestEnd.toTimeString().slice(0, 8);
    }

    const handleGroupDescriptionChange = async (description: string) => {
      if (isGrouped) {
        // Update all timers in the group with the new description
        try {
          await Promise.all(groupTimers.map(timer =>
            updateOnStopTimer({
              id: timer.id,
              description: description,
            })
          ));

          // Refresh the timer list
          const { groupedTimers } = await getTimers(currentPage);
          setTimers(groupedTimers);

          toast({
            title: "Success",
            description: "All timers in group updated successfully",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update timers in group",
            variant: "destructive",
          });
        }
      }
    };

    const handleGroupProjectChange = async (projectId: string) => {
      if (isGrouped) {
        try {
          await Promise.all(groupTimers.map(timer =>
            updateOnStopTimer({
              id: timer.id,
              projectId: Number(projectId),
            })
          ));

          // Refresh the timer list
          const { groupedTimers } = await getTimers(currentPage);
          setTimers(groupedTimers);

          toast({
            title: "Success",
            description: "Project updated for all timers in group",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update project for timers in group",
            variant: "destructive",
          });
        }
      }
    };

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>, timer: Timer) => {
      if (isGrouped) return;

      let newStartTime = e.target.value;
      setEditedStartTimeString(newStartTime);
      setDisplayStartTime(newStartTime);
      setCurrentEditingTimer(timer);
      setEditingTimerId(timer.id);
    };

    const handleStartTimeBlur = async (timer: Timer) => {
      if (!editedStartTimeString) {
        setDisplayStartTime("");
        setEditedStartTimeString("");
        return;
      }

      // Handle different time formats
      let formattedTime = editedStartTimeString;
      if (editedStartTimeString.length <= 2) {
        formattedTime = `${editedStartTimeString.padStart(2, '0')}:00`;
      } else if (editedStartTimeString.length === 3 || editedStartTimeString.length === 4) {
        const hour = editedStartTimeString.slice(0, -2).padStart(2, '0');
        const minute = editedStartTimeString.slice(-2);
        formattedTime = `${hour}:${minute}`;
      }

      const validTime = validateAndFormatTime(formattedTime);
      if (!validTime) {
        setDisplayStartTime("");
        setEditedStartTimeString("");
        return;
      }

      try {
        const startDate = combineDateAndTime(
          new Date(timer.startTime || Date.now()),
          validTime
        );

        // If we have duration, update end time based on new start time
        if (timer.duration) {
          const endDate = new Date(startDate.getTime() + timer.duration * 60000);
          await handleTimeUpdate(timer.id, false, [], {
            startTime: startDate,
            endTime: endDate
          });
        } else {
          await handleTimeUpdate(timer.id, false, [], { startTime: startDate });
        }

        // Clear states only after successful update
        setEditingTimerId(null);
        setCurrentEditingTimer(null);
        setEditedStartTimeString("");
        setDisplayStartTime("");
      } catch (error) {
        console.error('Failed to update start time:', error);
      }
    };

    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>, timer: Timer) => {
      if (isGrouped) return;

      let newEndTime = e.target.value;
      setEditedEndTimeString(newEndTime);
      setDisplayEndTime(newEndTime);
      setCurrentEditingTimer(timer);
      setEditingTimerId(timer.id);
    };

    const handleEndTimeBlur = async (timer: Timer) => {
      if (!editedEndTimeString) {
        setDisplayEndTime("");
        return;
      }

      // Handle different time formats
      let formattedTime = editedEndTimeString;
      if (editedEndTimeString.length <= 2) {
        formattedTime = `${editedEndTimeString.padStart(2, '0')}:00`;
      } else if (editedEndTimeString.length === 3 || editedEndTimeString.length === 4) {
        const hour = editedEndTimeString.slice(0, -2).padStart(2, '0');
        const minute = editedEndTimeString.slice(-2);
        formattedTime = `${hour}:${minute}`;
      }

      const validTime = validateAndFormatTime(formattedTime);
      if (!validTime) {
        setDisplayEndTime("");
        return;
      }

      const endDate = combineDateAndTime(
        new Date(timer.endTime || Date.now()),
        validTime
      );

      try {
        // Calculate new duration if we have a start time
        if (timer.startTime) {
          const durationInMinutes = Math.floor(
            (endDate.getTime() - new Date(timer.startTime).getTime()) / 60000
          );
          await handleTimeUpdate(timer.id, false, [], {
            endTime: endDate,
            duration: durationInMinutes
          });
        } else {
          await handleTimeUpdate(timer.id, false, [], { endTime: endDate });
        }

        // Only clear the display values after successful update
        setEditingTimerId(null);
        setCurrentEditingTimer(null);
        setEditedEndTimeString("");
        setDisplayEndTime("");
      } catch (error) {
        // In case of error, maintain the display value
        console.error('Failed to update end time:', error);
      }
    };

    return (
      <div key={firstTimer.id} className="flex items-center gap-4 flex-wrap mb-2">
        <Input
          value={
            currentEditingTimer?.id === firstTimer.id && editedDescription !== ""
              ? editedDescription
              : firstTimer.description ?? ""
          }
          onChange={(e) => {
            setEditedDescription(e.target.value);
            setCurrentEditingTimer(firstTimer);
            if (isGrouped) {
              handleGroupDescriptionChange(e.target.value);
            } else {
              debouncedSave(firstTimer, e.target.value);
            }
          }}
          onFocus={() => {
            setCurrentEditingTimer(firstTimer);
            setEditedDescription(firstTimer.description ?? "");
          }}
          onBlur={() => {
            if (!isGrouped) {
              handleBlur(firstTimer.id, isGrouped, groupTimers);
            }
          }}
          placeholder="Description"
          className="flex-1 min-w-[150px]"
        />
        <ProjectMenu
          projects={projects}
          selectedProject={
            isGrouped
              ? String(firstTimer.project?.id)
              : String(firstTimer.project?.id)
          }
          onSelectProject={async (projectId) => {
            setEditedProjectId(Number(projectId));
            if (isGrouped) {
              await handleGroupProjectChange(projectId);
            } else {
              await handleSave(firstTimer.id);
            }
          }}
        />
        <Input
          type="text"
          value={
            isGrouped
              ? groupStartTime
              : (editingTimerId === firstTimer.id && displayStartTime !== "")
                ? displayStartTime
                : firstTimer.startTime
                  ? new Date(firstTimer.startTime).toTimeString().slice(0, 8)
                  : ""
          }
          onChange={(e) => handleStartTimeChange(e, firstTimer)}
          onFocus={(e) => {
            const currentValue = firstTimer.startTime
              ? new Date(firstTimer.startTime).toTimeString().slice(0, 8)
              : "";
            setDisplayStartTime(currentValue);
            setEditedStartTimeString(currentValue);
            setCurrentEditingTimer(firstTimer);
            setEditingTimerId(firstTimer.id);
          }}
          onBlur={() => handleStartTimeBlur(firstTimer)}
          disabled={isGrouped}
          placeholder="00:00:00"
          className="flex-1 min-w-[150px]"
        />

        <Input
          type="text"
          value={
            isGrouped
              ? groupEndTime
              : (editingTimerId === firstTimer.id && displayEndTime !== "")
                ? displayEndTime
                : firstTimer.endTime
                  ? new Date(firstTimer.endTime).toTimeString().slice(0, 8)
                  : ""
          }
          onChange={(e) => handleEndTimeChange(e, firstTimer)}
          onFocus={(e) => {
            const currentValue = firstTimer.endTime
              ? new Date(firstTimer.endTime).toTimeString().slice(0, 8)
              : "";
            setDisplayEndTime(currentValue);
            setEditedEndTimeString(currentValue);
            setCurrentEditingTimer(firstTimer);
            setEditingTimerId(firstTimer.id);
          }}
          onBlur={() => handleEndTimeBlur(firstTimer)}
          disabled={isGrouped}
          placeholder="00:00:00"
          className="flex-1 min-w-[150px]"
        />

        <Input
          type="text"
          value={
            editingTimerId === firstTimer.id && editedDuration !== ""
              ? editedDuration
              : convertMinutesToDuration(isGrouped ? totalDuration : (firstTimer.duration || 0))
          }
          onChange={(e) => handleDurationChange(e, firstTimer)}
          onFocus={(e) => {
            const currentValue = firstTimer.duration
              ? convertMinutesToDuration(firstTimer.duration)
              : "";
            setEditedDuration(currentValue);
            setCurrentEditingTimer(firstTimer);
            setEditingTimerId(firstTimer.id);
          }}
          onBlur={() => handleDurationBlur(firstTimer)}
          disabled={isGrouped}
          className="flex-1 min-w-[150px]"
          placeholder="2, 2:30, 230, 2.5"
        />

        {isGrouped ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleGroup(firstTimer.startTime?.toString() || "", firstTimer.id.toString())}
          >
            {expandedGroups.has(`${firstTimer.startTime?.toString() || ""}-${firstTimer.id}`) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button onClick={() => handleStartStop(firstTimer)}>
            {firstTimer.endTime ? <Play className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full mt-4">
      {Object.entries(groupedTimers).map(([date, dateEntries]) => (
        <Card key={date} className="mb-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{date}</h3>
            {dateEntries.map((entry, index) => {
              const isGrouped = Array.isArray(entry);
              return (
                <div key={isGrouped ? `group-${index}` : entry.id}>
                  {renderTimer(entry, isGrouped)}
                  {isGrouped && expandedGroups.has(`${entry[0].startTime?.toString() || ""}-${entry[0].id}`) && (
                    <div className="ml-6 mt-2">
                      {entry.slice(1).map(timer => renderTimer(timer))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end items-center mt-4 space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Toaster />
    </div>
  );
}

