import { writable } from 'svelte/store';

const KEY = 'macro_targets_v1';

function load() {
  try {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

// null = no configurado todavía (muestra onboarding)
// { ON: { protein, carbs, fat }, OFF: { protein, carbs, fat } }
export const macroTargets = writable(load());

macroTargets.subscribe(v => {
  if (v !== null) localStorage.setItem(KEY, JSON.stringify(v));
});

export function setMacroTargets(targets) {
  macroTargets.set(targets);
}
