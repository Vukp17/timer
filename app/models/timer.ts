import { Project } from "./project"
import { Tag } from "./tag"

export interface TimerCreate {
    startTime: Date | string
    endTime?: Date | string | null
    duration?: number | null
    description?: string | null
    projectId?: number | null
    tagId?: number | null
}
export interface Timer {
    projectId?: number
    tagId?: number
    id: number
    startTime?: Date
    endTime?: Date
    duration?: number
    description?: string | null
    project?: Project
    tag?: Tag
}


export interface GroupedTimers {
    date: string;
    timers: Timer[];
  }

export interface TimerResponse {
    groupedTimers: GroupedTimers[];
    totalCount: number;
}
export interface TimerUpdate {
    id: number
    startTime?: Date | string | null
    endTime?: Date | string | null
    duration?: number | null
    description?: string | null
    projectId?: number | null
    tagId?: number | null
}

//weeekly grouped timers
export interface WeeklyGroupedTimers {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  days: GroupedTimers[];
}

export interface WeeklyTimerResponse {
  weeklyTimers: WeeklyGroupedTimers[];
  totalCount: number;
}
