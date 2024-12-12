


'use client'

import { SetStateAction, useEffect, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/common/data-table"
import { CrudModal } from "@/components/common/modals/crud-modal"
import { Column } from '@/models/data-table'
import { Layout } from '@/components/common/layout'
import { Client, ClientCreate } from '../models/client'
import { create, getClientList, remove, update } from '../actions/client'




const clientColumns: Column<Client>[] = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Address', accessorKey: 'address' },
]

const clientFields = [
    { name: 'name', label: 'Name', type: 'text' as const },
    { name: 'email', label: 'Email', type: 'text' as const },
    { name: 'phone', label: 'Phone', type: 'text' as const },
    { name: 'address', label: 'Address', type: 'text' as const },
]

export default function ClientManagement() {
    const [clients, setClients] = useState<Client[]>([])
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentClient, setCurrentClient] = useState<Client | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>('') // State for search term
    const [sortField, setSortField] = useState<string>('') // State for sort field
    const [sortOrder, setSortOrder] = useState<string>('asc') // State for sort order
    const [page, setPage] = useState<number>(1) // State for page number
    const { toast } = useToast()

    const handleCreateClient = async (data: Record<string, string>) => {
        const newClient: ClientCreate = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
        }
        const response = await create(newClient);
        setClients([...clients, response])
        setIsCreateModalOpen(false)
        toast({
            title: "Client Created",
            description: `${newClient.name} has been added to your clients.`,
        })
    }
    const handleEditClient = async (data: Record<string, string>) => {
        if (!currentClient) return
        const updatedClient: Client = {
            ...currentClient,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
        }
        const response = await update(updatedClient);
        setClients(clients.map(p => p.id === response.id ? response : p))
        setIsEditModalOpen(false)
        toast({
            title: "Client Updated",
            description: `${updatedClient.name} has been updated.`,
        })
    }
    const handleDeleteClient = async() => {
        if (!currentClient) return
        const response = await remove(currentClient);  
        setClients(clients.filter(p => p.id !== currentClient.id))
        setIsDeleteModalOpen(false)
        toast({
            title: "Client Deleted",
            description: `${currentClient.name} has been deleted.`,
        })
    }
    const handleSearch  = (query: string) => {
        setSearchTerm(query); // Update search term state
        getClientList(page,query).then((data) => {
            if (data !== undefined) {
                setClients(data)
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
        getClientList(page,searchTerm,column,direction).then((data) => {
            if (data !== undefined) {
                setClients(data)
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
        console.log(page)
        getClientList(page,searchTerm,sortField,sortOrder,).then((data) => {
            if (data !== undefined) {
                setClients(data)
            } else {
                setError('Failed to fetch projects')
            }
            setLoading(false)
        }).catch((error: { message: SetStateAction<string | null> }) => {
            setError(error.message)
            setLoading(false)
        })
    }
    useEffect(() => {
        // fetch clients
        getClientList(page,searchTerm,sortField,sortOrder,).then((data) => {
            if (data !== undefined) {
                setClients(data)
            } else {
                setError('Failed to fetch projects')
            }
            setLoading(false)
        }).catch((error: { message: SetStateAction<string | null> }) => {
            setError(error.message)
            setLoading(false)
        })

}
, [])

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
            onSearch={handleSearch}
            onSort={handleSort}
            onPageChange={handlePageChange}

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
                address: currentClient.address,
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


