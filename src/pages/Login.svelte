<script>
  import { signIn, signUp } from '../lib/stores/auth.js';

  let mode     = 'login'; // 'login' | 'register'
  let email    = '';
  let password = '';
  let loading  = false;
  let errorMsg = '';
  let infoMsg  = '';

  async function handleSubmit() {
    errorMsg = '';
    infoMsg  = '';
    if (!email.trim() || !password.trim()) {
      errorMsg = 'Rellena todos los campos.';
      return;
    }
    loading = true;
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        // App.svelte detectará el cambio de session y hará pull + recarga
      } else {
        await signUp(email.trim(), password);
        infoMsg = 'Cuenta creada. Ya puedes iniciar sesión.';
        mode    = 'login';
        password = '';
      }
    } catch (err) {
      errorMsg = translateError(err.message);
    } finally {
      loading = false;
    }
  }

  function translateError(msg) {
    if (msg.includes('Invalid login credentials'))  return 'Email o contraseña incorrectos.';
    if (msg.includes('User already registered'))    return 'Ya existe una cuenta con ese email.';
    if (msg.includes('Password should be'))         return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg.includes('Unable to validate'))         return 'Email no válido.';
    return msg;
  }
</script>

<div class="login-wrap">
  <div class="login-card">
    <div class="login-brand">
      <span class="brand-icon">⚡</span>
      <span class="brand-text">FitTracker</span>
    </div>

    <h1 class="login-title">
      {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
    </h1>
    <p class="login-sub">
      {mode === 'login'
        ? 'Tus datos están sincronizados en la nube.'
        : 'Registra una cuenta para guardar tus datos.'}
    </p>

    <form on:submit|preventDefault={handleSubmit} class="login-form">
      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="tu@email.com"
          autocomplete="email"
          required
        />
      </div>

      <div class="field">
        <label for="password">Contraseña</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="••••••••"
          autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />
      </div>

      {#if errorMsg}
        <div class="msg err">{errorMsg}</div>
      {/if}
      {#if infoMsg}
        <div class="msg ok">{infoMsg}</div>
      {/if}

      <button type="submit" class="btn-submit" disabled={loading}>
        {#if loading}
          <span class="spinner"></span> Cargando...
        {:else}
          {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        {/if}
      </button>
    </form>

    <div class="toggle-mode">
      {#if mode === 'login'}
        ¿No tienes cuenta?
        <button class="link-btn" on:click={() => { mode = 'register'; errorMsg = ''; infoMsg = ''; }}>
          Regístrate
        </button>
      {:else}
        ¿Ya tienes cuenta?
        <button class="link-btn" on:click={() => { mode = 'login'; errorMsg = ''; infoMsg = ''; }}>
          Inicia sesión
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0d1117;
    padding: 1.5rem;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 20px;
    padding: 2.25rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .login-brand {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 1.3rem;
    font-weight: 800;
    color: #e94560;
    margin-bottom: 0.75rem;
  }

  .brand-icon { font-size: 1.5rem; }

  .login-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #e2e8f0;
    margin: 0 0 0.1rem;
  }

  .login-sub {
    font-size: 0.85rem;
    color: #6b7db3;
    margin: 0 0 1rem;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #6b7db3;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field input {
    padding: 0.65rem 0.85rem;
    background: #0d1117;
    border: 1.5px solid #2d3561;
    border-radius: 9px;
    color: #e2e8f0;
    font-size: 0.95rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
    width: 100%;
  }

  .field input:focus { border-color: #e94560; }

  .msg {
    padding: 0.6rem 0.85rem;
    border-radius: 8px;
    font-size: 0.83rem;
    font-weight: 600;
  }

  .msg.err { background: rgba(239,68,68,0.1);  color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
  .msg.ok  { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }

  .btn-submit {
    margin-top: 0.25rem;
    padding: 0.75rem;
    background: #e94560;
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-submit:hover:not(:disabled) { background: #c73652; }
  .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .toggle-mode {
    margin-top: 0.75rem;
    text-align: center;
    font-size: 0.85rem;
    color: #6b7db3;
  }

  .link-btn {
    background: none;
    border: none;
    color: #e94560;
    font-size: inherit;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }

  .link-btn:hover { text-decoration: underline; }
</style>
