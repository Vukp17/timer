import { Project, ProjectCreate } from "../models/project";
const API_URL = process.env.API_URL || "http://localhost:4000";
const VIEW = '/project';


export async function getProjectList(page: number, searchQuery?: string, sortField?: string, sortOrder: string = 'asc', numberOfItems: number = 10) {
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



export async function createProject(project: ProjectCreate) {
    try {
        const response = await fetch("http://localhost:4000/project", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(project),
        });
        if (!response.ok) {
            throw new Error('Failed to create project');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
}
export async function updateProject(project: Project) {
    try {
        const response = await fetch("http://localhost:4000/project/" + project.id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(project),
        });
        if (!response.ok) {
            throw new Error('Failed to update project');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
}
export async function deleteProject(project: Project) {
    try {
        const response = await fetch("http://localhost:4000/project", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(project),
        });
        if (!response.ok) {
            throw new Error('Failed to delete project');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}