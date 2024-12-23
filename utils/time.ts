
export const convertMinutesToDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const convertDurationToMinutes = (duration: string): number => {
    const [hours, mins, secs] = duration.split(':').map(Number);
    return hours * 60 + mins + secs / 60;
};


export function validateAndFormatTime(timeString: string): string | null {
    const timeRegex = /^(\d{1,6})$/;
    if (timeRegex.test(timeString)) {
        let hours = '00', minutes = '00', seconds = '00';

        if (timeString.length === 2) {
            // 21 -> 21:00:00
            minutes = timeString.padStart(2, '0');
        } else if (timeString.length === 3) {
            // 321 -> 03:21:00
            hours = '0' + timeString[0];
            minutes = timeString.slice(1).padStart(2, '0');
        } else if (timeString.length === 4) {
            // 1122 -> 11:22:00
            hours = timeString.slice(0, 2).padStart(2, '0');
            minutes = timeString.slice(2).padStart(2, '0');
        } else if (timeString.length === 5) {
            // 11222 -> 01:12:22
            hours = '0' + timeString[0];
            minutes = timeString.slice(1, 3).padStart(2, '0');
            seconds = timeString.slice(3).padStart(2, '0');
        } else if (timeString.length === 6) {
            // 112233 -> 11:22:33
            hours = timeString.slice(0, 2).padStart(2, '0');
            minutes = timeString.slice(2, 4).padStart(2, '0');
            seconds = timeString.slice(4).padStart(2, '0');
        }

        return `${hours}:${minutes}:${seconds}`;
    }
    return null;
}
export function combineDateAndTime(date: Date, timeString: string): Date {
    let timstr = validateAndFormatTime(timeString);
    if (!timstr) {
        throw new Error('Invalid time string');
    }
    const [hours, minutes, seconds] = timstr.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, seconds);

    return newDate;
}

