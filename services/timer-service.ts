// New file for timer-related operations
import { Timer } from "@/app/models/timer";
import { updateOnStopTimer, getTimers } from "@/app/actions/timer";
import { combineDateAndTime } from "@/utils/time";

interface TimeUpdate {
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export const updateTimerTime = async (
  timer: Timer | { id: number },
  updates: TimeUpdate,
  isGrouped: boolean = false,
  groupTimers: Timer[] = []
): Promise<void> => {
  if (isGrouped) {
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
    // For individual timer updates, we only need the ID
    await updateOnStopTimer({
      id: timer.id,
      ...updates
    });
  }
};

export const updateTimerDuration = async (
  timer: Timer,
  durationMinutes: number
): Promise<void> => {
  if (timer.endTime) {
    if (timer.startTime) {
      // If timer is stopped and has start time, update end time based on duration
      const startDate = new Date(timer.startTime);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      await updateOnStopTimer({
        id: timer.id,
        duration: durationMinutes,
        endTime: endDate
      });
    } else {
      // If timer is stopped but no start time, just update duration
      await updateOnStopTimer({
        id: timer.id,
        duration: durationMinutes
      });
    }
  } else {
    // If timer is running, just update duration without affecting times
    await updateOnStopTimer({
      id: timer.id,
      duration: durationMinutes
    });
  }
};

export const startStopTimer = async (timer: Timer): Promise<void> => {
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
}; 