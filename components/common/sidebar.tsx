"use client"

import * as React from "react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Settings, ChevronRight, User, Briefcase } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
    { icon: Clock, label: 'Time Tracker', href: '/tracker' },
]

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const pathname = usePathname()

    return (
        <TooltipProvider>
            <div className={cn(
                "relative flex h-screen flex-col border-r bg-gray-100 p-3 transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}>
                <div className="flex h-16 items-center justify-between">
                    {!isCollapsed && <h1 className="text-2xl font-bold">Time track</h1>}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <ChevronRight className={cn(
                            "h-4 w-4 transition-all",
                            isCollapsed && "rotate-180"
                        )} />
                        <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                </div>
                <nav className="flex-1 space-y-2 py-4">
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            asChild
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start",
                                                pathname === item.href && "bg-muted",
                                                isCollapsed && "justify-center"
                                            )}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                                                {!isCollapsed && item.label}
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    {isCollapsed && (
                                        <TooltipContent side="right">
                                            {item.label}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="mt-auto space-y-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start">
                                <User className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                                {!isCollapsed && <span>John Doe</span>}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Billing</DropdownMenuItem>
                            <DropdownMenuItem>Team</DropdownMenuItem>
                            <DropdownMenuItem>Subscription</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Log out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </TooltipProvider>
    )
}
