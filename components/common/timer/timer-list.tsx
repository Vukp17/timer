import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getTimers } from "@/app/actions/timer";
import { GroupedTimers } from "@/app/models/timer";
import { Project } from "@/app/models/project";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";
import { TimerGroup } from "./timer-group";

export function TimerList({ projects }: { projects: Project[] }) {
    const [timers, setTimers] = useState<GroupedTimers[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    useEffect(() => {
        const fetchTimers = async () => {
            const { groupedTimers, totalCount } = await getTimers(currentPage);
            console.log("Grouped timers", groupedTimers);
            setTimers(Array.isArray(groupedTimers) ? groupedTimers : []);
            setTotalPages(totalCount);
        };
        fetchTimers();
    }, [currentPage]);

    return (
        <div className="w-full mt-4">
            {timers.map((groupedTimer) => (
    
                <TimerGroup key={groupedTimer.date.toString()} date={groupedTimer.date.toString()} entries={groupedTimer.entries} projects={projects} />
            ))}

            <div className="flex justify-end items-center mt-4 space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <Toaster />
        </div>
    );
} 