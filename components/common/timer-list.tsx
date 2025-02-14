import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTimers, updateOnStopTimer, getTimersGroupedByWeek } from "@/app/actions/timer";
import { GroupedTimers, Timer, WeeklyGroupedTimers } from "@/app/models/timer";
import { Project } from "@/app/models/project";
import { Play, Square, ChevronLeft, ChevronRight, ChevronDown, ChevronRightIcon, Trash2 } from 'lucide-react';
import { ProjectMenu } from "./project-menu";
import { debounce } from "@/utils/debounce";
import { Toaster } from "../ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { convertDurationToMinutes, convertMinutesToDuration, combineDateAndTime, validateAndFormatTime } from "@/utils/time";
import { parseDurationInput, formatTimeInput } from "@/utils/time-formatter";
import { updateTimerTime, updateTimerDuration, startStopTimer } from "@/services/timer-service";

const calculateTotalHours = (timers: Timer[]): string => {
  const totalMinutes = timers.reduce((sum, timer) => sum + (timer.duration || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export const TimerList = forwardRef<TimerListHandle, { projects: Project[] }>(
  function TimerList({ projects }, ref) {
    const [timers, setTimers] = useState<WeeklyGroupedTimers[]>([]);
    const [editingTimerId, setEditingTimerId] = useState<number | null>(null);
    const [editedDescription, setEditedDescription] = useState<string>("");
    const [editedProjectId, setEditedProjectId] = useState<number | null>(null);
    const [editedDuration, setEditedDuration] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [groupedTimers, setGroupedTimers] = useState<Record<string, (Timer | Timer[])[]>>({});
    const [currentEditingTimer, setCurrentEditingTimer] = useState<Timer | null>(null);
    const [editedStartTimeString, setEditedStartTimeString] = useState<string>("");
    const [editedEndTimeString, setEditedEndTimeString] = useState<string>("");
    const [displayStartTime, setDisplayStartTime] = useState<string>("");
    const [displayEndTime, setDisplayEndTime] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const debouncedSave = useCallback(
      debounce(async (timer: Timer, description: string) => {
        await updateOnStopTimer({
          id: timer.id,
          description: description,
          startTime: undefined,
        });
        const { weeklyTimers } = await getTimersGroupedByWeek(currentPage, 10, "desc", "startTime");
        setTimers(weeklyTimers.map(weekGroup => ({
          weekStart: weekGroup.weekStart,
          weekEnd: weekGroup.weekEnd,
          totalHours: weekGroup.totalHours,
          days: weekGroup.days
        })));
      }, 500),
      [currentPage]
    );

    const refreshTimers = useCallback(async () => {
       try {
        setIsLoading(true);
        const res  =  getTimers(currentPage, '', "startTime", "desc", 10);
        console.log('res', res)
        const response = await getTimersGroupedByWeek(
          currentPage,
          10,
          "desc",
          "startTime"
        );
        if(response.weeklyTimers.length > 0) {
          setTimers(response.weeklyTimers);
        }
        // Set timers even if empty
        setTimers(response.weeklyTimers);

        // Handle pagination only if there are records
        if (response.totalCount > 0) {
          const calculatedTotalPages = Math.ceil(response.totalCount / 10);
          setTotalPages(calculatedTotalPages);

          if (currentPage >= calculatedTotalPages) {
            setCurrentPage(calculatedTotalPages - 1);
          }
        } else {
          setTotalPages(1);
          setCurrentPage(0);
        }
      
      } catch (error) {
        console.error('Error details:', error);
        toast({
          title: "Error",
          description: "Failed to load timers",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
      refreshTimers();
    }, [refreshTimers]);

    useEffect(() => {
      const grouped: Record<string, (Timer | Timer[])[]> = {};
      
      // No need to sort timers since they're already grouped by week
      timers.forEach((weekGroup) => {
        weekGroup.days.forEach(({ date, timers: dateTimers }) => {
          grouped[date] = [];
          const groupMap: Record<string, Timer[]> = {};

          const sortedTimers = [...dateTimers].sort((a, b) => {
            const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
            const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
            return timeB - timeA;
          });

          sortedTimers.forEach((timer: Timer) => {
            const key = `${timer.description}-${timer.project?.id || 'no-project'}`;
            if (!groupMap[key]) {
              groupMap[key] = [];
            }
            groupMap[key].push(timer);
          });

          const sortedGroups = Object.values(groupMap).map(group => {
            return group.sort((a, b) => {
              const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
              const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
              return bTime - aTime;
            });
          });

          const sortedEntries = sortedGroups.sort((a, b) => {
            const aLatestTime = Math.max(...a.map(t => t.startTime ? new Date(t.startTime).getTime() : 0));
            const bLatestTime = Math.max(...b.map(t => t.startTime ? new Date(t.startTime).getTime() : 0));
            return bLatestTime - aLatestTime;
          });

          sortedEntries.forEach(group => {
            if (group.length > 1) {
              grouped[date].push(group);
            } else {
              grouped[date].push(group[0]);
            }
          });
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
        const timer = isGrouped
          ? groupTimers.find(t => t.id === timerId) || groupTimers[0]
          : { id: timerId };

        await updateTimerTime(timer as Timer, updates, isGrouped, groupTimers);

        const { weeklyTimers } = await getTimersGroupedByWeek(currentPage, 10, "desc", "startTime");
        setTimers(weeklyTimers.map(weekGroup => ({
          weekStart: weekGroup.weekStart,
          weekEnd: weekGroup.weekEnd,
          totalHours: weekGroup.totalHours,
          days: weekGroup.days
        })));

        toast({
          title: "Success",
          description: "Timer(s) updated successfully",
        });
      } catch (error) {
        console.error('Failed to update timer(s):', error);
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
        const { weeklyTimers } = await getTimersGroupedByWeek(currentPage, 10, "desc", "startTime");
        setTimers(weeklyTimers.map(weekGroup => ({
          weekStart: weekGroup.weekStart,
          weekEnd: weekGroup.weekEnd,
          totalHours: weekGroup.totalHours,
          days: weekGroup.days
        })));

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
      try {
        await startStopTimer(timer);
        const { weeklyTimers } = await getTimersGroupedByWeek(currentPage, 10, "desc", "startTime");
        setTimers(weeklyTimers.map(weekGroup => ({
          weekStart: weekGroup.weekStart,
          weekEnd: weekGroup.weekEnd,
          totalHours: weekGroup.totalHours,
          days: weekGroup.days
        })));
      } catch (error) {
        console.error('Failed to start/stop timer:', error);
        toast({
          title: "Error",
          description: "Failed to start/stop timer",
          variant: "destructive",
        });
      }
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
        const { weeklyTimers } = await getTimersGroupedByWeek(currentPage, 10, "desc", "startTime");
        setTimers(weeklyTimers.map(weekGroup => ({
          weekStart: weekGroup.weekStart,
          weekEnd: weekGroup.weekEnd,
          totalHours: weekGroup.totalHours,
          days: weekGroup.days
        })));

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
        await updateTimerDuration(timer, durationMinutes);

        const { weeklyTimers } = await getTimersGroupedByWeek(currentPage, 10, "desc", "startTime");
        setTimers(weeklyTimers.map(weekGroup => ({
          weekStart: weekGroup.weekStart,
          weekEnd: weekGroup.weekEnd,
          totalHours: weekGroup.totalHours,
          days: weekGroup.days
        })));

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

      const totalDuration = groupTimers.reduce((sum, t) => sum + (t.duration || 0), 0);

      let groupStartTime = "";
      let groupEndTime = "";
      if (isGrouped && groupTimers.length > 0) {
        const latestStart = new Date(Math.max(...groupTimers.map(t =>
          t.startTime ? new Date(t.startTime).getTime() : 0
        )));
        groupStartTime = latestStart.toTimeString().slice(0, 8);

        const oldestEnd = new Date(Math.min(...groupTimers
          .filter(t => t.endTime)
          .map(t => new Date(t.endTime!).getTime())
        ));
        groupEndTime = oldestEnd.toTimeString().slice(0, 8);
      }

      const handleGroupDescriptionChange = async (description: string, groupTimers: Timer[]) => {
        try {
          await Promise.all(groupTimers.map(timer =>
            updateOnStopTimer({
              id: timer.id,
              description: description,
            })
          ));

          const { weeklyTimers } = await getTimersGroupedByWeek(currentPage, 10, "desc", "startTime");
          setTimers(weeklyTimers.map(weekGroup => ({
            weekStart: weekGroup.weekStart,
            weekEnd: weekGroup.weekEnd,
            totalHours: weekGroup.totalHours,
            days: weekGroup.days
          })));

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
      };

      const handleGroupProjectChange = async (projectId: string, groupTimers: Timer[]) => {
        try {
          await Promise.all(groupTimers.map(timer =>
            updateOnStopTimer({
              id: timer.id,
              projectId: Number(projectId),
            })
          ));

          const { weeklyTimers } = await getTimersGroupedByWeek(currentPage, 10, "desc", "startTime");
          setTimers(weeklyTimers.map(weekGroup => ({
            weekStart: weekGroup.weekStart,
            weekEnd: weekGroup.weekEnd,
            totalHours: weekGroup.totalHours,
            days: weekGroup.days
          })));

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

          if (timer.duration) {
            const endDate = new Date(startDate.getTime() + timer.duration * 60000);
            await handleTimeUpdate(timer.id, false, [], {
              startTime: startDate,
              endTime: endDate
            });
          } else {
            await handleTimeUpdate(timer.id, false, [], { startTime: startDate });
          }

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

          setEditingTimerId(null);
          setCurrentEditingTimer(null);
          setEditedEndTimeString("");
          setDisplayEndTime("");
        } catch (error) {
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
                handleGroupDescriptionChange(e.target.value, groupTimers);
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
                await handleGroupProjectChange(projectId, groupTimers);
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

    useImperativeHandle(ref, () => ({
      refreshTimers
    }));

    const renderPagination = () => {
      if (!totalPages || totalPages <= 1) return null;

      return (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
            disabled={currentPage <= 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant={currentPage === 0 ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage(0)}
              disabled={isLoading}
            >
              1
            </Button>

            {currentPage > 2 && <span>...</span>}

            {Array.from({ length: 3 }, (_, i) => currentPage + i - 1)
              .filter(page => page > 0 && page < totalPages - 1)
              .map(page => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  disabled={isLoading}
                >
                  {page + 1}
                </Button>
              ))}

            {currentPage < totalPages - 3 && <span>...</span>}

            {totalPages > 1 && (
              <Button
                variant={currentPage === totalPages - 1 ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={isLoading}
              >
                {totalPages}
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPage >= totalPages - 1 || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      );
    };

    return (
      <div className="w-full mt-4">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <>
            {timers.map((weekGroup: WeeklyGroupedTimers) => (
              <div key={weekGroup.weekStart} className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    Week of {new Date(weekGroup.weekStart).toLocaleDateString()}
                  </h2>
                  <div className="text-lg font-semibold text-gray-600">
                    Total: {weekGroup.totalHours}h
                  </div>
                </div>

                {weekGroup.days.map((day) => (
                  <Card key={day.date} className="mb-4">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{day.date}</h3>
                        <div className="text-sm text-gray-600">
                          {calculateTotalHours(day.timers)}
                        </div>
                      </div>
                      {day.timers.map((entry, index) => {
                        const isGrouped = Array.isArray(entry);
                        return (
                          <div key={isGrouped ? `group-${index}` : entry.id}>
                            {renderTimer(entry, isGrouped)}
                            {isGrouped &&
                              expandedGroups.has(`${entry[0].startTime?.toString() || ""}-${entry[0].id}`) && (
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
              </div>
            ))}
            {renderPagination()}
          </>
        )}
        <Toaster />
      </div>
    );
  }
);

export type TimerListHandle = {
  refreshTimers: () => Promise<void>;
};

