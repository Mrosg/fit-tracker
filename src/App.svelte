<script>
  import { onMount } from 'svelte';
  import { currentPath } from './lib/router.js';
  import { macroTargets } from './lib/stores/macroTargets.js';
  import { session, authLoading, initAuth } from './lib/stores/auth.js';
  import { pushToSupabase, pullFromSupabase } from './lib/dataManager.js';
  import Navbar      from './lib/components/Navbar.svelte';
  import Onboarding  from './lib/components/Onboarding.svelte';
  import Login       from './pages/Login.svelte';
  import Home        from './pages/Home.svelte';
  import Gym         from './pages/Gym.svelte';
  import Nutrition   from './pages/Nutrition.svelte';
  import Progreso    from './pages/Progreso.svelte';
  import Ajustes     from './pages/Ajustes.svelte';

  let pullDone = false;

  onMount(async () => {
    await initAuth();

    // Auto-push when tab goes to background
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && $session) {
        pushToSupabase($session.user.id).catch(() => {});
      }
    });
  });

  // When a new session starts, pull cloud data (once per browser session)
  $: if ($session && !$authLoading) {
    const flag = sessionStorage.getItem('pulled_' + $session.user.id);
    if (!flag) {
      sessionStorage.setItem('pulled_' + $session.user.id, '1');
      pullFromSupabase($session.user.id)
        .then(pulled => { if (pulled) window.location.reload(); })
        .catch(() => {});
    } else {
      pullDone = true;
    }
  }
</script>

{#if $authLoading}
  <!-- Loading spinner while we check the session -->
  <div class="loading-screen">
    <div class="spinner"></div>
  </div>

{:else if !$session}
  <Login />

{:else if $macroTargets === null}
  <Onboarding />

{:else}
  <Navbar />
  <main class="app-main">
    {#if $currentPath === '/'}
      <Home />
    {:else if $currentPath === '/gym'}
      <Gym />
    {:else if $currentPath === '/nutrition'}
      <Nutrition />
    {:else if $currentPath === '/progreso'}
      <Progreso />
    {:else if $currentPath === '/ajustes'}
      <Ajustes />
    {:else}
      <Home />
    {/if}
  </main>
{/if}

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; }

  :global(body) {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0d1117;
    color: #e2e8f0;
    min-height: 100vh;
  }

  :global(a) { text-decoration: none; }

  :global(input[type=number]) { -moz-appearance: textfield; appearance: textfield; }
  :global(input[type=number]::-webkit-outer-spin-button),
  :global(input[type=number]::-webkit-inner-spin-button) { -webkit-appearance: none; margin: 0; }

  :global(::-webkit-scrollbar) { width: 6px; height: 6px; }
  :global(::-webkit-scrollbar-track) { background: #0d1117; }
  :global(::-webkit-scrollbar-thumb) { background: #2d3561; border-radius: 3px; }

  .app-main { min-height: calc(100vh - 64px); }

  .loading-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0d1117;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(233,69,96,0.2);
    border-top-color: #e94560;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
</style>
