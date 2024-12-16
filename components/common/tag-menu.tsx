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

interface Tag {
  id: string | number
  name: string
}

interface TagMenuProps {
  tags: Tag[]
  selectedTag: string
  onSelectTag: (tagId: string) => void
}

export function TagMenu({ tags = [], selectedTag, onSelectTag }: TagMenuProps) {
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
          {selectedTag
            ? tags.find((tag) => tag.id.toString() === selectedTag)?.name
            : "Select Tag"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search tag..." />
          <CommandEmpty>No tag found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => {
                      onSelectTag(tag.id.toString())
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTag === tag.id.toString() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                ))
              ) : (
                <CommandEmpty>No tags found.</CommandEmpty>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}