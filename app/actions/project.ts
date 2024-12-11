import { ProjectCreate } from "../models/project";



export async function getProjectList() {
    try {
        const response = await fetch("http://localhost:4000/project", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch project list');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching project list:', error);
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