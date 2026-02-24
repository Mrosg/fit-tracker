import { readable } from 'svelte/store';

function getHash() {
  return window.location.hash.slice(1) || '/';
}

export const currentPath = readable(getHash(), set => {
  const handler = () => set(getHash());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
});

export function navigate(path) {
  window.location.hash = path;
}
