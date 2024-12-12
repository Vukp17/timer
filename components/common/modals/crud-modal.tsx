import React from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Field {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select'
  options?: { id: string | number, label: string }[] // Updated to support objects
}

interface CrudModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, string>) => void
  title: string
  description: string
  fields: Field[]
  initialData?: Record<string, string>
}

export function CrudModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  fields,
  initialData,
}: CrudModalProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data: Record<string, string> = {}
    fields.forEach((field) => {
      data[field.name] = formData.get(field.name) as string
    })
    onSubmit(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {fields.map((field) => (
              <div key={field.name} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={field.name} className="text-right">
                  {field.label}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    name={field.name}
                    defaultValue={initialData?.[field.name]}
                    className="col-span-3"
                  />
                ) : field.type === 'select' ? (
                  <Select
                    name={field.name}
                    defaultValue={initialData?.[field.name]}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.id} value={option.id.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    name={field.name}
                    defaultValue={initialData?.[field.name]}
                    className="col-span-3"
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}