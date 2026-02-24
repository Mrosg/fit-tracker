<script>
  import { setMacroTargets } from '../stores/macroTargets.js';
  import { computeKcal } from '../stores/dailyMacros.js';

  let name = '';
  let on   = { protein: '', carbs: '', fat: '' };
  let off  = { protein: '', carbs: '', fat: '' };

  $: kcalOn  = (on.protein  !== '' || on.carbs  !== '' || on.fat  !== '')
    ? computeKcal(on.carbs,  on.protein,  on.fat)  : null;
  $: kcalOff = (off.protein !== '' || off.carbs !== '' || off.fat !== '')
    ? computeKcal(off.carbs, off.protein, off.fat) : null;

  $: canSave =
    name.trim() !== '' &&
    on.protein  !== '' && on.carbs  !== '' && on.fat  !== '' &&
    off.protein !== '' && off.carbs !== '' && off.fat !== '';

  function save() {
    if (!canSave) return;
    setMacroTargets({
      name: name.trim(),
      ON:  { protein: Number(on.protein),  carbs: Number(on.carbs),  fat: Number(on.fat)  },
      OFF: { protein: Number(off.protein), carbs: Number(off.carbs), fat: Number(off.fat) },
    });
  }
</script>

<div class="overlay">
  <div class="card">

    <div class="ob-header">
      <div class="ob-icon">💪</div>
      <h1>Bienvenido</h1>
      <p>Configura tus objetivos de macros antes de empezar.<br>
         Las calorías se calculan automáticamente.</p>
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

        <div class="kcal-preview">
          <span class="kcal-num on">{kcalOn ?? '—'}</span>
          <span class="kcal-label">kcal/día</span>
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

        <div class="kcal-preview">
          <span class="kcal-num off">{kcalOff ?? '—'}</span>
          <span class="kcal-label">kcal/día</span>
        </div>
      </div>

    </div>

    <div class="formula-hint">
      Fórmula: proteínas × 6 + hidratos × 6 + grasas × 9
    </div>

    <button class="btn-save" on:click={save} disabled={!canSave}>
      Guardar y comenzar →
    </button>

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

  /* Days grid */
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

  /* Fields */
  .fields { display: flex; flex-direction: column; gap: 0.65rem; }

  .field { display: flex; flex-direction: column; gap: 0.2rem; }

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

  .on-block .input-wrap input:not(:placeholder-shown) { border-color: rgba(233,69,96,0.45); }
  .off-block .input-wrap input:not(:placeholder-shown) { border-color: rgba(107,125,179,0.45); }

  .unit {
    position: absolute;
    right: 0.6rem;
    font-size: 0.65rem;
    color: #4a5568;
    pointer-events: none;
  }

  /* Kcal preview */
  .kcal-preview {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    padding-top: 0.25rem;
    border-top: 1px solid #1e2a45;
  }

  .kcal-num {
    font-size: 1.6rem;
    font-weight: 800;
    line-height: 1;
  }

  .kcal-num.on  { color: #e94560; }
  .kcal-num.off { color: #8892b0; }

  .kcal-label { font-size: 0.78rem; color: #4a5568; }

  /* Formula hint */
  .formula-hint {
    text-align: center;
    font-size: 0.75rem;
    color: #4a5568;
    background: #0a1929;
    border: 1px solid #1e2a45;
    border-radius: 8px;
    padding: 0.55rem;
  }

  /* Save button */
  .btn-save {
    padding: 0.85rem;
    background: #e94560;
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 1rem;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  }

  .btn-save:hover:not(:disabled) {
    background: #c73652;
    transform: translateY(-1px);
  }

  .btn-save:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    .card { padding: 1.75rem 1.25rem; }
    .days-grid { grid-template-columns: 1fr; }
  }
</style>
