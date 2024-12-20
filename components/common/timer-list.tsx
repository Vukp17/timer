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
import { convertDurationToMinutes, convertMinutesToDuration } from "@/utils/time";

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

  const debouncedSave = useCallback(
    debounce(async (timer: Timer, description: string) => {
      await updateOnStopTimer({
        id: timer.id,
        description: description,
        startTime: ""
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
    Object.entries(timers).forEach(([date, dateTimers]) => {
      grouped[date] = [];
      const groupMap: Record<string, Timer[]> = {};
      dateTimers.forEach((timer: Timer) => {
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

  const handleSave = async (timerId: number, isGrouped: boolean = false, groupTimers: Timer[] = []) => {

    const updateData = {
      id: timerId,
      startTime: editedStartTime ? editedStartTime : new Date(),
      endTime: editedEndTime ?? undefined,
      duration: editedDuration ? convertDurationToMinutes(editedDuration) : undefined,
      project: editedProjectId ? projects.find(project => project.id === editedProjectId) : undefined
    };

    if (isGrouped) {
      // Update all timers in the group
      await Promise.all(groupTimers.map(timer =>
        updateOnStopTimer({
          id: timer.id,
          startTime: timer.startTime ?? new Date(),
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
        startTime: editedStartTime ? editedStartTime : new Date(),
        endTime: editedEndTime ?? undefined,
        duration: editedDuration ? convertDurationToMinutes(editedDuration) : undefined,
        projectId: updateData.project?.id,
        tagId: undefined,
        description: editedDescription
      });
    }

    setEditingTimerId(null);
    const { groupedTimers } = await getTimers(currentPage);
    setTimers(groupedTimers);

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
          type="datetime-local"
          value={firstTimer.startTime ? new Date(firstTimer.startTime).toISOString().slice(0, 16) : ""}
          onChange={isGrouped ? undefined : (e) => setEditedStartTime(e.target.value ? new Date(e.target.value) : null)}
          onBlur={() => handleBlur(firstTimer.id, isGrouped, groupTimers)}
          readOnly={isGrouped}
          className="flex-1 min-w-[200px]"
        />
        <Input
          type="datetime-local"
          value={firstTimer.endTime ? new Date(firstTimer.endTime).toISOString().slice(0, 16) : ""}
          onChange={isGrouped ? undefined : (e) => setEditedEndTime(e.target.value ? new Date(e.target.value) : null)}
          onBlur={() => handleBlur(firstTimer.id, isGrouped, groupTimers)}
          readOnly={isGrouped}
          className="flex-1 min-w-[200px]"
        />
        <Input
          type="text"
          value={convertMinutesToDuration(totalDuration)}
          readOnly
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
    </div>
  );
}

