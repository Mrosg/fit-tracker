<script>
  import {
    dailyMacros, setDayMacros, clearDayMacros,
    getWeekDates, DAY_LABELS, DAY_SHORT, todayKey,
    computeKcal
  } from '../lib/stores/dailyMacros.js';
  import { macroTargets } from '../lib/stores/macroTargets.js';
  import { upsertProgresoMacros, clearProgresoMacros } from '../lib/stores/progreso.js';

  // Week navigation
  let weekOffset = 0;

  $: refDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  })();

  $: weekDates = getWeekDates(refDate);
  $: today = todayKey();

  let activeDate = today;

  $: if (!weekDates.includes(activeDate)) {
    activeDate = weekDates.includes(today) ? today : weekDates[0];
  }

  // Local form state
  let form = { protein: '', carbs: '', fat: '', steps: '' };

  $: {
    const d = $dailyMacros[activeDate] || {};
    form = {
      protein: d.protein ?? '',
      carbs:   d.carbs   ?? '',
      fat:     d.fat     ?? '',
      steps:   d.steps   ?? '',
    };
  }

  // Auto-calculated kcal
  $: kcalCalc = (form.carbs !== '' || form.protein !== '' || form.fat !== '')
    ? computeKcal(form.carbs, form.protein, form.fat)
    : null;

  function saveDay() {
    const macros = {
      protein: form.protein === '' ? null : Number(form.protein),
      carbs:   form.carbs   === '' ? null : Number(form.carbs),
      fat:     form.fat     === '' ? null : Number(form.fat),
      steps:   form.steps   === '' ? null : Number(form.steps),
    };
    setDayMacros(activeDate, macros);
    const kcal = computeKcal(macros.carbs, macros.protein, macros.fat);
    upsertProgresoMacros(activeDate, { ...macros, kcal });
  }

  function clearDay() {
    clearDayMacros(activeDate);
    clearProgresoMacros(activeDate);
  }

  // Active preset (ON / OFF)
  let preset = 'ON';
  $: goals = $macroTargets?.[preset] ?? { protein: 0, carbs: 0, fat: 0 };
  $: kcalGoal = computeKcal(goals.carbs, goals.protein, goals.fat);

  function pct(val, goal) {
    if (!goal || val == null || val === '') return 0;
    return Math.min(Math.round((Number(val) / goal) * 100), 100);
  }

  function over(val, goal) {
    return goal && val !== '' && val != null && Number(val) > goal;
  }

  function fmtDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  // Week averages (kcal computed on the fly)
  $: weekEntries = weekDates.map(d => $dailyMacros[d]).filter(Boolean);
  $: avgKcal    = weekEntries.length
    ? Math.round(weekEntries.reduce((s, e) => s + computeKcal(e.carbs, e.protein, e.fat), 0) / weekEntries.length)
    : null;
  $: avgProtein = weekEntries.length
    ? Math.round(weekEntries.reduce((s, e) => s + (e.protein || 0), 0) / weekEntries.length)
    : null;
  $: avgSteps = weekEntries.length
    ? Math.round(weekEntries.filter(e => e.steps).reduce((s, e) => s + e.steps, 0) / weekEntries.filter(e => e.steps).length)
    : null;

  $: weekLabel = (() => {
    if (weekOffset === 0) return 'Esta semana';
    if (weekOffset === -1) return 'Semana pasada';
    return `Semana del ${fmtDate(weekDates[0])}`;
  })();
</script>

