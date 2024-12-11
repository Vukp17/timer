


'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/common/data-table"
import { CrudModal } from "@/components/common/modals/crud-modal"
import { Column } from '@/models/data-table'
import { Layout } from '@/components/common/layout'


interface Client {
    id: number
    name: string
    email: string
    phone: string
    description: string
    status: 'active' | 'completed' | 'on-hold'
}

const clientColumns: Column<Client>[] = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Description', accessorKey: 'description' },
    { header: 'Status', accessorKey: 'status' },
]

const clientFields = [
    { name: 'name', label: 'Name', type: 'text' as const },
    { name: 'email', label: 'Email', type: 'text' as const },
    { name: 'phone', label: 'Phone', type: 'text' as const },
    { name: 'description', label: 'Description', type: 'textarea' as const },
    { name: 'status', label: 'Status', type: 'select' as const, options: ['active', 'completed', 'on-hold'] },
]

export default function ClientManagement() {
    const [clients, setClients] = useState<Client[]>([
        { id: 1, name: 'John Doe', email: 'john@doe.com', phone: '1234567890', description: 'New client', status: 'active' },
        { id: 2, name: 'Jane Doe', email: '', phone: '1234567890', description: 'New client', status: 'on-hold' },
        { id: 3, name: 'John Smith', email: 'johs', phone: '1234567890', description: 'New client', status: 'completed' },
    ])
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [currentClient, setCurrentClient] = useState<Client | null>(null)
    const { toast } = useToast()

    const handleCreateClient = (data: Record<string, string>) => {
        const newClient: Client = {
            id: clients.length + 1,
            name: data.name,
            email: data.email,
            phone: data.phone,
            description: data.description,
            status: data.status as 'active' | 'completed' | 'on-hold',
        }
        setClients([...clients, newClient])
        setIsCreateModalOpen(false)
        toast({
            title: "Client Created",
            description: `${newClient.name} has been added to your clients.`,
        })
    }
    const handleEditClient = (data: Record<string, string>) => {
        if (!currentClient) return
        const updatedClient: Client = {
            ...currentClient,
            name: data.name,
            email: data.email,
            phone: data.phone,
            description: data.description,
            status: data.status as 'active' | 'completed' | 'on-hold',
        }
        setClients(clients.map(p => p.id === updatedClient.id ? updatedClient : p))
        setIsEditModalOpen(false)
        toast({
            title: "Client Updated",
            description: `${updatedClient.name} has been updated.`,
        })
    }
    const handleDeleteClient = () => {
        if (!currentClient) return
        setClients(clients.filter(p => p.id !== currentClient.id))
        setIsDeleteModalOpen(false)
        toast({
            title: "Client Deleted",
            description: `${currentClient.name} has been deleted.`,
        })
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold">Client Management</h1>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="default">
                    <PlusCircle size={24} className="mr-2" /> New Client
                </Button>
            </div>
            <DataTable
                data={clients}
                columns={clientColumns}
                onEdit={(client) => {
                    setCurrentClient(client)
                    setIsEditModalOpen(true)
                }}
                onDelete={(client) => {
                    setCurrentClient(client)
                    setIsDeleteModalOpen(true)
                }}
            />
            <CrudModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateClient}
                title="Create Client"
                description="Enter the details of the new client."
                fields={clientFields}
            />
            <CrudModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditClient}
                title="Edit Client"
                description="Update the details of the client."
                fields={clientFields}
                initialData={currentClient ? {
                    name: currentClient.name,
                    email: currentClient.email,
                    phone: currentClient.phone,
                    description: currentClient.description,
                    status: currentClient.status,
                } : undefined}
            />
            <CrudModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onSubmit={handleDeleteClient}
                title="Delete Client"
                description="Are you sure you want to delete this client?"
                fields={[]}
            />
        </Layout>
    )

}


