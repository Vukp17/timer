// New file for time formatting utilities
export const validateAndFormatTime = (timeString: string): string | null => {
  // Remove any whitespace
  timeString = timeString.trim();

  // Handle empty string
  if (!timeString) {
    return null;
  }

  // Handle "HH:MM" format
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return null;
  }

  // Handle "HHMM" format
  if (/^\d{4}$/.test(timeString)) {
    const hours = parseInt(timeString.slice(0, 2));
    const minutes = parseInt(timeString.slice(2));
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return null;
  }

  return null;
};

export const parseDurationInput = (input: string): number | undefined => {
  // Remove any whitespace
  input = input.trim();
  
  // Handle "2" or "2.5" format (hours)
  if (/^\d+(\.\d+)?$/.test(input)) {
    const hours = parseFloat(input);
    return Math.round(hours * 60);
  }
  
  // Handle "2:30" format
  if (/^\d+:\d{1,2}$/.test(input)) {
    const [hours, minutes] = input.split(':').map(Number);
    return (hours * 60) + minutes;
  }
  
  // Handle "230" format (2 hours 30 minutes)
  if (/^\d{3,4}$/.test(input)) {
    const hours = parseInt(input.slice(0, -2));
    const minutes = parseInt(input.slice(-2));
    if (minutes < 60) {
      return (hours * 60) + minutes;
    }
  }
  
  return undefined;
};

export const formatTimeInput = (timeString: string): string => {
  if (timeString.length <= 2) {
    return `${timeString.padStart(2, '0')}:00`;
  } else if (timeString.length === 3 || timeString.length === 4) {
    const hour = timeString.slice(0, -2).padStart(2, '0');
    const minute = timeString.slice(-2);
    return `${hour}:${minute}`;
  }
  return timeString;
}; 

