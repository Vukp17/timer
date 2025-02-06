import { Project, ProjectCreate } from "../models/project";
import api from "@/lib/apiClient";

const VIEW = "/project";

export async function getProjectList(
    page: number,
    searchQuery?: string,
    sortField?: string,
    sortOrder: string = "asc",
    numberOfItems: number = 10
): Promise<Project[]> {
    try {
        const params = {
            page,
            pageSize: numberOfItems,
            ...(searchQuery && { search: searchQuery }),
            ...(sortField && { sortField, sortOrder }),
        };

        return (await api.get<Project[]>(`${VIEW}`, { params })).data;
    } catch (error: any) {
        console.error("Error fetching project list:", error.message);
        throw error;
    }
}

export async function createProject(project: ProjectCreate): Promise<Project> {
    try {
        return (await api.post<Project>(`${VIEW}`, project)).data;
    } catch (error: any) {
        console.error("Error creating project:", error.message);
        throw error;
    }
}

export async function updateProject(project: Project): Promise<Project> {
    try {
        const response = await api.put<Project>(`${VIEW}/${project.id}`, project);
        return response.data;
    } catch (error: any) {
        console.error("Error updating project:", error.message);
        throw error;
    }
}

export async function deleteProject(projectId: number): Promise<void> {
    try {
        await api.delete(`${VIEW}/${projectId}`);
    } catch (error: any) {
        console.error("Error deleting project:", error.message);
        throw error;
    }
}

export async function getAllProjects(): Promise<Project[]> {
    try {
        return (await api.get<Project[]>(`${VIEW}/all`)).data;
    } catch (error: any) {
        console.error("Error fetching all projects:", error.message);
        throw error;
    }
}