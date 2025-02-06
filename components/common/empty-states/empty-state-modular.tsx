import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    title: string;
    description: string;
    Icon: LucideIcon;
}

export function EmptyStateModular({ title, description, Icon }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <Icon className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-500">{description}</p>
        </div>
    )
}
