
export const convertMinutesToDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  export  const convertDurationToMinutes = (duration: string): number => {
    const [hours, mins, secs] = duration.split(':').map(Number);
    return hours * 60 + mins + secs / 60;
  };