<script>
  import { exportAllData, importAllData, resetAllData, pushToSupabase } from '../lib/dataManager.js';
  import { macroTargets, setMacroTargets } from '../lib/stores/macroTargets.js';
  import { computeKcal } from '../lib/stores/dailyMacros.js';
  import { session, signOut } from '../lib/stores/auth.js';

  // ── Export / Import ──────────────────────────────────────
  let importStatus = '';
  let importError  = '';
  let fileInput;

  function handleExport() {
    exportAllData();
  }

  async function handleFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;
    importStatus = '';
    importError  = '';
    try {
      const count = await importAllData(file);
      importStatus = `✓ ${count} bloques importados. Recarga la página para ver los cambios.`;
    } catch (err) {
      importError = `✕ Error: ${err.message}`;
    }
    fileInput.value = '';
  }

  // ── Editar objetivos de macros ────────────────────────────
  let editingTargets = false;
  let tForm = { name: '', onProt: '', onCarbs: '', onFat: '', offProt: '', offCarbs: '', offFat: '' };

  function openEditTargets() {
    const t = $macroTargets;
    tForm = {
      name:     t?.name     ?? '',
      onProt:   t?.ON.protein  ?? '',
      onCarbs:  t?.ON.carbs    ?? '',
      onFat:    t?.ON.fat      ?? '',
      offProt:  t?.OFF.protein ?? '',
      offCarbs: t?.OFF.carbs   ?? '',
      offFat:   t?.OFF.fat     ?? '',
    };
    editingTargets = true;
  }

  $: kcalOnPreview  = computeKcal(tForm.onCarbs,  tForm.onProt,  tForm.onFat);
  $: kcalOffPreview = computeKcal(tForm.offCarbs, tForm.offProt, tForm.offFat);

  $: canSaveTargets =
    tForm.name.trim() !== '' &&
    tForm.onProt  !== '' && tForm.onCarbs  !== '' && tForm.onFat  !== '' &&
    tForm.offProt !== '' && tForm.offCarbs !== '' && tForm.offFat !== '';

  function saveTargets() {
    if (!canSaveTargets) return;
    setMacroTargets({
      name: tForm.name.trim(),
      ON:  { protein: Number(tForm.onProt),  carbs: Number(tForm.onCarbs),  fat: Number(tForm.onFat)  },
      OFF: { protein: Number(tForm.offProt), carbs: Number(tForm.offCarbs), fat: Number(tForm.offFat) },
    });
    editingTargets = false;
  }

  // ── Cuenta / Supabase ─────────────────────────────────────
  let syncStatus  = '';
  let syncError   = '';
  let syncing     = false;
  let loggingOut  = false;

  async function handleSync() {
    if (!$session) return;
    syncStatus = '';
    syncError  = '';
    syncing    = true;
    try {
      await pushToSupabase($session.user.id);
      syncStatus = '✓ Datos sincronizados correctamente.';
    } catch (err) {
      syncError = `✕ Error al sincronizar: ${err.message}`;
    } finally {
      syncing = false;
    }
  }

  async function handleLogout() {
    loggingOut = true;
    await signOut();
    // session store se actualiza solo; App.svelte redirige a Login
  }

  // ── Privacidad ───────────────────────────────────────────
  let privacyExpanded = false;

  // ── Reset con doble verificación ─────────────────────────
  // step 0 = oculto | 1 = primera confirmación | 2 = segunda confirmación
  let resetStep   = 0;
  let resetInput  = '';

  $: resetConfirmed = resetStep === 2 && resetInput.trim().toUpperCase() === 'BORRAR';

  function confirmReset() {
    resetAllData();
    window.location.reload();
  }
</script>

