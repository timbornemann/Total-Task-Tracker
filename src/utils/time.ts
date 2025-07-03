export const formatDuration = (
  minutes: number,
  t: (key: string) => string,
): string => {
  const units = [
    { value: 525600, single: "year", plural: "years" },
    { value: 43200, single: "month", plural: "months" },
    { value: 10080, single: "week", plural: "weeks" },
    { value: 1440, single: "day", plural: "days" },
    { value: 60, single: "hour", plural: "hours" },
    { value: 1, single: "minute", plural: "minutes" },
  ];
  let remaining = Math.floor(minutes);
  const parts: string[] = [];
  for (const u of units) {
    if (remaining >= u.value) {
      const qty = Math.floor(remaining / u.value);
      const key = qty === 1 ? u.single : u.plural;
      parts.push(`${qty} ${t(`timeUnits.${key}`)}`);
      remaining %= u.value;
    }
  }
  return parts.length ? parts.join(", ") : `0 ${t("timeUnits.minutes")}`;
};
