"use client"

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Project } from "@/app/models/project"

interface ProjectMenuProps {
  projects: Project[]
  selectedProject: string
  onSelectProject: (projectId: string) => void
}

export function ProjectMenu({ projects = [], selectedProject, onSelectProject }: ProjectMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] justify-between"
        >
          {selectedProject
            ? projects.find((project) => project.id.toString() === selectedProject)?.name
            : "Select Project"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search project..." />
          <CommandEmpty>No project found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => {
                      onSelectProject(project.id.toString())
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProject === project.id.toString() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {project.name}
                  </CommandItem>
                ))
              ) : (
                <CommandEmpty>No projects found.</CommandEmpty>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}