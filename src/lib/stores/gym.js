import { writable } from 'svelte/store';
import { GYM_SESSIONS, gymSessions as seedSessions } from '../seed-data.js';

export { GYM_SESSIONS };

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

// Routine: keyed by session name (PUSH, LEG1, PULL, LEG2)
export const routine = persistentStore('gym_routine_v2', seedSessions);
export const workoutLog = persistentStore('gym_log', {});
export const selectedSession = writable(GYM_SESSIONS[0]);

export function addExercise(session, exercise) {
  routine.update(r => ({
    ...r,
    [session]: {
      ...r[session],
      exercises: [...r[session].exercises, {
        id: Date.now(),
        weekHistory: ['', '', ''],
        ...exercise
      }]
    }
  }));
}

export function removeExercise(session, exerciseId) {
  routine.update(r => ({
    ...r,
    [session]: {
      ...r[session],
      exercises: r[session].exercises.filter(e => e.id !== exerciseId)
    }
  }));
}

export function updateExercise(session, exerciseId, changes) {
  routine.update(r => ({
    ...r,
    [session]: {
      ...r[session],
      exercises: r[session].exercises.map(e =>
        e.id === exerciseId ? { ...e, ...changes } : e
      )
    }
  }));
}

export function updateWeekHistory(session, exerciseId, weekIndex, value) {
  routine.update(r => ({
    ...r,
    [session]: {
      ...r[session],
      exercises: r[session].exercises.map(e => {
        if (e.id !== exerciseId) return e;
        const weekHistory = [...(e.weekHistory || ['', '', ''])];
        weekHistory[weekIndex] = value;
        return { ...e, weekHistory };
      })
    }
  }));
}

export function updateSessionNotes(session, notes) {
  routine.update(r => ({
    ...r,
    [session]: { ...r[session], notes }
  }));
}
