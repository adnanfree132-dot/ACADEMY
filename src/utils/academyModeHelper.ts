// Academy Mode Helper Utility ('CLASS' vs 'BATCH')
// Allows academies to operate as either Regular Class-Based or Batch-Based

export type AcademyMode = 'CLASS' | 'BATCH';

export function getAcademyMode(): AcademyMode {
  try {
    const mode = localStorage.getItem('academyMode');
    if (mode === 'BATCH') return 'BATCH';
  } catch (err) {}
  return 'CLASS';
}

export function setAcademyMode(mode: AcademyMode): void {
  try {
    localStorage.setItem('academyMode', mode);
  } catch (err) {}
}

export function getUnitSingular(mode: AcademyMode = getAcademyMode()): string {
  return mode === 'CLASS' ? 'Class' : 'Batch';
}

export function getUnitPlural(mode: AcademyMode = getAcademyMode()): string {
  return mode === 'CLASS' ? 'Classes' : 'Batches';
}

export function getUnitCombinedLabel(mode: AcademyMode = getAcademyMode()): string {
  return mode === 'CLASS' ? 'Classes & Sections' : 'Batches & Shifts';
}

export function getUnitHeader(mode: AcademyMode = getAcademyMode()): string {
  return mode === 'CLASS' ? 'GRADE / CLASS' : 'BATCH NAME';
}

export function getFilterLabel(mode: AcademyMode = getAcademyMode()): string {
  return mode === 'CLASS' ? 'All Classes' : 'All Batches';
}
