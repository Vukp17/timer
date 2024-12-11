export interface ProjectCreate {

    name: string;
    description?: string;
    clientId?: number;




}
export interface Project {
    id: number;
    name: string;
    description?: string;
    userId?: number;
    clientId?: number;
    createdAt?: Date;
    updatedAt?: Date;
}