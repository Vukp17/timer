import { Button } from "@/components/ui/button";
import { Play, Square, ChevronDown, ChevronRightIcon } from 'lucide-react';
import { Timer } from "@/app/models/timer";

export function TimerControls({ timer, isGrouped }: { timer: Timer; isGrouped: boolean }) {
  return (
    <>
      {isGrouped ? (
        <Button variant="ghost" size="icon">
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      ) : (
        <Button>
          {timer.endTime ? <Play className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        </Button>
      )}
    </>
  );
}
