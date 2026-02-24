import { writable } from 'svelte/store';

// Seed dates that were previously pre-loaded — wipe them on first load
const SEED_DATES = new Set([
  '2026-02-16','2026-02-17','2026-02-18','2026-02-19',
  '2026-02-20','2026-02-21','2026-02-22','2026-02-23',
  '2026-02-24','2026-02-25','2026-02-26','2026-02-27',
  '2026-02-28','2026-03-01',
]);

function loadFromStorage(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    const parsed = JSON.parse(saved);
    // If every entry is a seed entry, treat as empty (migration)
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every(e => e.date && SEED_DATES.has(e.date))
    ) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    return parsed;
  } catch {
    return defaultValue;
  }
}

function persistentStore(key, defaultValue) {
  const store = writable(loadFromStorage(key, defaultValue));
  store.subscribe(value => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  return store;
}

// Wipe medidas seed (single entry with id:1 / mes:'Marzo 2026')
function loadMedidas() {
  try {
    const saved = localStorage.getItem('medidas_v1');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (
      Array.isArray(parsed) &&
      parsed.length === 1 &&
      parsed[0].id === 1 &&
      parsed[0].mes === 'Marzo 2026'
    ) {
      localStorage.removeItem('medidas_v1');
      return [];
    }
    return parsed;
  } catch { return []; }
}

// Daily tracking log — starts empty, user adds their own data
export const progresoLog = persistentStore('progreso_log_v1', []);

// Body measurements — starts empty, user adds their own data
export const medidas = writable(loadMedidas());
medidas.subscribe(v => localStorage.setItem('medidas_v1', JSON.stringify(v)));

// --- Progreso log actions ---
export function addProgresoEntry(entry) {
  progresoLog.update(log => {
    // Remove existing entry for same date if any
    const filtered = log.filter(e => e.date !== entry.date);
    return [...filtered, { ...entry }].sort((a, b) => a.date.localeCompare(b.date));
  });
}

export function updateProgresoEntry(date, changes) {
  progresoLog.update(log =>
    log.map(e => e.date === date ? { ...e, ...changes } : e)
  );
}

export function removeProgresoEntry(date) {
  progresoLog.update(log => log.filter(e => e.date !== date));
}

// Called from Nutrition: creates or patches the macro fields of an entry for a date
export function upsertProgresoMacros(date, { kcal, protein, carbs, fat, steps }) {
  progresoLog.update(log => {
    const idx = log.findIndex(e => e.date === date);
    if (idx >= 0) {
      const updated = [...log];
      updated[idx] = { ...updated[idx], kcal, protein, carbs, fat, steps };
      return updated;
    }
    return [...log, { date, session: null, kcal, protein, carbs, fat, steps, weight: null }]
      .sort((a, b) => a.date.localeCompare(b.date));
  });
}

// Called from Nutrition when clearing a day
export function clearProgresoMacros(date) {
  progresoLog.update(log => {
    const entry = log.find(e => e.date === date);
    if (!entry) return log;
    // If entry has other non-nutrition data, only null out macros
    if (entry.session || entry.weight) {
      return log.map(e => e.date === date
        ? { ...e, kcal: null, protein: null, carbs: null, fat: null, steps: null }
        : e
      );
    }
    return log.filter(e => e.date !== date);
  });
}

// --- Medidas actions ---
export function addMedida(medida) {
  medidas.update(m => [...m, { id: Date.now(), ...medida }]);
}

export function updateMedida(id, changes) {
  medidas.update(m => m.map(e => e.id === id ? { ...e, ...changes } : e));
}

export function removeMedida(id) {
  medidas.update(m => m.filter(e => e.id !== id));
}

// --- Helpers ---
export function groupByWeek(log) {
  const weeks = {};
  log.forEach(entry => {
    const d = new Date(entry.date + 'T00:00:00');
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon..6=Sun
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const key = monday.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(entry);
  });
  return weeks;
}

export function calcWeekAvg(entries) {
  const valid = entries.filter(e => e.kcal && e.kcal > 0);
  if (valid.length === 0) return null;
  return {
    kcal:    Math.round(valid.reduce((s, e) => s + (e.kcal || 0), 0) / valid.length),
    carbs:   Math.round(valid.reduce((s, e) => s + (e.carbs || 0), 0) / valid.length),
    protein: Math.round(valid.reduce((s, e) => s + (e.protein || 0), 0) / valid.length),
    fat:     Math.round(valid.reduce((s, e) => s + (e.fat || 0), 0) / valid.length),
  };
}
