import { writable } from 'svelte/store';
import { supabase } from '../supabase.js';

export const session     = writable(null);
export const authLoading = writable(true);

export async function initAuth() {
  const { data } = await supabase.auth.getSession();
  session.set(data.session);
  authLoading.set(false);

  supabase.auth.onAuthStateChange((_event, s) => {
    session.set(s);
  });
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}
