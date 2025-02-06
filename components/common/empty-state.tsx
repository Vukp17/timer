import { Clock } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Clock className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No timers yet</h3>
      <p className="text-gray-500">Start tracking your time by clicking the Start button above.</p>
    </div>
  )
}

