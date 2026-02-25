import { writable, derived } from 'svelte/store';

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

// Routine: keyed by session name, starts empty
export const routine = persistentStore('gym_routine_v2', {});
// Explicit order array — avoids relying on JS object key ordering across engines
export const sessionsOrder = persistentStore('gym_sessions_order_v1', []);
export const workoutLog = persistentStore('gym_log', {});
export const selectedSession = writable('');

// Migration: if sessionsOrder is empty but routine already has sessions, initialize from object keys
;(function migrate() {
  let r, o;
  const unsubR = routine.subscribe(v => (r = v));
  const unsubO = sessionsOrder.subscribe(v => (o = v));
  unsubR(); unsubO();
  if (o.length === 0 && Object.keys(r).length > 0) {
    sessionsOrder.set(Object.keys(r));
  }
}());

// gymSessions always uses the explicit order array for stable, cross-reload ordering
export const gymSessions = derived([routine, sessionsOrder], ([$r, $o]) => {
  const ordered = $o.filter(name => name in $r);
  const missing = Object.keys($r).filter(k => !$o.includes(k));
  return [...ordered, ...missing];
});

export function createSession(name, emoji = '🏋️') {
  routine.update(r => ({
    ...r,
    [name]: { exercises: [], notes: '', emoji }
  }));
  sessionsOrder.update(o => [...o, name]);
}

export function updateSessionEmoji(name, emoji) {
  routine.update(r => ({
    ...r,
    [name]: { ...r[name], emoji }
  }));
}

export function renameSession(oldName, newName) {
  const trimmed = newName.trim();
  if (!trimmed || oldName === trimmed) return;
  routine.update(r => {
    const entries = Object.entries(r).map(([k, v]) =>
      k === oldName ? [trimmed, v] : [k, v]
    );
    return Object.fromEntries(entries);
  });
  sessionsOrder.update(o => o.map(n => n === oldName ? trimmed : n));
  selectedSession.update(s => s === oldName ? trimmed : s);
}

export function deleteSession(name) {
  routine.update(r => {
    const { [name]: _, ...rest } = r;
    return rest;
  });
  sessionsOrder.update(o => o.filter(n => n !== name));
}

export function addExercise(session, exercise) {
  routine.update(r => ({
    ...r,
    [session]: {
      ...r[session],
      exercises: [...(r[session]?.exercises || []), {
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

export function reorderSessions(fromIndex, toIndex) {
  sessionsOrder.update(o => {
    const arr = [...o];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    return arr;
  });
}

export function reorderExercises(session, fromIndex, toIndex) {
  routine.update(r => {
    const exercises = [...(r[session]?.exercises || [])];
    const [moved] = exercises.splice(fromIndex, 1);
    exercises.splice(toIndex, 0, moved);
    return { ...r, [session]: { ...r[session], exercises } };
  });
}

export function updateSessionNotes(session, notes) {
  routine.update(r => ({
    ...r,
    [session]: { ...r[session], notes }
  }));
}
