import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTimers, updateOnStopTimer } from "@/app/actions/timer";
import { GroupedTimers, Timer } from "@/app/models/timer";
import { Project } from "@/app/models/project";
import { Play, Square, ChevronLeft, ChevronRight, ChevronDown, ChevronRightIcon } from 'lucide-react';
import { ProjectMenu } from "./project-menu";
import { debounce } from "@/utils/debounce";
import { Toaster } from "../ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { convertDurationToMinutes, convertMinutesToDuration, combineDateAndTime, validateAndFormatTime } from "@/utils/time";

export function TimerList({ projects }: { projects: Project[] }) {
  const [timers, setTimers] = useState<GroupedTimers[]>([]);
  const [editingTimerId, setEditingTimerId] = useState<number | null>(null);
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [editedStartTime, setEditedStartTime] = useState<Date | null>(null);
  const [editedEndTime, setEditedEndTime] = useState<Date | null>(null);
  const [editedProjectId, setEditedProjectId] = useState<number | null>(null);
  const [editedDuration, setEditedDuration] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0); // Updated: Start from page 1
  const [totalPages, setTotalPages] = useState<number>(1);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupedTimers, setGroupedTimers] = useState<Record<string, (Timer | Timer[])[]>>({});
  const [currentEditingTimer, setCurrentEditingTimer] = useState<Timer | null>(null);
  const [editedStartTimeString, setEditedStartTimeString] = useState<string>("");
  const [editedEndTimeString, setEditedEndTimeString] = useState<string>("");

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
    // Object.entries(timers).forEach(([date, dateTimers]) => {
    //   grouped[date] = [];
    //   const groupMap: Record<string, Timer[]> = {};
    //   dateTimers.forEach((timer: Timer) => {
    //     const key = `${timer.description}-${timer.project?.id || 'no-project'}`;
    //     if (!groupMap[key]) {
    //       groupMap[key] = [];
    //     }
    //     groupMap[key].push(timer);
    //   });
    //   Object.values(groupMap).forEach(group => {
    //     if (group.length > 1) {
    //       grouped[date].push(group);
    //     } else {
    //       grouped[date].push(group[0]);
    //     }
    //   });
    // });
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

  const handleSave = async (timerId: number, isGrouped: boolean = false, groupTimers: Timer[] = []) => {

    const startTime = editedStartTimeString ? combineDateAndTime(new Date(), editedStartTimeString) : new Date();
    const endTime = editedEndTimeString ? combineDateAndTime(new Date(), editedEndTimeString) : undefined;
    const duration = editedDuration ? convertDurationToMinutes(editedDuration) : undefined;

    const updateData = {
      id: timerId,
      startTime,
      endTime,
      duration,
      project: editedProjectId ? projects.find(project => project.id === editedProjectId) : undefined
    };
    console.log(updateData);
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

  useEffect(() => {
    if (editedProjectId !== null) {
      handleSave(editingTimerId as number);
    }
  }, [editedProjectId]);

  const updateDuration = () => {
    if (editedStartTimeString && editedEndTimeString) {
      const start = new Date(`1970-01-01T${editedStartTimeString}`);
      const end = new Date(`1970-01-01T${editedEndTimeString}`);
      const durationInMinutes = (end.getTime() - start.getTime()) / 60000;
      setEditedDuration(convertMinutesToDuration(durationInMinutes));
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
  const renderTimer = (timer: Timer | Timer[], isGrouped: boolean = false) => {
    const firstTimer = Array.isArray(timer) ? timer[0] : timer;
    const groupTimers = Array.isArray(timer) ? timer : [timer];
    const totalDuration = groupTimers.reduce((sum, t) => sum + (t.duration || 0), 0);




    return (
      <div key={firstTimer.id} className="flex items-center gap-4 flex-wrap mb-2">
        <Input
          value={currentEditingTimer?.id === firstTimer.id ? editedDescription : firstTimer.description ?? ""}
          onChange={(e) => {
            setEditedDescription(e.target.value);
            setCurrentEditingTimer(firstTimer);
            debouncedSave(firstTimer, e.target.value);
          }}
          onFocus={() => {
            setCurrentEditingTimer(firstTimer);
            setEditedDescription(firstTimer.description ?? "");
          }}
          onBlur={() => {
            setCurrentEditingTimer(null);
            handleBlur(firstTimer.id, isGrouped, groupTimers);
          }}
          placeholder="Description"
          className="flex-1 min-w-[150px]"
        />
        <ProjectMenu
          projects={projects}
          selectedProject={isGrouped ? String(firstTimer.project?.id) : (editingTimerId === firstTimer.id ? String(editedProjectId) : String(firstTimer.project?.id))}
          onSelectProject={(projectId) => {
            setEditedProjectId(Number(projectId));
            if (isGrouped) {
              handleSave(firstTimer.id, true, groupTimers);
            } else {
              handleSave(firstTimer.id);
            }
          }}
        />
        <Input
          type="text"
          value={editingTimerId === firstTimer.id ? editedStartTimeString : (firstTimer.startTime ? new Date(firstTimer.startTime).toTimeString().slice(0, 8) : "")}
          onChange={(e) => {
            setEditedStartTimeString(e.target.value); // Allow free typing
          }}
          onFocus={() => {
            setEditingTimerId(firstTimer.id);
            setEditedStartTimeString(firstTimer.startTime ? new Date(firstTimer.startTime).toTimeString().slice(0, 8) : "");
          }}
          onBlur={() => {
            const formattedTime = validateAndFormatTime(editedStartTimeString);
            console.log(formattedTime, editedEndTimeString, "formattedTime");

            if (formattedTime) {
              setEditedStartTimeString(formattedTime);
              updateDuration();
              handleBlur(firstTimer.id, isGrouped, groupTimers);

            }
          }}
          placeholder="00:00:00"
          className="flex-1 min-w-[150px]"
        />

        <Input
          type="text"
          value={editingTimerId === firstTimer.id ? editedEndTimeString : (firstTimer.endTime ? new Date(firstTimer.endTime).toTimeString().slice(0, 8) : "")}
          onChange={(e) => {
            setEditedEndTimeString(e.target.value); // Allow free typing
          }}
          onFocus={() => {
            setEditingTimerId(firstTimer.id);
            setEditedEndTimeString(firstTimer.endTime ? new Date(firstTimer.endTime).toTimeString().slice(0, 8) : "");
          }}
          onBlur={() => {
            const formattedTime = validateAndFormatTime(editedEndTimeString);
            if (formattedTime) {
              console.log(formattedTime, editedEndTimeString, "formattedTime");
              setEditedEndTimeString(formattedTime);
              updateDuration();
              handleBlur(firstTimer.id, isGrouped, groupTimers);

            } else {

            }
          }}
          placeholder="00:00:00"
          className="flex-1 min-w/[150px]"
        />
        <Input
          type="text"
          onChange={(e) => {
            setEditedDuration(e.target.value);
          }}
          value={convertMinutesToDuration(totalDuration)}
          className="flex-1 min-w-[150px]"
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