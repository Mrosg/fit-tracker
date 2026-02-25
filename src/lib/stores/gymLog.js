import { writable } from 'svelte/store';

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function persist(key, def) {
  const store = writable(load(key, def));
  store.subscribe(v => localStorage.setItem(key, JSON.stringify(v)));
  return store;
}

// Current session inputs
// { SESSION: { exId: [{ kg: string, reps: string }] } }
export const gymCurrentSets = persist('gym_sets_v2', {});

// History of completed sessions (last 20)
// [{ id, date, session, sets: { exId: [{ kg, reps }] } }]
export const gymHistory = persist('gym_history_v1', []);

export function setKg(session, exId, setIdx, val) {
  gymCurrentSets.update(log => {
    const s = { ...(log[session] || {}) };
    const sets = [...(s[exId] || [])];
    sets[setIdx] = { ...(sets[setIdx] || { kg: '', reps: '' }), kg: val };
    return { ...log, [session]: { ...s, [exId]: sets } };
  });
}

export function setReps(session, exId, setIdx, val) {
  gymCurrentSets.update(log => {
    const s = { ...(log[session] || {}) };
    const sets = [...(s[exId] || [])];
    sets[setIdx] = { ...(sets[setIdx] || { kg: '', reps: '' }), reps: val };
    return { ...log, [session]: { ...s, [exId]: sets } };
  });
}

export function saveSession(session, currentSets, date) {
  const d = date || new Date().toISOString().split('T')[0];
  gymHistory.update(h => [
    { id: Date.now(), date: d, session, sets: currentSets },
    ...h.filter(e => !(e.date === d && e.session === session)).slice(0, 99)
  ]);
}

export function clearCurrentSession(session) {
  gymCurrentSets.update(log => ({ ...log, [session]: {} }));
}

export function removeSet(session, exId, setIdx) {
  gymCurrentSets.update(log => {
    const s = { ...(log[session] || {}) };
    const sets = [...(s[exId] || [])];
    sets.splice(setIdx, 1);
    return { ...log, [session]: { ...s, [exId]: sets } };
  });
}

export function addSet(session, exId, routineCount) {
  gymCurrentSets.update(log => {
    const s = { ...(log[session] || {}) };
    const existing = s[exId] || [];
    const needed = Math.max(existing.length, routineCount);
    const base = [
      ...existing,
      ...Array(needed - existing.length).fill(null).map(() => ({ kg: '', reps: '' }))
    ];
    return { ...log, [session]: { ...s, [exId]: [...base, { kg: '', reps: '' }] } };
  });
}
