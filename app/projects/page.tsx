'use client'

import { SetStateAction, useEffect, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/common/data-table"
import { CrudModal } from "@/components/common/modals/crud-modal"
import { Column } from '@/models/data-table'
import { Layout } from '@/components/common/layout'
import { getProjectList, createProject, updateProject, deleteProject } from '../actions/project';
import { getAll } from '../actions/client';

import { Project, ProjectCreate, ProjectStatus } from '../models/project'
import { Client } from '../models/client'

const projectColumns: Column<Project>[] = [
    { header: 'Name', accessorKey: 'name', sortField: 'name' },
    { header: 'Description', accessorKey: 'description', sortField: 'description' },
    {
        header: 'Client',
        accessorKey: (row) => row.client?.name || 'No Client',
        sortField: 'client.name' // Backend-friendly sort key
    },
    { header: 'Status', accessorKey: 'status', sortField: 'status' },
];



const projectFields = [
    { name: 'name', label: 'Name', type: 'text' as const },
    { name: 'description', label: 'Description', type: 'textarea' as const },
    { name: 'clientId', label: 'Client', type: 'select' as const, options: [] as { id: string | number; label: string }[] },
    { name: 'status', label: 'Status', type: 'select' as const, options: [{ id: 'ACTIVE', label: 'ACTIVE' }, { id: 'INACTIVE', label: 'INACTIVE' }, { id: 'ARCHIVED', label: 'ARCHIVED' }] },
]

export default function ProjectManagement() {
    const [projects, setProjects] = useState<Project[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [currentProject, setCurrentProject] = useState<Project | null>(null)
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>('') // State for search term
    const [sortField, setSortField] = useState<string>('') // State for sort field
    const [sortOrder, setSortOrder] = useState<string>('asc') // State for sort order
    const [page, setPage] = useState<number>(1) // State for page number
    useEffect(() => {
        getProjectList(
            page,
            searchTerm,
            sortField,
            sortOrder,
        ).then((data) => {
            if (data !== undefined) {
                setProjects(data)
            } else {
                setError('Failed to fetch projects')
            }
            setLoading(false)
        }).catch((error: { message: SetStateAction<string | null> }) => {
            setError(error.message)
            setLoading(false)
        })

        getAll().then((data) => {
            if (data !== undefined) {
                setClients(data)
                projectFields.find(field => field.name === 'clientId')!.options = data.map(client => ({ id: client.id, label: client.name }))
            } else {
                setError('Failed to fetch clients')
            }
        }).catch((error: { message: SetStateAction<string | null> }) => {
            setError(error.message)
        })
    }, [])

    const handleCreateProject = async (data: Record<string, string>) => {
        const newProject: ProjectCreate = {
            name: data.name,
            description: data.description,
            clientId: data.clientId ? Number(data.clientId) : undefined,
            status: data.status as ProjectStatus,
        }
        const d = await createProject(newProject)
        setProjects([...projects, d])
        setIsCreateModalOpen(false)
        toast({
            title: "Project Created",
            description: `${newProject.name} has been added to your projects.`,
        })
    }

    const handleEditProject = async (data: Record<string, string>) => {
        if (!currentProject) return
        console.log(data)
        const updatedProject: Project = {
            ...currentProject,
            name: data.name,
            description: data.description,
            clientId: data.clientId ? Number(data.clientId) : undefined,
            status: data.status as ProjectStatus,
        }
        const d = await updateProject(updatedProject)
        setProjects(projects.map(p => p.id === d.id ? d : p))
        setIsEditModalOpen(false)
        toast({
            title: "Project Updated",
            description: `${updatedProject.name} has been updated.`,
        })
    }

    const handleDeleteProject = async () => {
        if (!currentProject) return
        await deleteProject(currentProject)
        setProjects(projects.filter(p => p.id !== currentProject.id))
        setIsDeleteModalOpen(false)
        toast({
            title: "Project Deleted",
            description: `${currentProject.name} has been removed from your projects.`,
            variant: "destructive",
        })
    }
    const handleSearch = (query: string) => {
        setSearchTerm(query); // Update search term state
        getProjectList(page, query).then((data) => {
            if (data !== undefined) {
                setProjects(data)
            } else {
                setError('Failed to fetch projects')
            }
            setLoading(false)
        }).catch((error: { message: SetStateAction<string | null> }) => {
            setError(error.message)
            setLoading(false)
        })

    }
    const handleSort = (column: string, direction: string) => {
        setSortField(column)
        setSortOrder(direction)
        getProjectList(page, searchTerm, column, direction).then((data) => {
            if (data !== undefined) {
                setProjects(data)
            } else {
                setError('Failed to fetch projects')
            }
            setLoading(false)
        }
        ).catch((error: { message: SetStateAction<string | null> }) => {
            setError(error.message)
            setLoading(false)
        })
    }
    const handlePageChange = (page: number) => {
        getProjectList(page, searchTerm, sortField, sortOrder,).then((data) => {
            if (data !== undefined) {
                setProjects(data)
            } else {
                setError('Failed to fetch projects')
            }
            setLoading(false)
        }).catch((error: { message: SetStateAction<string | null> }) => {
            setError(error.message)
            setLoading(false)
        })
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Project Management</h1>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusCircle className="mr-2" />
                    New Project
                </Button>
            </div>

            <DataTable
                data={projects}
                columns={projectColumns}
                onEdit={(project) => {
                    setCurrentProject(project)
                    setIsEditModalOpen(true)
                }}
                onDelete={(project) => {
                    setCurrentProject(project)
                    setIsDeleteModalOpen(true)
                }}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                onSort={handleSort}
            />

            <CrudModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateProject}
                title="Create New Project"
                description="Add a new project to your list. Click save when you're done."
                fields={projectFields}
            />

            <CrudModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditProject}
                title="Edit Project"
                description="Make changes to your project here. Click save when you're done."
                fields={projectFields}
                initialData={currentProject ? {
                    name: currentProject.name,
                    description: currentProject.description || '',
                    status: currentProject.status || 'INACTIVE',
                    clientId: currentProject.clientId ? clients.find(client => client.id === currentProject.clientId)?.id.toString() || '' : '',
                } : undefined}
            />

            <CrudModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onSubmit={handleDeleteProject}
                title="Confirm Deletion"
                description="Are you sure you want to delete this project? This action cannot be undone."
                fields={[]}
            />
        </Layout>
    )
}