import { supabase } from './supabase.js';

const STORAGE_KEYS = [
  'macro_targets_v1',
  'gym_routine_v2',
  'gym_log',
  'gym_sets_v2',
  'gym_history_v1',
  'progreso_log_v1',
  'medidas_v1',
  'daily_macros_v1',
  'food_log',
  'macro_goals_v2',
];

// ── Local backup ─────────────────────────────────────────────────────────────

export function exportAllData() {
  const data = { _version: 1, _exported: new Date().toISOString() };
  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    } catch {}
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function resetAllData() {
  for (const key of STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function importAllData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data._version) throw new Error('Archivo no válido');
        let count = 0;
        for (const key of STORAGE_KEYS) {
          if (data[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            count++;
          }
        }
        resolve(count);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsText(file);
  });
}

// ── Supabase sync ─────────────────────────────────────────────────────────────

function collectLocalData() {
  const data = {};
  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    } catch {}
  }
  return data;
}

export async function pushToSupabase(userId) {
  const data = collectLocalData();
  const { error } = await supabase.from('user_data').upsert(
    { user_id: userId, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

// Returns true if data was pulled (caller should reload), false if no cloud data yet.
export async function pullFromSupabase(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .single();

  // PGRST116 = row not found (first login, no data saved yet)
  if (error && error.code !== 'PGRST116') throw error;
  if (!data?.data) return false;

  for (const key of STORAGE_KEYS) {
    if (data.data[key] !== undefined) {
      localStorage.setItem(key, JSON.stringify(data.data[key]));
    }
  }
  return true;
}
