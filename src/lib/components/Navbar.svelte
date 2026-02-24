<script>
  import { currentPath } from '../router.js';

  const navItems = [
    { path: '/',          label: 'Inicio',    icon: '🏠' },
    { path: '/gym',       label: 'Gimnasio',  icon: '💪' },
    { path: '/nutrition', label: 'Nutrición', icon: '🥗' },
    { path: '/progreso',  label: 'Progreso',  icon: '📊' },
    { path: '/ajustes',   label: 'Ajustes',   icon: '⚙️' },
  ];
</script>

<nav class="navbar">
  <div class="navbar-brand">
    <span class="brand-icon">⚡</span>
    <span class="brand-text">FitTracker</span>
  </div>
  <div class="navbar-links">
    {#each navItems as item}
      <a
        href="#{item.path}"
        class="nav-link"
        class:active={$currentPath === item.path}
      >
        <span class="nav-icon">{item.icon}</span>
        <span class="nav-label">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>

<style>
  .navbar {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.4rem;
    font-weight: 700;
    color: #e94560;
  }

  .brand-icon { font-size: 1.6rem; }

  .navbar-links { display: flex; gap: 0.4rem; }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    border-radius: 8px;
    color: #a8b2d8;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .nav-link:hover {
    background: rgba(233, 69, 96, 0.15);
    color: #e94560;
  }

  .nav-link.active {
    background: rgba(233, 69, 96, 0.2);
    color: #e94560;
  }

  .nav-icon { font-size: 1rem; }

  @media (max-width: 600px) {
    .navbar { padding: 0 0.75rem; }
    .brand-text { display: none; }
    .nav-label { display: none; }
    .nav-link { padding: 0.5rem; }
  }
</style>
