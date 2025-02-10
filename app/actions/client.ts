import { Client, ClientCreate } from "../models/client";
import api from "@/lib/apiClient";

const VIEW = "/client";

export async function getClientList(
    page: number,
    searchQuery?: string,
    sortField?: string,
    sortOrder: string = "asc",
    numberOfItems: number = 10
): Promise<Client[]> {
    try {
        const params = {
            page,
            pageSize: numberOfItems,
            ...(searchQuery && { search: searchQuery }),
            ...(sortField && { sortField, sortOrder }),
        };
        const { data } = await api.get<Client[]>(`${VIEW}`, { params });
        console.log("Client list:", data);
        return data;
    } catch (error: any) {
        console.error("Error fetching client list:", error.message);
        throw error;
    }
}

export async function create(client: ClientCreate): Promise<Client> {
    try {
        const { data } = await api.post<Client>(`${VIEW}`, client);
        return data;
    } catch (error: any) {
        console.error("Error creating client:", error.message);
        throw error;
    }
}

export async function update(client: Client): Promise<Client> {
    try {
        const { data } = await api.put<Client>(`${VIEW}/${client.id}`, client);
        return data;
    } catch (error: any) {
        console.error("Error updating client:", error.message);
        throw error;
    }
}

export async function remove(clientId: number): Promise<void> {
    try {
        await api.delete(`${VIEW}/${clientId}`);
    } catch (error: any) {
        console.error("Error deleting client:", error.message);
        throw error;
    }
}

export async function getAll(): Promise<Client[]> {
    try {
        const { data } = await api.get<Client[]>(`${VIEW}/all`);
        return data;
    } catch (error: any) {
        console.error("Error fetching all clients:", error.message);
        throw error;
    }

}
