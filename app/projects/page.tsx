'use client'

import { SetStateAction, useEffect, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/common/data-table"
import { CrudModal } from "@/components/common/modals/crud-modal"
import { Column } from '@/models/data-table'
import { Layout } from '@/components/common/layout'
import { getProjectList,createProject } from '../actions/project';
import { Project, ProjectCreate } from '../models/project'



const projectColumns: Column<Project>[] = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Description', accessorKey: 'description' },
]

const projectFields = [
    { name: 'name', label: 'Name', type: 'text' as const },
    { name: 'description', label: 'Description', type: 'textarea' as const },
    { name: 'client', label: 'Status', type: 'select' as const, options: ['active', 'completed', 'on-hold'] },
]

export default function ProjectManagement() {
    const [projects, setProjects] = useState<Project[]>([
        {
            id: 1, name: 'Website Redesign', description: 'Overhaul of company website',
        },
        {
            id: 2, name: 'Mobile App Development', description: 'Create a new mobile app',
        },
        {
            id: 3, name: 'Database Migration', description: 'Migrate to new database system',
     
        },
    ])
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [currentProject, setCurrentProject] = useState<Project | null>(null)
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const handleCreateProject = async (data: Record<string, string>) => {
        const newProject: ProjectCreate = {
            name: data.name,
            description: data.description,

        }
        const d = await createProject(newProject)
        setProjects([...projects, d])
        setIsCreateModalOpen(false)
        toast({
            title: "Project Created",
            description: `${newProject.name} has been added to your projects.`,
        })
    }

    const handleEditProject = (data: Record<string, string>) => {
        if (!currentProject) return
        const updatedProject: Project = {
            ...currentProject,
            name: data.name,
            description: data.description,
        }
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
        setIsEditModalOpen(false)
        toast({
            title: "Project Updated",
            description: `${updatedProject.name} has been updated.`,
        })
    }

    const handleDeleteProject = () => {
        if (!currentProject) return
        setProjects(projects.filter(p => p.id !== currentProject.id))
        setIsDeleteModalOpen(false)
        toast({
            title: "Project Deleted",
            description: `${currentProject.name} has been removed from your projects.`,
            variant: "destructive",
        })
    }
    useEffect(() => {
        getProjectList().then((data) => {
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

    },
        [])

    return (
        <Layout>
            <div className="container mx-auto py-10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Project Management</h1>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
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
            </div>
        </Layout>

    )
}

