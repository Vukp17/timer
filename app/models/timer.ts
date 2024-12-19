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
    id: number
    startTime?: Date
    endTime?: Date
    duration?: number
    description?: string | null
    project?: Project
    tag?: Tag
}


export interface GroupedTimers {
    [key: string]: Timer[];
  }