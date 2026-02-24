import { writable } from 'svelte/store';

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}

function persist(key, def) {
  const store = writable(load(key, def));
  store.subscribe(v => localStorage.setItem(key, JSON.stringify(v)));
  return store;
}

// { 'YYYY-MM-DD': { protein, carbs, fat, steps } }
// kcal is computed on the fly: carbs*4 + protein*4 + fat*9
export const dailyMacros = persist('daily_macros_v1', {});

export function computeKcal(carbs, protein, fat) {
  const c = Number(carbs) || 0;
  const p = Number(protein) || 0;
  const f = Number(fat) || 0;
  return c * 4 + p * 4 + f * 9;
}

export function setDayMacros(dateKey, macros) {
  dailyMacros.update(log => ({ ...log, [dateKey]: { ...macros } }));
}

export function clearDayMacros(dateKey) {
  dailyMacros.update(log => {
    const next = { ...log };
    delete next[dateKey];
    return next;
  });
}

// Returns the 7 dates of the week containing the given date (Mon–Sun)
export function getWeekDates(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x.toISOString().split('T')[0];
  });
}

export const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const DAY_SHORT  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function todayKey() {
  return new Date().toISOString().split('T')[0];
}
