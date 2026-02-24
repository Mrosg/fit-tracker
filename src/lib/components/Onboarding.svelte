<script>
  import { setMacroTargets } from '../stores/macroTargets.js';
  import { createSession } from '../stores/gym.js';

  let step = 1;

  // Step 1
  let name = '';
  let trainingDays = 4;

  // Step 2
  let on  = { protein: '', carbs: '', fat: '' };
  let off = { protein: '', carbs: '', fat: '' };

  $: canStep1 = name.trim() !== '';
  $: canStep2 =
    on.protein  !== '' && on.carbs  !== '' && on.fat  !== '' &&
    off.protein !== '' && off.carbs !== '' && off.fat !== '';

  function goStep2() {
    if (!canStep1) return;
    step = 2;
  }

  function save() {
    if (!canStep2) return;
    setMacroTargets({
      name: name.trim(),
      trainingDays,
      ON:  { protein: Number(on.protein),  carbs: Number(on.carbs),  fat: Number(on.fat)  },
      OFF: { protein: Number(off.protein), carbs: Number(off.carbs), fat: Number(off.fat) },
    });
    for (let i = 1; i <= trainingDays; i++) {
      createSession(`Día ${i}`);
    }
  }
</script>

<div class="overlay">
  <div class="card">

    <!-- Step indicator -->
    <div class="steps">
      <div class="step" class:active={step === 1} class:done={step > 1}>
        <span class="step-num">1</span>
        <span class="step-label">Perfil</span>
      </div>
      <div class="step-line" class:done={step > 1}></div>
      <div class="step" class:active={step === 2}>
        <span class="step-num">2</span>
        <span class="step-label">Macros</span>
      </div>
    </div>

    <!-- ── STEP 1: Perfil ──────────────────────────────── -->
    {#if step === 1}
      <div class="ob-header">
        <div class="ob-icon">👋</div>
        <h1>Bienvenido</h1>
        <p>Dinos cómo te llamas y cuántos días a la semana entrenas.</p>
      </div>

      <div class="name-field">
        <label for="ob-name">¿Cómo te llamas?</label>
        <input
          id="ob-name"
          type="text"
          bind:value={name}
          placeholder="Tu nombre"
          autocomplete="off"
        />
      </div>

      <div class="days-field">
        <label>¿Cuántos días entrenas a la semana?</label>
        <div class="days-buttons">
          {#each [1,2,3,4,5,6,7] as d}
            <button
              class="day-btn"
              class:selected={trainingDays === d}
              on:click={() => (trainingDays = d)}
            >
              {d}
            </button>
          {/each}
        </div>
        <p class="days-hint">Se crearán {trainingDays} sesión{trainingDays !== 1 ? 'es' : ''} vacía{trainingDays !== 1 ? 's' : ''} en el gimnasio.</p>
      </div>

      <button class="btn-next" on:click={goStep2} disabled={!canStep1}>
        Siguiente →
      </button>

    <!-- ── STEP 2: Macros ──────────────────────────────── -->
    {:else}
      <div class="ob-header">
        <div class="ob-icon">🥗</div>
        <h1>Objetivos de macros</h1>
        <p>Configura tus targets para días de entrenamiento (ON) y descanso (OFF).</p>
      </div>

      <div class="days-grid">

        <!-- ON -->
        <div class="day-block on-block">
          <div class="day-label">
            <span class="day-badge on">ON</span>
            <span class="day-desc">Día de entrenamiento</span>
          </div>

          <div class="fields">
            <div class="field">
              <label for="on-prot">Proteínas</label>
              <div class="input-wrap">
                <input id="on-prot" type="number" bind:value={on.protein} placeholder="150" min="0" />
                <span class="unit">g</span>
              </div>
            </div>
            <div class="field">
              <label for="on-carbs">Hidratos</label>
              <div class="input-wrap">
                <input id="on-carbs" type="number" bind:value={on.carbs} placeholder="200" min="0" />
                <span class="unit">g</span>
              </div>
            </div>
            <div class="field">
              <label for="on-fat">Grasas</label>
              <div class="input-wrap">
                <input id="on-fat" type="number" bind:value={on.fat} placeholder="50" min="0" />
                <span class="unit">g</span>
              </div>
            </div>
          </div>

        </div>

        <!-- OFF -->
        <div class="day-block off-block">
          <div class="day-label">
            <span class="day-badge off">OFF</span>
            <span class="day-desc">Día de descanso</span>
          </div>

          <div class="fields">
            <div class="field">
              <label for="off-prot">Proteínas</label>
              <div class="input-wrap">
                <input id="off-prot" type="number" bind:value={off.protein} placeholder="135" min="0" />
                <span class="unit">g</span>
              </div>
            </div>
            <div class="field">
              <label for="off-carbs">Hidratos</label>
              <div class="input-wrap">
                <input id="off-carbs" type="number" bind:value={off.carbs} placeholder="155" min="0" />
                <span class="unit">g</span>
              </div>
            </div>
            <div class="field">
              <label for="off-fat">Grasas</label>
              <div class="input-wrap">
                <input id="off-fat" type="number" bind:value={off.fat} placeholder="55" min="0" />
                <span class="unit">g</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <div class="step2-actions">
        <button class="btn-back" on:click={() => (step = 1)}>← Atrás</button>
        <button class="btn-save" on:click={save} disabled={!canStep2}>
          Empezar →
        </button>
      </div>
    {/if}

  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: #0d1117;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 1000;
    overflow-y: auto;
  }

  .card {
    width: 100%;
    max-width: 640px;
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 20px;
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  /* Step indicator */
  .steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }

  .step-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 800;
    background: #0f1927;
    border: 2px solid #2d3561;
    color: #4a5568;
    transition: all 0.2s;
  }

  .step.active .step-num {
    border-color: #e94560;
    color: #e94560;
    background: rgba(233,69,96,0.1);
  }

  .step.done .step-num {
    border-color: #10b981;
    color: #10b981;
    background: rgba(16,185,129,0.1);
  }

  .step-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .step.active .step-label { color: #e94560; }
  .step.done .step-label   { color: #10b981; }

  .step-line {
    width: 60px;
    height: 2px;
    background: #2d3561;
    margin: 0 0.5rem;
    margin-bottom: 1.2rem;
    transition: background 0.2s;
  }

  .step-line.done { background: #10b981; }

  /* Header */
  .ob-header { text-align: center; }

  .ob-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }

  h1 {
    font-size: 1.8rem;
    font-weight: 800;
    color: #e2e8f0;
    margin: 0 0 0.5rem;
  }

  .ob-header p {
    color: #6b7db3;
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0;
  }

  /* Name field */
  .name-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .name-field label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #6b7db3;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .name-field input {
    padding: 0.75rem 1rem;
    background: #0f1927;
    border: 1.5px solid #2d3561;
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 1.1rem;
    font-weight: 600;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  .name-field input:focus { border-color: #e94560; }
  .name-field input:not(:placeholder-shown) { border-color: rgba(233,69,96,0.45); }

  /* Training days */
  .days-field {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .days-field > label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #6b7db3;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .days-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .day-btn {
    flex: 1;
    padding: 0.75rem 0;
    background: #0f1927;
    border: 1.5px solid #2d3561;
    border-radius: 10px;
    color: #6b7db3;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .day-btn:hover { border-color: #e94560; color: #e94560; }

  .day-btn.selected {
    background: rgba(233,69,96,0.12);
    border-color: #e94560;
    color: #e94560;
  }

  .days-hint {
    font-size: 0.78rem;
    color: #4a5568;
    margin: 0;
  }

  /* Days grid (macros) */
  .days-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .day-block {
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .on-block  { border-top: 3px solid #e94560; }
  .off-block { border-top: 3px solid #6b7db3; }

  .day-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .day-badge {
    padding: 0.15rem 0.65rem;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.05em;
  }

  .day-badge.on  { background: rgba(233,69,96,0.15); color: #e94560; }
  .day-badge.off { background: rgba(107,125,179,0.15); color: #8892b0; }

  .day-desc { font-size: 0.78rem; color: #4a5568; }

  .fields { display: flex; flex-direction: column; gap: 0.65rem; }
  .field  { display: flex; flex-direction: column; gap: 0.2rem; }

  .field label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #6b7db3;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-wrap input {
    width: 100%;
    padding: 0.55rem 2.2rem 0.55rem 0.7rem;
    background: #0a1929;
    border: 1.5px solid #2d3561;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 1rem;
    font-weight: 700;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
    font-family: inherit;
  }

  .input-wrap input:focus { border-color: #e94560; }
  .on-block  .input-wrap input:not(:placeholder-shown) { border-color: rgba(233,69,96,0.45); }
  .off-block .input-wrap input:not(:placeholder-shown) { border-color: rgba(107,125,179,0.45); }

  .unit {
    position: absolute;
    right: 0.6rem;
    font-size: 0.65rem;
    color: #4a5568;
    pointer-events: none;
  }

  /* Buttons */
  .btn-next {
    padding: 0.85rem;
    background: #e94560;
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 1rem;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    font-family: inherit;
  }

  .btn-next:hover:not(:disabled) { background: #c73652; transform: translateY(-1px); }
  .btn-next:disabled { opacity: 0.35; cursor: not-allowed; }

  .step2-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-back {
    padding: 0.85rem 1.25rem;
    background: transparent;
    border: 1.5px solid #2d3561;
    border-radius: 12px;
    color: #6b7db3;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .btn-back:hover { border-color: #a8b2d8; color: #a8b2d8; }

  .btn-save {
    flex: 1;
    padding: 0.85rem;
    background: #e94560;
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 1rem;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    font-family: inherit;
  }

  .btn-save:hover:not(:disabled) { background: #c73652; transform: translateY(-1px); }
  .btn-save:disabled { opacity: 0.35; cursor: not-allowed; }

  @media (max-width: 520px) {
    .card { padding: 1.75rem 1.25rem; }
    .days-grid { grid-template-columns: 1fr; }
    .days-buttons { flex-wrap: wrap; }
    .day-btn { min-width: calc(25% - 0.4rem); flex: none; }
  }
</style>
