
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
    console.log(timeString);
    const timeRegex = /^(\d{1,6})$/; // Matches 1 to 6 digits
    const formattedTimeRegex = /^(\d{1,2}):(\d{2})(:(\d{2}))?$/; // Matches HH:MM or HH:MM:SS

    if (timeRegex.test(timeString)) {
        let hours = '00', minutes = '00', seconds = '00';

        switch (timeString.length) {
            case 1:
                // 1 -> 01:00:00
                hours = timeString.padStart(2, '0');
                break;
            case 2:
                // 21 -> 21:00:00
                hours = timeString.padStart(2, '0');
                break;
            case 3:
                // 321 -> 03:21:00
                hours = timeString.slice(0, 1).padStart(2, '0');
                minutes = timeString.slice(1).padStart(2, '0');
                break;
            case 4:
                // 1122 -> 11:22:00
                hours = timeString.slice(0, 2).padStart(2, '0');
                minutes = timeString.slice(2).padStart(2, '0');
                break;
            case 5:
                // 11222 -> 11:22:20
                hours = timeString.slice(0, 2).padStart(2, '0');
                minutes = timeString.slice(2, 4).padStart(2, '0');
                seconds = timeString.slice(4).padStart(2, '0');
                break;
            case 6:
                // 112233 -> 11:22:33
                hours = timeString.slice(0, 2).padStart(2, '0');
                minutes = timeString.slice(2, 4).padStart(2, '0');
                seconds = timeString.slice(4).padStart(2, '0');
                break;
        }
        console.log(`${hours}:${minutes}:${seconds}`);
        return `${hours}:${minutes}:${seconds}`;
    } else if (formattedTimeRegex.test(timeString)) {
        const match = formattedTimeRegex.exec(timeString);
        if (match) {
            const hours = match[1].padStart(2, '0');
            const minutes = match[2].padStart(2, '0');
            const seconds = match[4] ? match[4].padStart(2, '0') : '00';
            console.log(`${hours}:${minutes}:${seconds}`);
            return `${hours}:${minutes}:${seconds}`;
        }
    }
    return null;
}
export function combineDateAndTime(date: Date, timeString: string): Date {
    console.log(timeString,"timeString");
    let timstr = validateAndFormatTime(timeString);
    if (!timstr) {
        throw new Error('Invalid time string');
    }
    const [hours, minutes, seconds] = timstr.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, seconds);

    return newDate;
}

