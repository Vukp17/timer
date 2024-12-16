import { Client } from "./client";

export interface ProjectCreate {

    name: string;
    description?: string;
    clientId?: number;
    status: ProjectStatus;




}
export interface Project {
    id: number;
    name: string;
    description?: string;
    userId?: number;
    clientId?: number;
    createdAt?: Date;
    updatedAt?: Date;
    status?: ProjectStatus; 
    client: Client;
}


export enum ProjectStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    ARCHIVED = 'ARCHIVED',

}