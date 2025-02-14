import { TimerCreate, Timer, TimerResponse, TimerUpdate, WeeklyTimerResponse } from "../models/timer";
import api from "@/lib/apiClient";

const VIEW = '/timer';

export async function createStart(data: TimerCreate): Promise<Timer> {
    try {
        const { data: responseData } = await api.post<Timer>(VIEW, data);
        return responseData;
    } catch (error: any) {
        console.error('Error creating timer:', error.message);
        throw error;
    }
}

export async function updateOnStopTimer(data: TimerUpdate): Promise<Timer> {
    try {
        const { id, ...result } = data;
        const { data: responseData } = await api.put<Timer>(`${VIEW}/${id}`, result);
        return responseData;
    } catch (error: any) {
        console.error('Error updating timer:', error.message);
        throw error;
    }
}

export async function getTimers(
    page: number,
    searchQuery?: string,
    sortField?: string,
    sortOrder: string = 'asc',
    numberOfItems: number = 10
): Promise<TimerResponse> {
    try {
        const params = {
            page,
            pageSize: numberOfItems,
            ...(searchQuery && { search: searchQuery }),
            ...(sortField && { sortField, sortOrder }),
        };

        const { data } = await api.get<TimerResponse>(VIEW, { params });
        return data;
    } catch (error: any) {
        console.error('Error fetching timer list:', error.message);
        throw error;
    }
}

export async function getRunningTimer(): Promise<Timer> {
    try {
        const { data } = await api.get<Timer>(`${VIEW}/running`);
        return data;
    } catch (error: any) {
        console.error('Error fetching running timer:', error.message);
        // Return default timer object on error
        return {
            id: 0,
            startTime: new Date(),
            endTime: new Date(),
            description: '',
            duration: 0,
            projectId: 0,
            tagId: 0
        };
    }
}

export async function getTimersGroupedByWeek(
    page: number,
    pageSize: number,
    sortOrder: string = 'asc',
    sortField: string = 'startTime',
    searchQuery?: string
): Promise<WeeklyTimerResponse> {
    const params = {
        page,
        pageSize,
        sortOrder,
        sortField,
        ...(searchQuery && { search: searchQuery })
    };
    try {
        
        const { data } = await api.get<WeeklyTimerResponse>(VIEW + '/weekly', { params });
        data.weeklyTimers.forEach(week => {
          week.days.forEach(day => {
            day.timers.forEach(timer => {
              timer.startTime = new Date(timer.startTime!); // Convert strings to Dates
              timer.endTime = new Date(timer.endTime!);
            });
          });
        });
        return data;
    } catch (error: any) {
        console.error('Error fetching timer list:', error.message);
        throw error;
    }

}

