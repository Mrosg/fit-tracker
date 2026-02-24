import { writable } from 'svelte/store';
import { dietaTargets } from '../seed-data.js';

function loadFromStorage(key, defaultValue) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
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

// Default: ON day targets from DIETA sheet
const defaultGoals = {
  calories: dietaTargets.ON.kcal,
  protein:  dietaTargets.ON.protein,
  carbs:    dietaTargets.ON.carbs,
  fat:      dietaTargets.ON.fat
};

export const macroGoals   = persistentStore('macro_goals_v2', defaultGoals);
export const foodLog      = persistentStore('food_log', {});
export const selectedDate = writable(new Date().toISOString().split('T')[0]);

// DIETA targets exposed for the UI
export { dietaTargets };

export function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export function getDayEntries(log, dateKey) {
  return log[dateKey] || [];
}

export function addFoodEntry(dateKey, food) {
  foodLog.update(log => {
    const dayEntries = log[dateKey] || [];
    return { ...log, [dateKey]: [...dayEntries, { id: Date.now(), ...food }] };
  });
}

export function removeFoodEntry(dateKey, foodId) {
  foodLog.update(log => ({
    ...log,
    [dateKey]: (log[dateKey] || []).filter(f => f.id !== foodId)
  }));
}

export function updateMacroGoals(goals) {
  macroGoals.set(goals);
}

export function applyDietaPreset(type) {
  // type: 'ON' | 'OFF'
  const t = dietaTargets[type];
  macroGoals.set({
    calories: t.kcal,
    protein:  t.protein,
    carbs:    t.carbs,
    fat:      t.fat
  });
}

export function getDayTotals(entries) {
  return entries.reduce(
    (acc, food) => ({
      calories: acc.calories + (Number(food.calories) || 0),
      protein:  acc.protein  + (Number(food.protein)  || 0),
      carbs:    acc.carbs    + (Number(food.carbs)    || 0),
      fat:      acc.fat      + (Number(food.fat)      || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
