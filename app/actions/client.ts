import { Client, ClientCreate } from "../models/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const VIEW = '/client';

export async function getClientList(searchQuery?: string,sortOrder?:string,sortField?:string): Promise<Client[]> {
    try {
        const url = new URL(API_URL + VIEW);
        if (searchQuery) {
            url.searchParams.append('search', searchQuery);
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
            return [];
        }
        if (!response.ok) {
            throw new Error('Failed to fetch client list');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching client list:', error);
        throw error;
    }
}

export async function create(client: ClientCreate): Promise<Client> {
    try {
        const response = await fetch(API_URL + VIEW, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(client),
        });
        if (response.status === 401) {
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error('Failed to create client');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating client:', error);
        throw error;
    }
}

export async function update(client: Client): Promise<Client> {
    try {
        const response = await fetch(API_URL + VIEW + `/${client.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(client),
        });
        if (response.status === 401) {
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error('Failed to update client');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating client:', error);
        throw error;
    }
}

export async function remove(client: Client): Promise<void> {
    try {
        const response = await fetch(API_URL + VIEW + `/${client.id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (response.status === 401) {
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error('Failed to delete client');
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        throw error;
    }
}