<div class="ajustes-page">
  <div class="page-header">
    <h1>Ajustes</h1>
    <p>Gestiona tus datos y preferencias</p>
  </div>

  <!-- ── Objetivos de macros ───────────────────────────────── -->
  <section class="section">
    <div class="section-title">
      <span class="section-icon">🎯</span>
      <div>
        <h2>Objetivos de macros</h2>
        <p>Tus targets de proteínas, hidratos y grasas para días ON y OFF</p>
      </div>
      <button class="btn-edit" on:click={openEditTargets}>Editar</button>
    </div>

    {#if $macroTargets && !editingTargets}
      <div class="targets-summary">
        <div class="target-col on">
          <span class="target-badge on">ON</span>
          <div class="target-macros">
            <span class="tm prot">{$macroTargets.ON.protein}g P</span>
            <span class="tm carb">{$macroTargets.ON.carbs}g C</span>
            <span class="tm fat">{$macroTargets.ON.fat}g G</span>
          </div>
          <span class="target-kcal">{computeKcal($macroTargets.ON.carbs, $macroTargets.ON.protein, $macroTargets.ON.fat)} kcal</span>
        </div>
        <div class="target-divider"></div>
        <div class="target-col off">
          <span class="target-badge off">OFF</span>
          <div class="target-macros">
            <span class="tm prot">{$macroTargets.OFF.protein}g P</span>
            <span class="tm carb">{$macroTargets.OFF.carbs}g C</span>
            <span class="tm fat">{$macroTargets.OFF.fat}g G</span>
          </div>
          <span class="target-kcal">{computeKcal($macroTargets.OFF.carbs, $macroTargets.OFF.protein, $macroTargets.OFF.fat)} kcal</span>
        </div>
      </div>
    {/if}

    {#if editingTargets}
      <div class="edit-form">
        <div class="edit-name-row">
          <div class="edit-field full">
            <label>Nombre</label>
            <input type="text" bind:value={tForm.name} placeholder="Tu nombre" />
          </div>
        </div>
        <div class="edit-days-grid">
          <div class="edit-day on-col">
            <div class="edit-day-title"><span class="target-badge on">ON</span> Día de entrenamiento</div>
            <div class="edit-row">
              <div class="edit-field">
                <label>Proteínas</label>
                <div class="ef-wrap"><input type="number" bind:value={tForm.onProt}  min="0" placeholder="150" /><span class="u">g</span></div>
              </div>
              <div class="edit-field">
                <label>Hidratos</label>
                <div class="ef-wrap"><input type="number" bind:value={tForm.onCarbs} min="0" placeholder="200" /><span class="u">g</span></div>
              </div>
              <div class="edit-field">
                <label>Grasas</label>
                <div class="ef-wrap"><input type="number" bind:value={tForm.onFat}   min="0" placeholder="50"  /><span class="u">g</span></div>
              </div>
            </div>
            <div class="edit-kcal"><span class="kcal-preview on">{kcalOnPreview}</span> kcal/día</div>
          </div>

          <div class="edit-day off-col">
            <div class="edit-day-title"><span class="target-badge off">OFF</span> Día de descanso</div>
            <div class="edit-row">
              <div class="edit-field">
                <label>Proteínas</label>
                <div class="ef-wrap"><input type="number" bind:value={tForm.offProt}  min="0" placeholder="135" /><span class="u">g</span></div>
              </div>
              <div class="edit-field">
                <label>Hidratos</label>
                <div class="ef-wrap"><input type="number" bind:value={tForm.offCarbs} min="0" placeholder="155" /><span class="u">g</span></div>
              </div>
              <div class="edit-field">
                <label>Grasas</label>
                <div class="ef-wrap"><input type="number" bind:value={tForm.offFat}   min="0" placeholder="55"  /><span class="u">g</span></div>
              </div>
            </div>
            <div class="edit-kcal"><span class="kcal-preview off">{kcalOffPreview}</span> kcal/día</div>
          </div>
        </div>

        <div class="edit-actions">
          <button class="btn-cancel" on:click={() => (editingTargets = false)}>Cancelar</button>
          <button class="btn-save-targets" on:click={saveTargets} disabled={!canSaveTargets}>Guardar cambios</button>
        </div>
      </div>
    {/if}
  </section>

  <!-- ── Cuenta ────────────────────────────────────────────── -->
  <section class="section">
    <div class="section-title">
      <span class="section-icon">👤</span>
      <div>
        <h2>Cuenta</h2>
        <p>Sesión activa y sincronización en la nube</p>
      </div>
    </div>

    {#if $session}
      <div class="account-info">
        <div class="account-email">
          <span class="email-label">Conectado como</span>
          <span class="email-value">{$session.user.email}</span>
        </div>
        <div class="account-actions">
          <button class="btn-sync" on:click={handleSync} disabled={syncing}>
            {#if syncing}
              <span class="spinner-sm"></span> Sincronizando...
            {:else}
              ☁️ Sincronizar ahora
            {/if}
          </button>
          <button class="btn-logout" on:click={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>

      {#if syncStatus}
        <div class="msg ok">{syncStatus}</div>
      {/if}
      {#if syncError}
        <div class="msg err">{syncError}</div>
      {/if}

      <p class="sync-note">
        Los datos se sincronizan automáticamente cada vez que cambias de pestaña o cierras el navegador.
      </p>
    {/if}
  </section>

  <!-- ── Copia de seguridad ────────────────────────────────── -->
  <section class="section">
    <div class="section-title">
      <span class="section-icon">💾</span>
      <div>
        <h2>Copia de seguridad</h2>
        <p>Exporta todos tus datos a JSON o importa una copia guardada</p>
      </div>
    </div>

    <div class="backup-btns">
      <button class="btn-export" on:click={handleExport}>
        📤 Descargar backup JSON
      </button>
      <input type="file" accept=".json,application/json" bind:this={fileInput} on:change={handleFileSelected} style="display:none" />
      <button class="btn-import" on:click={() => fileInput.click()}>
        📥 Importar desde JSON
      </button>
    </div>

    {#if importStatus}
      <div class="msg ok">{importStatus}</div>
    {/if}
    {#if importError}
      <div class="msg err">{importError}</div>
    {/if}

    <div class="backup-info">
      <span class="bi-label">Incluye:</span>
      rutinas · historial gym · progreso diario · medidas · nutrición · objetivos de macros
    </div>
  </section>

  <!-- ── Privacidad ───────────────────────────────────────── -->
  <section class="section">
    <button class="privacy-toggle" on:click={() => (privacyExpanded = !privacyExpanded)}>
      <div class="section-title" style="margin:0; pointer-events:none;">
        <span class="section-icon">🔒</span>
        <div>
          <h2>Privacidad y datos</h2>
          <p>Qué datos guardamos y cómo los usamos</p>
        </div>
      </div>
      <span class="privacy-chevron" class:open={privacyExpanded}>›</span>
    </button>

    {#if privacyExpanded}
      <div class="privacy-content">

        <div class="privacy-block">
          <div class="privacy-block-title">¿Qué datos se recogen?</div>
          <ul class="privacy-list">
            <li><span class="privacy-dot"></span><strong>Cuenta:</strong> únicamente tu dirección de correo electrónico, usada para iniciar sesión.</li>
            <li><span class="privacy-dot"></span><strong>Actividad física:</strong> rutinas de gimnasio, series, pesos, historial de entrenamientos y progreso corporal (peso y medidas).</li>
            <li><span class="privacy-dot"></span><strong>Nutrición:</strong> registro diario de macronutrientes, calorías y pasos.</li>
          </ul>
        </div>

        <div class="privacy-block">
          <div class="privacy-block-title">¿Dónde se almacenan?</div>
          <ul class="privacy-list">
            <li><span class="privacy-dot"></span><strong>En tu dispositivo:</strong> los datos se guardan localmente (almacenamiento del navegador) para que la app funcione sin conexión.</li>
            <li><span class="privacy-dot"></span><strong>En la nube:</strong> si tienes sesión iniciada, los datos se sincronizan cifrados en Supabase (infraestructura alojada en la UE) para que puedas acceder desde cualquier dispositivo.</li>
          </ul>
        </div>

        <div class="privacy-block">
          <div class="privacy-block-title">¿Quién puede verlos?</div>
          <ul class="privacy-list">
            <li><span class="privacy-dot"></span>Solo tú, a través de tu cuenta. Cada usuario únicamente puede acceder a sus propios datos.</li>
            <li><span class="privacy-dot"></span>El administrador de la app tiene acceso técnico a la base de datos como parte de la gestión del servicio, pero no consulta ni trata datos personales de usuarios.</li>
            <li><span class="privacy-dot"></span>No se comparten datos con terceros ni se usan con fines publicitarios o comerciales.</li>
          </ul>
        </div>

        <div class="privacy-block">
          <div class="privacy-block-title">¿Cómo eliminar tus datos?</div>
          <ul class="privacy-list">
            <li><span class="privacy-dot"></span>Puedes borrar todos tus datos locales desde la sección <strong>Zona de peligro</strong> de esta página.</li>
            <li><span class="privacy-dot"></span>Para eliminar tu cuenta y los datos almacenados en la nube, contacta con el administrador.</li>
          </ul>
        </div>

        <div class="privacy-updated">Última actualización: febrero 2026</div>
      </div>
    {/if}
  </section>

  <!-- ── Zona de peligro ───────────────────────────────────── -->
  <section class="section danger-section">
    <div class="section-title">
      <span class="section-icon">⚠️</span>
      <div>
        <h2>Zona de peligro</h2>
        <p>Acciones irreversibles que afectan a toda la aplicación</p>
      </div>
    </div>

    {#if resetStep === 0}
      <button class="btn-reset" on:click={() => (resetStep = 1)}>
        Restablecer todos los datos
      </button>

    {:else if resetStep === 1}
      <div class="confirm-panel step1">
        <div class="confirm-warning">
          <span class="warn-icon">🗑️</span>
          <div>
            <strong>¿Estás seguro?</strong>
            <p>Se eliminarán permanentemente <strong>todos tus datos</strong>: rutinas, historial de entrenamientos, progreso, medidas corporales, nutrición y objetivos. Esta acción <strong>no se puede deshacer</strong>.</p>
          </div>
        </div>
        <div class="confirm-actions">
          <button class="btn-cancel" on:click={() => (resetStep = 0)}>Cancelar</button>
          <button class="btn-reset-confirm" on:click={() => { resetStep = 2; resetInput = ''; }}>
            Sí, quiero continuar →
          </button>
        </div>
      </div>

    {:else if resetStep === 2}
      <div class="confirm-panel step2">
        <p class="confirm-instruction">
          Escribe <strong class="keyword">BORRAR</strong> para confirmar el restablecimiento completo
        </p>
        <input
          class="confirm-input"
          type="text"
          bind:value={resetInput}
          placeholder="Escribe BORRAR"
          autocomplete="off"
          spellcheck="false"
        />
        <div class="confirm-actions">
          <button class="btn-cancel" on:click={() => { resetStep = 0; resetInput = ''; }}>Cancelar</button>
          <button
            class="btn-reset-final"
            on:click={confirmReset}
            disabled={!resetConfirmed}
          >
            Confirmar restablecimiento
          </button>
        </div>
      </div>
    {/if}
  </section>
</div>

<style>
  .ajustes-page {
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header h1 {
    font-size: 1.8rem; font-weight: 800; color: #e2e8f0; margin: 0 0 0.2rem;
  }
  .page-header p { color: #6b7db3; margin: 0; font-size: 0.9rem; }

  /* Section */
  .section {
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .danger-section { border-color: rgba(239,68,68,0.3); }

  .section-title {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
  }

  .section-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 0.1rem; }

  .section-title > div { flex: 1; }

  .section-title h2 {
    font-size: 1rem; font-weight: 700; color: #e2e8f0; margin: 0 0 0.15rem;
  }

  .section-title p {
    font-size: 0.82rem; color: #6b7db3; margin: 0;
  }

  /* Targets summary */
  .targets-summary {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 12px;
    padding: 1rem 1.25rem;
  }

  .target-col {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    flex: 1;
  }

  .target-divider {
    width: 1px;
    height: 60px;
    background: #2d3561;
    flex-shrink: 0;
  }

  .target-badge {
    padding: 0.12rem 0.6rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    width: fit-content;
  }

  .target-badge.on  { background: rgba(233,69,96,0.15); color: #e94560; }
  .target-badge.off { background: rgba(107,125,179,0.15); color: #8892b0; }

  .target-macros { display: flex; gap: 0.5rem; flex-wrap: wrap; }

  .tm {
    font-size: 0.78rem; font-weight: 700;
    padding: 0.1rem 0.45rem; border-radius: 12px;
  }

  .tm.prot { background: rgba(16,185,129,0.12); color: #10b981; }
  .tm.carb { background: rgba(251,191,36,0.12); color: #fbbf24; }
  .tm.fat  { background: rgba(249,115,22,0.12); color: #f97316; }

  .target-kcal { font-size: 0.8rem; color: #4a5568; font-weight: 600; }

  /* Edit button */
  .btn-edit {
    padding: 0.4rem 0.9rem;
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.35);
    border-radius: 8px;
    color: #3b82f6;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    align-self: flex-start;
  }

  .btn-edit:hover { background: rgba(59,130,246,0.2); }

  /* Edit form */
  .edit-form {
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 12px;
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .edit-name-row { display: flex; }

  .edit-field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
  .edit-field.full { width: 100%; }

  .edit-field label {
    font-size: 0.68rem; font-weight: 700; color: #6b7db3;
    text-transform: uppercase; letter-spacing: 0.04em;
  }

  .edit-field input, .ef-wrap input {
    padding: 0.5rem 0.7rem;
    background: #1a1a2e;
    border: 1.5px solid #2d3561;
    border-radius: 7px;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-weight: 600;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
    box-sizing: border-box;
    width: 100%;
  }

  .edit-field input:focus, .ef-wrap input:focus { border-color: #3b82f6; }

  .ef-wrap { position: relative; }

  .ef-wrap input { padding-right: 1.8rem; }

  .u {
    position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%);
    font-size: 0.62rem; color: #4a5568; pointer-events: none;
  }

  .edit-days-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .edit-day {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 0.85rem;
    border-radius: 10px;
    border: 1px solid #2d3561;
  }

  .on-col  { border-top: 2px solid rgba(233,69,96,0.5); }
  .off-col { border-top: 2px solid rgba(107,125,179,0.4); }

  .edit-day-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: #6b7db3;
    font-weight: 600;
  }

  .edit-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
  }

  .edit-kcal {
    font-size: 0.78rem;
    color: #4a5568;
    font-weight: 600;
    padding-top: 0.25rem;
    border-top: 1px solid #1e2a45;
  }

  .kcal-preview { font-size: 1rem; font-weight: 800; }
  .kcal-preview.on  { color: #e94560; }
  .kcal-preview.off { color: #8892b0; }

  .edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .btn-cancel {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #2d3561;
    border-radius: 8px;
    color: #6b7db3;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel:hover { border-color: #a8b2d8; color: #a8b2d8; }

  .btn-save-targets {
    padding: 0.5rem 1.25rem;
    background: #3b82f6;
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-save-targets:hover:not(:disabled) { background: #2563eb; }
  .btn-save-targets:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Backup */
  .backup-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }

  .btn-export {
    padding: 0.6rem 1.2rem;
    background: rgba(233,69,96,0.1);
    border: 1px solid rgba(233,69,96,0.35);
    border-radius: 8px;
    color: #e94560;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-export:hover { background: rgba(233,69,96,0.2); }

  .btn-import {
    padding: 0.6rem 1.2rem;
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.35);
    border-radius: 8px;
    color: #3b82f6;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-import:hover { background: rgba(59,130,246,0.2); }

  .msg {
    padding: 0.65rem 0.9rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .msg.ok  { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
  .msg.err { background: rgba(239,68,68,0.1);  color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }

  .backup-info {
    font-size: 0.78rem;
    color: #4a5568;
    padding: 0.6rem 0.85rem;
    background: #0a1929;
    border-radius: 8px;
    line-height: 1.6;
  }

  .bi-label { font-weight: 700; color: #6b7db3; margin-right: 0.3rem; }

  /* Danger zone */
  .btn-reset {
    align-self: flex-start;
    padding: 0.6rem 1.3rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.4);
    border-radius: 8px;
    color: #ef4444;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-reset:hover { background: rgba(239,68,68,0.2); border-color: #ef4444; }

  .confirm-panel {
    background: #0f1927;
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 12px;
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Step 1 */
  .confirm-warning {
    display: flex;
    gap: 0.85rem;
    align-items: flex-start;
  }

  .warn-icon { font-size: 1.5rem; flex-shrink: 0; }

  .confirm-warning strong {
    display: block;
    font-size: 0.95rem;
    color: #ef4444;
    margin-bottom: 0.3rem;
  }

  .confirm-warning p {
    font-size: 0.83rem;
    color: #8892b0;
    margin: 0;
    line-height: 1.5;
  }

  .confirm-warning strong.em { color: #e2e8f0; }

  .confirm-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

  .btn-reset-confirm {
    padding: 0.5rem 1.1rem;
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(239,68,68,0.45);
    border-radius: 8px;
    color: #ef4444;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-reset-confirm:hover { background: rgba(239,68,68,0.28); }

  /* Step 2 */
  .confirm-instruction {
    font-size: 0.88rem;
    color: #8892b0;
    margin: 0;
    line-height: 1.5;
  }

  .keyword {
    color: #ef4444;
    font-family: monospace;
    font-size: 0.95rem;
    background: rgba(239,68,68,0.1);
    padding: 0.05rem 0.35rem;
    border-radius: 4px;
  }

  .confirm-input {
    padding: 0.65rem 0.85rem;
    background: #0a1929;
    border: 1.5px solid rgba(239,68,68,0.4);
    border-radius: 8px;
    color: #ef4444;
    font-size: 1rem;
    font-weight: 700;
    font-family: monospace;
    outline: none;
    letter-spacing: 0.08em;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;
  }

  .confirm-input:focus { border-color: #ef4444; }

  .btn-reset-final {
    padding: 0.5rem 1.2rem;
    background: #ef4444;
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-reset-final:hover:not(:disabled) { background: #dc2626; }
  .btn-reset-final:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Account section */
  .account-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 12px;
    padding: 0.9rem 1.1rem;
  }

  .account-email {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .email-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .email-value {
    font-size: 0.92rem;
    font-weight: 600;
    color: #a8b2d8;
  }

  .account-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .btn-sync {
    padding: 0.5rem 1rem;
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.35);
    border-radius: 8px;
    color: #3b82f6;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .btn-sync:hover:not(:disabled) { background: rgba(59,130,246,0.2); }
  .btn-sync:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-logout {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #2d3561;
    border-radius: 8px;
    color: #6b7db3;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }

  .btn-logout:hover:not(:disabled) { border-color: #ef4444; color: #ef4444; }
  .btn-logout:disabled { opacity: 0.5; cursor: not-allowed; }

  .spinner-sm {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(59,130,246,0.3);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .sync-note {
    font-size: 0.78rem;
    color: #4a5568;
    margin: 0;
    line-height: 1.5;
  }

  /* Privacy section */
  .privacy-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-align: left;
    gap: 0.5rem;
  }

  .privacy-chevron {
    font-size: 1.4rem;
    color: #4a5568;
    transition: transform 0.2s;
    flex-shrink: 0;
    line-height: 1;
  }

  .privacy-chevron.open { transform: rotate(90deg); }

  .privacy-content {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding-top: 0.25rem;
  }

  .privacy-block {
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 10px;
    padding: 1rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .privacy-block-title {
    font-size: 0.78rem;
    font-weight: 700;
    color: #6b7db3;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .privacy-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .privacy-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    font-size: 0.84rem;
    color: #8892b0;
    line-height: 1.5;
  }

  .privacy-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #3b82f6;
    flex-shrink: 0;
    margin-top: 0.45rem;
  }

  .privacy-list strong { color: #a8b2d8; }

  .privacy-text {
    font-size: 0.84rem;
    color: #8892b0;
    margin: 0;
    line-height: 1.6;
  }

  .privacy-updated {
    font-size: 0.72rem;
    color: #4a5568;
    text-align: right;
  }

  @media (max-width: 560px) {
    .edit-days-grid  { grid-template-columns: 1fr; }
    .targets-summary { flex-direction: column; gap: 0.75rem; }
    .target-divider  { width: 100%; height: 1px; }
    .backup-btns     { flex-direction: column; }
    .account-info    { flex-direction: column; align-items: flex-start; }
  }
</style>
