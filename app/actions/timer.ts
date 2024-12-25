import { TimerCreate, Timer, TimerResponse, TimerUpdate } from "../models/timer";

const API_URL = process.env.API_URL || "http://localhost:4000";
const VIEW = '/timer';

export function createStart(data: TimerCreate): Promise<Timer> {
    return fetch(API_URL + VIEW, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to create timer');
            }
            return response.json();
        })
        .catch((error) => {
            console.error('Error creating timer:', error);
            throw error;
        });

}

export function updateOnStopTimer(data: TimerUpdate): Promise<Timer> {
    console.log(data);
    const { id, ...result } = data;
    return fetch(API_URL + VIEW + "/" + data.id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(result),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to update timer');
            }
            return response.json();
        })
        .catch((error) => {
            console.error('Error updating timer:', error);
            throw error;
        });
}

export async function getTimers(page: number, searchQuery?: string, sortField?: string, sortOrder: string = 'asc', numberOfItems: number = 10): Promise<TimerResponse> {
    try {
        const url = new URL(API_URL + VIEW);
        url.searchParams.append('page', page.toString());
        url.searchParams.append('pageSize', numberOfItems.toString());

        if (searchQuery) {
            url.searchParams.append('search', searchQuery);
        }
        if (sortField) {
            url.searchParams.append('sortField', sortField);
            url.searchParams.append('sortOrder', sortOrder);
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (response.status === 401) {
            window.location.href = '/login';
            return { groupedTimers: [], totalCount: 0 };
        }
        if (!response.ok) {
            throw new Error('Failed to fetch client list');
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        return data;
    } catch (error) {
        console.error('Error fetching client list:', error);
        throw error;
    }
}

export async function getRunningTimer(): Promise<Timer> {
    try {
        const url = new URL(API_URL + VIEW + '/running');
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (response.status === 401) {
            window.location.href = '/login';
            return { id: 0, startTime: new Date(), endTime: new Date(), description: '', duration: 0, projectId: 0, tagId: 0 };
        }
        if (!response.ok) {
            throw new Error('Failed to fetch running timer');
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        return data;
    } catch (error) {
        console.error('Error fetching running timer:', error);
        return { id: 0, startTime: new Date(), endTime: new Date(), description: '', duration: 0, projectId: 0, tagId: 0 };
    }
}