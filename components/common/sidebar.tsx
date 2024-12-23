"use client"

import * as React from "react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, Folder, ChevronRight, User, Briefcase, Hourglass, BarChart2, File, Receipt } from 'lucide-react'

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

const managementNavItems = [
    { icon: Clock, label: 'Time Tracker', href: '/tracker' },
    { icon: Briefcase, label: 'Projects', href: '/projects' },
    { icon: Folder, label: 'Clients', href: '/clients' },
    { icon: Receipt, label: 'Expenses', href: '/expenses' },
]

const analyticsNavItems = [
    { icon: File, label: 'Reports', href: '/reports' },
    { icon: BarChart2, label: 'Analytics', href: '/analytics' },
]

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const pathname = usePathname()

    React.useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed')
        if (savedState !== null) {
            setIsCollapsed(JSON.parse(savedState))
        }
    }, [])

    React.useEffect(() => {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }, [isCollapsed])

    return (
        <TooltipProvider>
            <div className={cn(
                "relative flex h-screen flex-col border-r p-3 transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 -right-4 h-8 w-8 border border-gray-300 bg-white rounded-full shadow"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <ChevronRight className={cn(
                        "h-4 w-4 transition-all",
                        isCollapsed && "rotate-180"
                    )} />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
                <div className="flex items-center mb-8">
                    <Hourglass className="h-8 w-8" />
                    {!isCollapsed && <span className="ml-2 text-xl font-bold">Timer</span>}

                </div>

                <nav className="flex-1 space-y-2 py-4">
                    <div className="space-y-2">
                        <h3 className={cn("text-sm font-semibold", isCollapsed && "sr-only")}>Management</h3>
                        <ul className="space-y-2">
                            {managementNavItems.map((item) => (
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
                                                )}>
                                                <Link href={item.href} className={cn("flex items-center", !isCollapsed ? "justify-start" : "justify-center")}>
                                                    <item.icon className="h-6 w-6 shrink-0" />
                                                    {!isCollapsed && <span className="ml-2">{item.label}</span>}
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
                    </div>
                    <div className="border-t border-gray-200 my-4"></div>
                    <div className="space-y-2">
                        <h3 className={cn("text-sm font-semibold", isCollapsed && "sr-only")}>Analytics</h3>
                        <ul className="space-y-2">
                            {analyticsNavItems.map((item) => (
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
                                                )}>
                                                <Link href={item.href} className={cn("flex items-center", !isCollapsed ? "justify-start" : "justify-center")}>
                                                    <item.icon className="h-6 w-6 shrink-0" />
                                                    {!isCollapsed && <span className="ml-2">{item.label}</span>}
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
                    </div>
                </nav>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="mt-auto space-y-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start">
                                <User className="h-6 w-6" />
                                {!isCollapsed && <span className="ml-2">John Doe</span>}
                                {!isCollapsed && <ChevronRight className="h-6 w-6 ml-auto" />}
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