<script>
  import {
    medidas,
    addMedida, removeMedida,
    groupByWeek, calcWeekAvg
  } from '../lib/stores/progreso.js';
  import { dailyMacros, computeKcal } from '../lib/stores/dailyMacros.js';

  // Tabs
  let tab = 'progreso'; // 'progreso' | 'medidas'

  // Medidas: new measurement form
  let showMedidasForm = false;
  let mForm = emptyMedidasForm();

  function emptyMedidasForm() {
    return { mes: '', cintura: '', peso: '', notes: '' };
  }

  function submitMedida() {
    if (!mForm.mes.trim()) return;
    addMedida({
      mes: mForm.mes.trim(),
      cintura: mForm.cintura ? Number(mForm.cintura) : null,
      peso: mForm.peso ? Number(mForm.peso) : null,
      notes: mForm.notes.trim()
    });
    mForm = emptyMedidasForm();
    showMedidasForm = false;
  }

  // Convert dailyMacros to array for charts and weekly table
  $: nutritionEntries = Object.entries($dailyMacros)
    .filter(([_, d]) => d && (d.protein || d.carbs || d.fat || d.steps || d.weight))
    .map(([date, d]) => ({
      date,
      kcal: computeKcal(d.carbs, d.protein, d.fat),
      carbs: d.carbs ?? null,
      protein: d.protein ?? null,
      fat: d.fat ?? null,
      steps: d.steps ?? null,
      weight: d.weight ?? null
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Derived: grouped by week (descending)
  $: weekGroups = Object.entries(groupByWeek(nutritionEntries))
    .sort(([a], [b]) => b.localeCompare(a));

  // Chart: last 30 days kcal
  $: kcalData = nutritionEntries
    .filter(e => e.kcal > 0)
    .slice(-30);

  $: maxKcal = kcalData.length ? Math.max(...kcalData.map(d => d.kcal)) + 100 : 3000;
  $: minKcal = kcalData.length ? Math.max(0, Math.min(...kcalData.map(d => d.kcal)) - 200) : 0;
  $: avgKcal = kcalData.length ? Math.round(kcalData.reduce((s, d) => s + d.kcal, 0) / kcalData.length) : 0;
  $: kcalAreaPoints = kcalData.length > 1 ? kcalData.map((d, i) => {
    const x = (i / (kcalData.length - 1)) * 400;
    const y = 100 - ((d.kcal - minKcal) / (maxKcal - minKcal)) * 100;
    return `${x},${y}`;
  }) : [];
  $: kcalLinePoints = kcalAreaPoints.join(' ');

  // Chart: last 14 days steps
  $: stepsData = nutritionEntries
    .filter(e => e.steps !== null && e.steps !== undefined && e.steps > 0)
    .slice(-14);

  $: maxSteps = stepsData.length ? Math.max(...stepsData.map(d => d.steps)) : 10000;
  $: avgSteps = stepsData.length ? Math.round(stepsData.reduce((s, d) => s + d.steps, 0) / stepsData.length) : 0;

  // Chart: last 60 days weight
  $: weightData = nutritionEntries
    .filter(e => e.weight !== null && e.weight !== undefined)
    .slice(-60);

  $: maxWeight = weightData.length ? Math.max(...weightData.map(d => d.weight)) + 1 : 100;
  $: minWeight = weightData.length ? Math.max(0, Math.min(...weightData.map(d => d.weight)) - 1) : 50;
  $: avgWeight = weightData.length
    ? (weightData.reduce((s, d) => s + d.weight, 0) / weightData.length).toFixed(1)
    : 0;
  $: weightAreaPoints = weightData.length > 1 ? weightData.map((d, i) => {
    const x = (i / (weightData.length - 1)) * 400;
    const y = 100 - ((d.weight - minWeight) / (maxWeight - minWeight)) * 100;
    return `${x},${y}`;
  }) : [];
  $: weightLinePoints = weightAreaPoints.join(' ');

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  function formatWeekRange(mondayStr) {
    const mon = new Date(mondayStr + 'T00:00:00');
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const opts = { day: 'numeric', month: 'short' };
    return `${mon.toLocaleDateString('es-ES', opts)} – ${sun.toLocaleDateString('es-ES', opts)}`;
  }
</script>

<div class="progreso-page">
  <div class="page-header">
    <div>
      <h1>Progreso</h1>
      <p>Historial semanal y medidas corporales</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tab-btn" class:active={tab === 'progreso'} on:click={() => (tab = 'progreso')}>
      📊 Seguimiento semanal
    </button>
    <button class="tab-btn" class:active={tab === 'medidas'} on:click={() => (tab = 'medidas')}>
      📏 Medidas corporales
    </button>
  </div>

  <!-- ════════════════════════════════════════════════════════
       TAB: PROGRESO
  ═══════════════════════════════════════════════════════════ -->
  {#if tab === 'progreso'}
    <div class="progreso-content">

      <!-- Kcal chart -->
      {#if kcalData.length > 1}
        <div class="chart-card">
          <div class="chart-header">
            <h3>Evolución de calorías</h3>
            <div class="chart-stat">
              <span class="cs-label">Media</span>
              <span class="cs-val kcal">{avgKcal} kcal</span>
            </div>
          </div>
          <div class="line-chart-wrap">
            <svg class="line-svg" viewBox="0 0 400 100" preserveAspectRatio="none">
              {#each [0, 25, 50, 75, 100] as y}
                <line x1="0" y1={y} x2="400" y2={y} stroke="#1e2a45" stroke-width="0.5" />
              {/each}
              <defs>
                <linearGradient id="kcalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#fbbf24" />
                  <stop offset="100%" stop-color="#fbbf24" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,100 ${kcalAreaPoints.join(' ')} 400,100`}
                fill="url(#kcalGrad)"
                opacity="0.15"
              />
              <polyline
                points={kcalLinePoints}
                fill="none" stroke="#fbbf24" stroke-width="2" stroke-linejoin="round"
              />
              {#each kcalData as d, i}
                {@const x = (i / (kcalData.length - 1)) * 400}
                {@const y = 100 - ((d.kcal - minKcal) / (maxKcal - minKcal)) * 100}
                <circle cx={x} cy={y} r="3" fill="#fbbf24" />
              {/each}
            </svg>
            <div class="chart-x-labels">
              {#each kcalData as d, i}
                {#if i === 0 || i === kcalData.length - 1 || kcalData.length <= 10}
                  <span>{formatDate(d.date)}</span>
                {:else}
                  <span></span>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Steps bar chart -->
      {#if stepsData.length > 0}
        <div class="chart-card">
          <div class="chart-header">
            <h3>Pasos diarios</h3>
            <div class="chart-stat">
              <span class="cs-label">Media</span>
              <span class="cs-val steps">{avgSteps.toLocaleString()} pasos</span>
            </div>
          </div>
          <div class="steps-chart">
            {#each stepsData as d}
              {@const pct = (d.steps / maxSteps) * 100}
              {@const goal10k = d.steps >= 10000}
              <div class="steps-bar-col">
                <span class="steps-bar-val">{d.steps >= 1000 ? `${(d.steps/1000).toFixed(1)}k` : d.steps}</span>
                <div class="steps-bar-track">
                  <div
                    class="steps-bar-fill"
                    class:reached={goal10k}
                    style="height:{pct}%"
                  ></div>
                </div>
                <span class="steps-bar-label">{formatDate(d.date).split(' ')[0]}</span>
              </div>
            {/each}
          </div>
          <p class="chart-note">Meta: 10.000 pasos (barras verdes)</p>
        </div>
      {/if}

      <!-- Weight chart -->
      {#if weightData.length > 1}
        <div class="chart-card">
          <div class="chart-header">
            <h3>Evolución del peso</h3>
            <div class="chart-stat">
              <span class="cs-label">Media</span>
              <span class="cs-val weight-val">{avgWeight} kg</span>
            </div>
          </div>
          <div class="line-chart-wrap">
            <svg class="line-svg" viewBox="0 0 400 100" preserveAspectRatio="none">
              {#each [0, 25, 50, 75, 100] as y}
                <line x1="0" y1={y} x2="400" y2={y} stroke="#1e2a45" stroke-width="0.5" />
              {/each}
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#34d399" />
                  <stop offset="100%" stop-color="#34d399" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,100 ${weightAreaPoints.join(' ')} 400,100`}
                fill="url(#weightGrad)"
                opacity="0.15"
              />
              <polyline
                points={weightLinePoints}
                fill="none" stroke="#34d399" stroke-width="2" stroke-linejoin="round"
              />
              {#each weightData as d, i}
                {@const x = (i / (weightData.length - 1)) * 400}
                {@const y = 100 - ((d.weight - minWeight) / (maxWeight - minWeight)) * 100}
                <circle cx={x} cy={y} r="3" fill="#34d399" />
              {/each}
            </svg>
            <div class="chart-x-labels">
              {#each weightData as d, i}
                {#if i === 0 || i === weightData.length - 1 || weightData.length <= 10}
                  <span>{formatDate(d.date)}</span>
                {:else}
                  <span></span>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Empty state -->
      {#if weekGroups.length === 0}
        <div class="empty-state">
          <div class="empty-icon">🥗</div>
          <p>Sin datos de nutrición</p>
          <span>Registra tus macros en el apartado Nutrición para ver el seguimiento aquí</span>
        </div>
      {/if}

      <!-- Weeks -->
      {#each weekGroups as [mondayKey, entries]}
        {@const avg = calcWeekAvg(entries)}
        <div class="week-block">
          <div class="week-title">
            <span class="week-range">{formatWeekRange(mondayKey)}</span>
            {#if avg}
              <div class="week-avg">
                <span class="avg-chip">Ø {avg.kcal} kcal</span>
                <span class="avg-chip prot">Ø {avg.protein}g P</span>
              </div>
            {/if}
          </div>

          <div class="week-table">
            <div class="table-head">
              <span>Fecha</span>
              <span>Kcal</span>
              <span>Hidr</span>
              <span>Prot</span>
              <span>Gras</span>
              <span>Peso</span>
              <span>Pasos</span>
            </div>
            {#each entries.sort((a,b) => a.date.localeCompare(b.date)) as entry}
              <div class="table-row">
                <span class="td-date">{formatDate(entry.date)}</span>
                <span class="td-num">{entry.kcal > 0 ? entry.kcal : '—'}</span>
                <span class="td-num carb">{entry.carbs ?? '—'}</span>
                <span class="td-num prot">{entry.protein ?? '—'}</span>
                <span class="td-num fat">{entry.fat ?? '—'}</span>
                <span class="td-num weight">{entry.weight ? `${entry.weight}kg` : '—'}</span>
                <span class="td-num steps">{entry.steps ? entry.steps.toLocaleString() : '—'}</span>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

  <!-- ════════════════════════════════════════════════════════
       TAB: MEDIDAS
  ═══════════════════════════════════════════════════════════ -->
  {:else if tab === 'medidas'}
    <div class="medidas-content">
      <div class="section-header">
        <h2>Medidas corporales</h2>
        <button class="btn-add-entry" on:click={() => (showMedidasForm = !showMedidasForm)}>
          {showMedidasForm ? '✕ Cancelar' : '+ Añadir medición'}
        </button>
      </div>

      {#if showMedidasForm}
        <div class="entry-form">
          <div class="form-row">
            <div class="form-field">
              <label for="mf-mes">Mes / Período</label>
              <input id="mf-mes" type="text" bind:value={mForm.mes} placeholder="Marzo 2026" />
            </div>
            <div class="form-field">
              <label for="mf-cintura">Cintura (cm)</label>
              <input id="mf-cintura" type="number" bind:value={mForm.cintura} placeholder="90" step="0.5" />
            </div>
            <div class="form-field">
              <label for="mf-peso">Peso (kg)</label>
              <input id="mf-peso" type="number" bind:value={mForm.peso} placeholder="90" step="0.1" />
            </div>
            <div class="form-field">
              <label for="mf-notes">Notas</label>
              <input id="mf-notes" type="text" bind:value={mForm.notes} placeholder="Observaciones..." />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-save blue" on:click={submitMedida} disabled={!mForm.mes.trim()}>
              Guardar medición
            </button>
          </div>
        </div>
      {/if}

      <!-- Waist chart -->
      {#if $medidas.filter(m => m.cintura).length > 1}
        {@const cData = $medidas.filter(m => m.cintura)}
        {@const maxC = Math.max(...cData.map(m => m.cintura)) + 5}
        {@const minC = Math.min(...cData.map(m => m.cintura)) - 5}
        <div class="medida-chart-card">
          <h3>Evolución de cintura</h3>
          <div class="bar-chart-h">
            {#each cData as m}
              {@const pct = ((m.cintura - minC) / (maxC - minC)) * 100}
              <div class="chart-row">
                <span class="chart-row-label">{m.mes}</span>
                <div class="chart-row-track">
                  <div class="chart-row-bar" style="width:{pct}%"></div>
                </div>
                <span class="chart-row-val">{m.cintura} cm</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Weight from medidas chart -->
      {#if $medidas.filter(m => m.peso).length > 1}
        {@const pData = $medidas.filter(m => m.peso)}
        {@const maxP = Math.max(...pData.map(m => m.peso)) + 2}
        {@const minP = Math.min(...pData.map(m => m.peso)) - 2}
        <div class="medida-chart-card">
          <h3>Evolución del peso (mediciones mensuales)</h3>
          <div class="line-chart-wrap">
            <svg class="line-svg" viewBox="0 0 400 100" preserveAspectRatio="none">
              {#each [0, 25, 50, 75, 100] as y}
                <line x1="0" y1={y} x2="400" y2={y} stroke="#1e2a45" stroke-width="0.5" />
              {/each}
              <polyline
                points={pData.map((d, i) => {
                  const x = pData.length > 1 ? (i / (pData.length - 1)) * 400 : 200;
                  const y = 100 - ((d.peso - minP) / (maxP - minP)) * 100;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round"
              />
              {#each pData as d, i}
                {@const x = pData.length > 1 ? (i / (pData.length - 1)) * 400 : 200}
                {@const y = 100 - ((d.peso - minP) / (maxP - minP)) * 100}
                <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                <circle cx={x} cy={y} r="7" fill="#3b82f6" fill-opacity="0.2" />
              {/each}
            </svg>
            <div class="chart-x-labels">
              {#each pData as d}
                <span>{d.mes}</span>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Measurements table -->
      {#if $medidas.length === 0}
        <div class="empty-state">
          <div class="empty-icon">📏</div>
          <p>Sin mediciones registradas</p>
          <span>Añade tu primera medición corporal</span>
        </div>
      {:else}
        <div class="medidas-table">
          <div class="table-head">
            <span>Período</span>
            <span>Cintura (cm)</span>
            <span>Peso (kg)</span>
            <span>Notas</span>
            <span></span>
          </div>
          {#each $medidas as m}
            <div class="table-row medida-row">
              <span class="td-period">{m.mes}</span>
              <span class="td-medida cintura">
                {m.cintura ?? '—'}
                {#if m.cintura}
                  <span class="medida-unit">cm</span>
                {/if}
              </span>
              <span class="td-medida">
                {m.peso ?? '—'}
                {#if m.peso}
                  <span class="medida-unit">kg</span>
                {/if}
              </span>
              <span class="td-notes">{m.notes || '—'}</span>
              <div class="td-actions">
                <button class="icon-btn del" on:click={() => removeMedida(m.id)} title="Eliminar">🗑️</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  {/if}
</div>

<style>
  .progreso-page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .page-header h1 {
    font-size: 1.8rem; font-weight: 800; color: #e2e8f0; margin: 0 0 0.2rem;
  }
  .page-header p { color: #6b7db3; margin: 0 0 1.5rem; font-size: 0.9rem; }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #1e2a45;
    padding-bottom: 0;
  }

  .tab-btn {
    padding: 0.6rem 1.2rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #6b7db3;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: -1px;
  }

  .tab-btn:hover { color: #a8b2d8; }

  .tab-btn.active {
    color: #e94560;
    border-bottom-color: #e94560;
  }

  /* Charts */
  .chart-card {
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 16px;
    padding: 1.25rem;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .chart-header h3 {
    font-size: 0.82rem;
    font-weight: 700;
    color: #6b7db3;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .chart-stat {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .cs-label { font-size: 0.75rem; color: #4a5568; }

  .cs-val {
    font-size: 1.2rem;
    font-weight: 800;
    color: #e2e8f0;
  }

  .cs-val.kcal { color: #fbbf24; }
  .cs-val.steps { color: #6b9bd2; font-size: 1rem; }

  .line-chart-wrap { position: relative; }

  .line-svg {
    width: 100%;
    height: 120px;
    overflow: visible;
  }

  .chart-x-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.4rem;
  }

  .chart-x-labels span {
    font-size: 0.68rem;
    color: #4a5568;
  }

  .chart-note {
    margin: 0.5rem 0 0;
    font-size: 0.72rem;
    color: #4a5568;
    text-align: right;
  }

  /* Steps bar chart */
  .steps-chart {
    display: flex;
    gap: 0.35rem;
    align-items: flex-end;
    height: 80px;
    margin-top: 0.5rem;
  }

  .steps-bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    height: 100%;
    justify-content: flex-end;
  }

  .steps-bar-val {
    font-size: 0.55rem;
    color: #4a5568;
    white-space: nowrap;
  }

  .steps-bar-track {
    width: 100%;
    flex: 1;
    background: #0a1929;
    border-radius: 3px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
  }

  .steps-bar-fill {
    width: 100%;
    background: #2d5a9e;
    border-radius: 3px 3px 0 0;
    transition: height 0.3s ease;
  }

  .steps-bar-fill.reached { background: #10b981; }

  .steps-bar-label {
    font-size: 0.55rem;
    color: #2d3561;
    white-space: nowrap;
  }

  /* Section header */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .section-header h2 {
    font-size: 1rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0;
  }

  .btn-add-entry {
    padding: 0.45rem 1rem;
    background: rgba(233,69,96,0.12);
    border: 1px solid rgba(233,69,96,0.35);
    border-radius: 8px;
    color: #e94560;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-add-entry:hover { background: rgba(233,69,96,0.2); }

  /* Entry form */
  .entry-form {
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 12px;
    padding: 1.1rem;
    margin-bottom: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-field label { font-size: 0.75rem; color: #6b7db3; font-weight: 500; }

  .form-field input, .form-field select {
    padding: 0.45rem 0.65rem;
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 7px;
    color: #e2e8f0;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
  }

  .form-field input:focus, .form-field select:focus { border-color: #e94560; }

  .form-actions { display: flex; justify-content: flex-end; }

  .btn-save {
    padding: 0.5rem 1.5rem;
    background: #e94560; border: none; border-radius: 8px;
    color: white; font-size: 0.9rem; font-weight: 700; cursor: pointer;
    transition: background 0.2s;
  }
  .btn-save:hover:not(:disabled) { background: #c73652; }
  .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-save.blue { background: #3b82f6; }
  .btn-save.blue:hover:not(:disabled) { background: #2563eb; }

  /* Week block */
  .progreso-content, .medidas-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .week-block {
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 14px;
    overflow: hidden;
  }

  .week-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #1e2a45;
    background: rgba(255,255,255,0.02);
  }

  .week-range { font-size: 0.82rem; font-weight: 700; color: #a8b2d8; }

  .week-avg { display: flex; gap: 0.4rem; }

  .avg-chip {
    padding: 0.15rem 0.6rem;
    background: #0f1927;
    border-radius: 20px;
    font-size: 0.72rem;
    color: #fbbf24;
    font-weight: 600;
  }

  .avg-chip.prot { color: #10b981; }

  /* Table */
  .week-table, .medidas-table {
    display: flex;
    flex-direction: column;
  }

  .week-table .table-head,
  .week-table .table-row {
    display: grid;
    grid-template-columns: 100px 65px 50px 50px 50px 55px 80px;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
  }

  .week-table .table-head {
    background: #0f1927;
    font-size: 0.68rem;
    font-weight: 700;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .week-table .table-row {
    align-items: center;
    border-top: 1px solid #1e2a45;
    transition: background 0.15s;
  }

  .week-table .table-row:hover { background: rgba(255,255,255,0.02); }

  .medidas-table .table-head {
    display: grid;
    grid-template-columns: 140px 130px 100px 1fr 50px;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #0f1927;
    font-size: 0.68rem;
    font-weight: 700;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .medidas-table .table-row {
    display: grid;
    grid-template-columns: 140px 130px 100px 1fr 50px;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
    align-items: center;
    border-top: 1px solid #1e2a45;
    transition: background 0.15s;
  }

  .medidas-table .table-row:hover { background: rgba(255,255,255,0.02); }

  .td-date { font-size: 0.8rem; color: #8892b0; font-weight: 500; }

  .td-num { font-size: 0.82rem; color: #a8b2d8; font-weight: 500; }
  .td-num.carb { color: #fbbf24; }
  .td-num.prot { color: #10b981; }
  .td-num.fat { color: #f97316; }
  .td-num.weight { color: #34d399; }
  .td-num.steps { color: #6b9bd2; }
  .cs-val.weight-val { color: #34d399; }

  .td-actions { display: flex; gap: 0.25rem; }

  .icon-btn {
    background: none; border: none; cursor: pointer;
    font-size: 0.78rem; opacity: 0.45; padding: 0.2rem;
    border-radius: 4px; transition: all 0.2s;
  }
  .icon-btn:hover { opacity: 1; background: rgba(255,255,255,0.08); }
  .icon-btn.del:hover { background: rgba(239,68,68,0.2); }

  /* Medidas */
  .td-period { font-size: 0.85rem; color: #e2e8f0; font-weight: 600; }

  .td-medida {
    font-size: 1rem;
    font-weight: 700;
    color: #3b82f6;
    display: flex;
    align-items: baseline;
    gap: 0.2rem;
  }

  .td-medida.cintura { color: #e94560; }

  .medida-unit { font-size: 0.72rem; font-weight: 400; color: #6b7db3; }

  .td-notes { font-size: 0.8rem; color: #6b7db3; }

  /* Medidas chart */
  .medida-chart-card {
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 14px;
    padding: 1.25rem;
  }

  .medida-chart-card h3 {
    font-size: 0.82rem;
    font-weight: 700;
    color: #6b7db3;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 1rem;
  }

  .bar-chart-h { display: flex; flex-direction: column; gap: 0.6rem; }

  .chart-row { display: flex; align-items: center; gap: 0.75rem; }

  .chart-row-label { font-size: 0.8rem; color: #8892b0; min-width: 90px; }

  .chart-row-track {
    flex: 1; height: 10px; background: #0f1927; border-radius: 5px; overflow: hidden;
  }

  .chart-row-bar {
    height: 100%; background: #e94560; border-radius: 5px; transition: width 0.4s ease;
  }

  .chart-row-val { font-size: 0.82rem; font-weight: 700; color: #e94560; min-width: 55px; text-align: right; }

  /* Empty state */
  .empty-state {
    background: #1a1a2e;
    border: 1px dashed #2d3561;
    border-radius: 14px;
    padding: 3rem;
    text-align: center;
  }
  .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .empty-state p { color: #6b7db3; font-size: 1rem; font-weight: 600; margin: 0 0 0.25rem; }
  .empty-state span { font-size: 0.85rem; color: #4a5568; }

  @media (max-width: 700px) {
    .form-row { grid-template-columns: 1fr 1fr; }
    .week-table .table-head,
    .week-table .table-row {
      grid-template-columns: 68px 52px 38px 38px 38px 48px 58px;
      font-size: 0.68rem;
      gap: 0.25rem;
      padding: 0.45rem 0.5rem;
    }
  }
</style>
