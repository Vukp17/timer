import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "@/app/models/timer";
import { TimerItem } from "./timer-item";
import { Project } from "@/app/models/project";

export function TimerGroup({ date, entries, projects }: { date: string; entries: Timer[]; projects: Project[] }) {
  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">{date}</h3>
        {entries.map((entry, index) => (
          <TimerItem key={index} timer={entry} projects={projects} />
        ))}
      </CardContent>
    </Card>
  );
}