<div class="nutrition-page">

  <!-- ── Header ─────────────────────────────────────────── -->
  <div class="page-header">
    <div>
      <h1>Nutrición</h1>
      <p>Registra tus macros de cada día</p>
    </div>

    <div class="preset-toggle">
      <span class="preset-label">Objetivo:</span>
      <button class="preset-btn" class:active={preset === 'ON'}  on:click={() => (preset = 'ON')}>
        💪 ON <span class="preset-kcal">{kcalGoal} kcal</span>
      </button>
      <button class="preset-btn" class:active={preset === 'OFF'} on:click={() => (preset = 'OFF')}>
        😴 OFF
      </button>
    </div>
  </div>

  <!-- ── Week navigation ────────────────────────────────── -->
  <div class="week-nav-bar">
    <button class="week-arrow" on:click={() => weekOffset--}>‹</button>
    <span class="week-label">{weekLabel}</span>
    <button class="week-arrow" on:click={() => weekOffset++} disabled={weekOffset >= 0}>›</button>
  </div>

  <!-- ── Day tabs ───────────────────────────────────────── -->
  <div class="day-tabs">
    {#each weekDates as date, i}
      {@const d = $dailyMacros[date]}
      {@const hasMacros = d && (d.protein || d.carbs || d.fat)}
      {@const dayKcal = hasMacros ? computeKcal(d.carbs, d.protein, d.fat) : 0}
      {@const kcalPct = dayKcal ? pct(dayKcal, kcalGoal) : 0}
      <button
        class="day-tab"
        class:active={activeDate === date}
        class:today={date === today}
        on:click={() => (activeDate = date)}
      >
        <span class="dt-name">{DAY_SHORT[i]}</span>
        <span class="dt-date">{fmtDate(date)}</span>
        {#if hasMacros}
          <div class="dt-bar"><div class="dt-fill" style="width:{kcalPct}%"></div></div>
          <span class="dt-kcal">{dayKcal}</span>
        {:else}
          <span class="dt-empty">—</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- ── Day panel ──────────────────────────────────────── -->
  <div class="day-panel">

    <div class="inputs-card">
      <div class="inputs-header">
        <h2>{DAY_LABELS[weekDates.indexOf(activeDate)]} · {fmtDate(activeDate)}</h2>
        {#if activeDate === today}<span class="today-chip">Hoy</span>{/if}
      </div>

      <!-- Auto-calculated kcal display -->
      <div class="kcal-display">
        <div class="kcal-num-row">
          <span class="kcal-num">{kcalCalc ?? '—'}</span>
          <span class="kcal-of">/ {kcalGoal} kcal</span>
        </div>
        <div class="kcal-bar-wrap">
          <div class="kcal-bar-fill" style="width:{pct(kcalCalc, kcalGoal)}%" class:over={over(kcalCalc, kcalGoal)}></div>
        </div>
        <span class="kcal-hint" class:over={over(kcalCalc, kcalGoal)}>
          {#if kcalCalc != null}
            {over(kcalCalc, kcalGoal)
              ? `+${kcalCalc - kcalGoal} sobre objetivo`
              : `${kcalGoal - kcalCalc} restantes`}
          {:else}
            Calorías calculadas automáticamente
          {/if}
        </span>
      </div>

      <!-- Macro inputs -->
      <div class="macro-inputs">

        <!-- Protein -->
        <div class="macro-input-block">
          <label for="inp-protein">Proteínas</label>
          <div class="input-row">
            <input
              id="inp-protein"
              type="number"
              bind:value={form.protein}
              on:change={saveDay}
              placeholder="0"
              min="0"
            />
            <span class="unit">g</span>
          </div>
          <div class="macro-bar-wrap">
            <div class="macro-bar protein-bar" style="width:{pct(form.protein, goals.protein)}%"></div>
          </div>
          <span class="goal-hint" class:over={over(form.protein, goals.protein)}>
            Obj: {goals.protein}g
          </span>
        </div>

        <!-- Carbs -->
        <div class="macro-input-block">
          <label for="inp-carbs">Hidratos</label>
          <div class="input-row">
            <input
              id="inp-carbs"
              type="number"
              bind:value={form.carbs}
              on:change={saveDay}
              placeholder="0"
              min="0"
            />
            <span class="unit">g</span>
          </div>
          <div class="macro-bar-wrap">
            <div class="macro-bar carbs-bar" style="width:{pct(form.carbs, goals.carbs)}%"></div>
          </div>
          <span class="goal-hint">Obj: {goals.carbs}g</span>
        </div>

        <!-- Fat -->
        <div class="macro-input-block">
          <label for="inp-fat">Grasas</label>
          <div class="input-row">
            <input
              id="inp-fat"
              type="number"
              bind:value={form.fat}
              on:change={saveDay}
              placeholder="0"
              min="0"
            />
            <span class="unit">g</span>
          </div>
          <div class="macro-bar-wrap">
            <div class="macro-bar fat-bar" style="width:{pct(form.fat, goals.fat)}%"></div>
          </div>
          <span class="goal-hint">Obj: {goals.fat}g</span>
        </div>

        <!-- Steps -->
        <div class="macro-input-block steps-block">
          <label for="inp-steps">Pasos</label>
          <div class="input-row">
            <input
              id="inp-steps"
              type="number"
              bind:value={form.steps}
              on:change={saveDay}
              placeholder="0"
              min="0"
              step="100"
            />
            <span class="unit">pasos</span>
          </div>
          <div class="macro-bar-wrap">
            <div class="macro-bar steps-bar" style="width:{pct(form.steps, 10000)}%"></div>
          </div>
          <span class="goal-hint">Obj: 10 000</span>
        </div>

      </div>

      {#if form.protein !== '' || form.carbs !== '' || form.fat !== '' || form.steps !== ''}
        <button class="clear-day-btn" on:click={clearDay}>Borrar día</button>
      {/if}
    </div>

    <!-- Weekly summary -->
    {#if weekEntries.length > 0}
      <div class="week-summary">
        <h3>Resumen semanal ({weekEntries.length} días)</h3>
        <div class="summary-grid">
          <div class="summary-stat">
            <span class="ss-val kcal">{avgKcal ?? '—'}</span>
            <span class="ss-label">kcal/día</span>
          </div>
          <div class="summary-stat">
            <span class="ss-val prot">{avgProtein ?? '—'}g</span>
            <span class="ss-label">prot/día</span>
          </div>
          {#if avgSteps}
            <div class="summary-stat">
              <span class="ss-val steps">{avgSteps.toLocaleString('es-ES')}</span>
              <span class="ss-label">pasos/día</span>
            </div>
          {/if}
          <div class="summary-stat">
            <span class="ss-val">{weekEntries.length}</span>
            <span class="ss-label">días log</span>
          </div>
        </div>

        <div class="week-grid">
          {#each weekDates as date, i}
            {@const d = $dailyMacros[date]}
            {@const dk = d ? computeKcal(d.carbs, d.protein, d.fat) : 0}
            <div class="wg-cell" class:today={date === today} class:active={date === activeDate} on:click={() => (activeDate = date)}>
              <span class="wg-day">{DAY_SHORT[i]}</span>
              {#if dk > 0}
                <span class="wg-val kcal">{dk}</span>
                <span class="wg-val prot">{d.protein ?? '—'}P</span>
                {#if d.steps}
                  <span class="wg-val steps">{(d.steps/1000).toFixed(1)}k</span>
                {/if}
              {:else}
                <span class="wg-empty">—</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .nutrition-page {
    max-width: 860px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  h1 { font-size: 1.75rem; font-weight: 800; color: #e2e8f0; margin: 0 0 0.2rem; }
  .page-header p { color: #6b9bd2; margin: 0; font-size: 0.9rem; }

  .preset-toggle { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
  .preset-label  { font-size: 0.78rem; color: #6b7db3; }

  .preset-btn {
    display: flex; align-items: center; gap: 0.3rem;
    padding: 0.4rem 0.8rem;
    background: #1a1a2e;
    border: 1.5px solid #2d3561;
    border-radius: 8px;
    color: #6b7db3;
    font-size: 0.8rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }

  .preset-btn.active { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.1); }
  .preset-kcal { font-weight: 400; font-size: 0.72rem; }

  /* Week nav */
  .week-nav-bar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }

  .week-arrow {
    background: #1a1a2e; border: 1px solid #2d3561; border-radius: 8px;
    color: #a8b2d8; width: 32px; height: 32px; font-size: 1.2rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }

  .week-arrow:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; }
  .week-arrow:disabled { opacity: 0.3; cursor: default; }
  .week-label { font-size: 0.85rem; color: #8892b0; font-weight: 600; }

  /* Day tabs */
  .day-tabs {
    display: grid; grid-template-columns: repeat(7, 1fr);
    gap: 0.4rem; margin-bottom: 1.25rem;
  }

  .day-tab {
    display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
    padding: 0.6rem 0.25rem;
    background: #1a1a2e; border: 1.5px solid #2d3561; border-radius: 10px;
    cursor: pointer; transition: all 0.2s;
  }

  .day-tab:hover  { border-color: #3b82f6; }
  .day-tab.today  { border-color: #2d5a9e; }
  .day-tab.active { border-color: #3b82f6; background: rgba(59,130,246,0.12); }

  .dt-name  { font-size: 0.72rem; font-weight: 700; color: #6b9bd2; }
  .day-tab.active .dt-name { color: #60a5fa; }
  .dt-date  { font-size: 0.65rem; color: #4a6fa5; }

  .dt-bar   { width: 80%; height: 4px; background: #0a1929; border-radius: 2px; overflow: hidden; margin-top: 0.2rem; }
  .dt-fill  { height: 100%; background: #3b82f6; border-radius: 2px; }
  .dt-kcal  { font-size: 0.65rem; color: #fbbf24; font-weight: 700; }
  .dt-empty { font-size: 0.8rem; color: #2d3561; margin-top: 0.25rem; }

  /* Day panel */
  .day-panel { display: flex; flex-direction: column; gap: 1rem; }

  .inputs-card {
    background: #1a1a2e; border: 1px solid #2d3561;
    border-radius: 16px; padding: 1.25rem;
  }

  .inputs-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem; }
  h2 { font-size: 1rem; font-weight: 700; color: #e2e8f0; margin: 0; }

  .today-chip {
    padding: 0.1rem 0.55rem;
    background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4);
    border-radius: 20px; font-size: 0.7rem; color: #60a5fa; font-weight: 700;
  }

  /* Kcal auto-display */
  .kcal-display {
    background: #0a1929;
    border: 1px solid #1e2a45;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
  }

  .kcal-num-row { display: flex; align-items: baseline; gap: 0.4rem; margin-bottom: 0.4rem; }
  .kcal-num  { font-size: 2rem; font-weight: 800; color: #fbbf24; }
  .kcal-of   { font-size: 0.82rem; color: #4a6fa5; }

  .kcal-bar-wrap { height: 6px; background: #111827; border-radius: 3px; overflow: hidden; margin-bottom: 0.35rem; }
  .kcal-bar-fill {
    height: 100%; background: linear-gradient(90deg, #3b82f6, #fbbf24);
    border-radius: 3px; transition: width 0.4s ease;
  }
  .kcal-bar-fill.over { background: linear-gradient(90deg, #f97316, #ef4444); }

  .kcal-hint { font-size: 0.72rem; color: #4a5568; }
  .kcal-hint.over { color: #ef4444; }

  /* Macro inputs grid */
  .macro-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 0.75rem;
  }

  .macro-input-block { display: flex; flex-direction: column; gap: 0.3rem; }

  .macro-input-block label {
    font-size: 0.75rem; font-weight: 700; color: #6b7db3;
    text-transform: uppercase; letter-spacing: 0.04em;
  }

  .input-row { position: relative; display: flex; align-items: center; }

  .input-row input {
    width: 100%;
    padding: 0.65rem 2.5rem 0.65rem 0.75rem;
    background: #0a1929; border: 1.5px solid #2d3561; border-radius: 8px;
    color: #e2e8f0; font-size: 1.1rem; font-weight: 700;
    outline: none; transition: border-color 0.2s; box-sizing: border-box;
  }

  .input-row input:focus { border-color: #3b82f6; }
  .input-row input:not(:placeholder-shown) { border-color: rgba(59,130,246,0.5); }

  .unit { position: absolute; right: 0.6rem; font-size: 0.68rem; color: #4a5568; pointer-events: none; }

  .macro-bar-wrap { height: 4px; background: #0a1929; border-radius: 2px; overflow: hidden; }
  .macro-bar { height: 100%; border-radius: 2px; transition: width 0.3s ease; }

  .protein-bar { background: #10b981; }
  .carbs-bar   { background: #3b82f6; }
  .fat-bar     { background: #f97316; }
  .steps-bar   { background: #a78bfa; }

  .goal-hint { font-size: 0.68rem; color: #4a5568; }
  .goal-hint.over { color: #ef4444; }

  /* Steps block a bit wider */
  .steps-block .input-row input { font-size: 0.95rem; padding-right: 3.5rem; }

  .clear-day-btn {
    margin-top: 0.75rem;
    padding: 0.35rem 0.85rem;
    background: transparent; border: 1px solid #2d3561; border-radius: 6px;
    color: #6b7db3; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;
  }
  .clear-day-btn:hover { border-color: #ef4444; color: #ef4444; }

  /* Week summary */
  .week-summary {
    background: #1a1a2e; border: 1px solid #2d3561;
    border-radius: 16px; padding: 1.1rem 1.25rem;
  }

  .week-summary h3 {
    font-size: 0.75rem; font-weight: 700; color: #6b7db3;
    text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.9rem;
  }

  .summary-grid { display: flex; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .summary-stat { display: flex; flex-direction: column; gap: 0.1rem; }

  .ss-val { font-size: 1.4rem; font-weight: 800; color: #a8b2d8; }
  .ss-val.kcal  { color: #fbbf24; }
  .ss-val.prot  { color: #10b981; }
  .ss-val.steps { color: #a78bfa; }
  .ss-label { font-size: 0.72rem; color: #4a5568; }

  .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.35rem; }

  .wg-cell {
    background: #0a1929; border: 1px solid #1e2a45; border-radius: 8px;
    padding: 0.4rem 0.25rem; text-align: center; cursor: pointer;
    transition: all 0.15s; display: flex; flex-direction: column; gap: 0.1rem;
  }

  .wg-cell:hover  { border-color: #3b82f6; }
  .wg-cell.today  { border-color: #2d5a9e; }
  .wg-cell.active { border-color: #3b82f6; background: rgba(59,130,246,0.08); }

  .wg-day { font-size: 0.62rem; color: #4a6fa5; font-weight: 700; }
  .wg-val { font-size: 0.63rem; font-weight: 700; }
  .wg-val.kcal  { color: #fbbf24; }
  .wg-val.prot  { color: #10b981; }
  .wg-val.steps { color: #a78bfa; }
  .wg-empty { font-size: 0.7rem; color: #1e2a45; }

  @media (max-width: 700px) {
    .macro-inputs { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 480px) {
    .day-tabs { gap: 0.25rem; }
    .dt-date  { display: none; }
    .preset-toggle { flex-wrap: wrap; }
  }
</style>
