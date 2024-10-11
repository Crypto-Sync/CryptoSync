export const formatReadableDateOnly = (
  dateString: string,
  timeZone: string = "UTC"
): string => {
  const date = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone, // Ensures it's formatted based on the desired time zone
  };

  return new Intl.DateTimeFormat(undefined, options).format(date);
};

export const formatReadableTimeWithTimeZone = (
  dateString: string,
  timeZone: string = "UTC"
): string => {
  const date = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // For AM/PM format
    timeZone, // Ensures it's formatted based on the desired time zone
    timeZoneName: "short", // Adds the time zone name like 'UTC'
  };

  return new Intl.DateTimeFormat(undefined, options).format(date);
};
