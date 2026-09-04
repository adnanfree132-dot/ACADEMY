/** Parse "09:00 AM", "9:00am", or "14:00" into minutes from midnight. Returns null if unparseable. */
export function timeToMinutes(raw: string): number | null {
  if (!raw) return null;
  const value = String(raw).trim();
  const ampm = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2]);
    const period = ampm[3].toUpperCase();
    if (hours === 12) hours = 0;
    if (period === 'PM') hours += 12;
    return hours * 60 + minutes;
  }
  const twentyFour = value.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    return Number(twentyFour[1]) * 60 + Number(twentyFour[2]);
  }
  return null;
}

export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const a1 = timeToMinutes(startA);
  const a2 = timeToMinutes(endA);
  const b1 = timeToMinutes(startB);
  const b2 = timeToMinutes(endB);
  if (a1 === null || a2 === null || b1 === null || b2 === null) return false;
  if (a2 <= a1 || b2 <= b1) return false;
  return a1 < b2 && b1 < a2;
}
