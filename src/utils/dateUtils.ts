export function getTodayISO(): string {
  const now = new Date();
  return toISODate(now);
}

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Noon to prevent timezone offsets
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function getDayOfWeekIndex(iso: string): number {
  // 0 = Monday, 6 = Sunday (ISO week)
  const d = parseISODate(iso);
  const day = d.getDay(); // 0 is Sunday in JS
  return day === 0 ? 6 : day - 1;
}

export function getMondayOfCurrentWeek(isoDate: string): string {
  const d = parseISODate(isoDate);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // adjust when day is sunday
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

export function getWeekDays(startMondayISO: string): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(startMondayISO, i));
  }
  return days;
}

export function formatDayHeader(iso: string): { weekday: string; dateFormatted: string; isToday: boolean } {
  const d = parseISODate(iso);
  const todayISO = getTodayISO();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return {
    weekday,
    dateFormatted,
    isToday: iso === todayISO
  };
}

export function formatShortDate(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function get4CalendarWeeks(baseDateISO: string = getTodayISO()) {
  const currentMonday = getMondayOfCurrentWeek(baseDateISO);
  const weeks = [];

  for (let w = 0; w < 4; w++) {
    const mondayISO = addDays(currentMonday, w * 7);
    const sundayISO = addDays(mondayISO, 6);
    const days = getWeekDays(mondayISO);

    const mDate = parseISODate(mondayISO);
    const sDate = parseISODate(sundayISO);

    const mLabel = mDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sLabel = sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    weeks.push({
      weekIndex: w + 1,
      startDate: mondayISO,
      endDate: sundayISO,
      label: w === 0 ? `Current Week (${mLabel} – ${sLabel})` : `Week +${w} (${mLabel} – ${sLabel})`,
      shortLabel: `Week ${w + 1}`,
      days
    });
  }

  return weeks;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function calculateDurationHours(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (end < start) end += 24 * 60; // Next day wrap
  const minutes = Math.max(0, end - start);
  return Number((minutes / 60).toFixed(2));
}

export function formatHoursAndMinutes(hours: number): string {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hours24, minutes] = timeStr.split(':').map(Number);
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const mStr = String(minutes).padStart(2, '0');
  return `${hours12}:${mStr} ${period}`;
}
