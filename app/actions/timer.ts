import { TimerCreate, Timer } from "../models/timer";

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

export function updateOnStopTimer(data: Timer): Promise<Timer> {
    return fetch(API_URL + VIEW + "/" + data.id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
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