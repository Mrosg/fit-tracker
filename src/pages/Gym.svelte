<script>
  import { routine, selectedSession, GYM_SESSIONS } from '../lib/stores/gym.js';
  import {
    gymCurrentSets, gymHistory,
    setKg, setReps, saveSession, clearCurrentSession, addSet
  } from '../lib/stores/gymLog.js';

  const SESSION_INFO = {
    PUSH: { icon: '🏋️', color: '#e94560', desc: 'Pecho · Hombros · Tríceps' },
    LEG1: { icon: '🦵', color: '#dc2626', desc: 'Gemelos · Aductor · Isquios · Cuádriceps' },
    PULL: { icon: '💪', color: '#0f72ea', desc: 'Espalda · Bíceps · Deltoides post.' },
    LEG2: { icon: '🦵', color: '#db2777', desc: 'SLDL · Isquios · Glúteos · Prensa' },
  };

  const TECHNIQUE_LABELS = {
    'DROP SET': { label: 'DS',  color: '#fbbf24' },
    'PIRÁMIDE': { label: 'PIR', color: '#a78bfa' },
    'RECTA':    { label: null,  color: null },
  };

  $: session   = $selectedSession;
  $: info      = SESSION_INFO[session];
  $: exercises = $routine[session]?.exercises || [];
  $: current   = $gymCurrentSets[session] || {};

  // Last saved entry for this session type
  $: lastEntry = $gymHistory.find(h => h.session === session) || null;

  function getDisplayCount(exId, routineDefault) {
    const stored = current[exId] || [];
    return stored.length > 0 ? stored.length : routineDefault;
  }

  function getKg(exId, setIdx)   { return (current[exId] || [])[setIdx]?.kg   || ''; }
  function getReps(exId, setIdx) { return (current[exId] || [])[setIdx]?.reps || ''; }

  function getLastKg(exId, setIdx)   { return lastEntry?.sets[exId]?.[setIdx]?.kg   || ''; }
  function getLastReps(exId, setIdx) { return lastEntry?.sets[exId]?.[setIdx]?.reps || ''; }

  function handleKg(exId, setIdx, e)   { setKg(session, exId, setIdx, e.target.value); }
  function handleReps(exId, setIdx, e) { setReps(session, exId, setIdx, e.target.value); }

  function handleClear() {
    if (confirm(`¿Borrar todos los datos de la sesión ${session}?`)) clearCurrentSession(session);
  }

  let saveState = 'idle'; // 'idle' | 'saved'
  function handleSave() {
    if (filledSets === 0) return;
    saveSession(session, $gymCurrentSets[session] || {});
    clearCurrentSession(session);
    saveState = 'saved';
    setTimeout(() => (saveState = 'idle'), 3000);
  }

  // Progress counters (dynamic set counts)
  $: filledSets = exercises.reduce((n, ex) => {
    return n + (current[ex.id] || []).filter(v => v?.kg?.trim()).length;
  }, 0);
  $: totalSets = exercises.reduce((n, ex) => {
    const stored = current[ex.id] || [];
    return n + (stored.length > 0 ? stored.length : Number(ex.sets) || 3);
  }, 0);

  // Last session date label
  $: lastDateLabel = lastEntry
    ? new Date(lastEntry.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  // ── Calendar ─────────────────────────────────────────────
  let calMonthOffset = 0;
  let selectedCalDay = null;

  function prevMonth() { calMonthOffset -= 1; selectedCalDay = null; }
  function nextMonth() { calMonthOffset += 1; selectedCalDay = null; }

  $: calDate = (() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + calMonthOffset);
    return d;
  })();
  $: calYear     = calDate.getFullYear();
  $: calMonthNum = calDate.getMonth();
  $: calMonthLabel = calDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  $: todayStr = new Date().toISOString().split('T')[0];

  $: calCells = (() => {
    const daysInMonth = new Date(calYear, calMonthNum + 1, 0).getDate();
    const startDow = (new Date(calYear, calMonthNum, 1).getDay() + 6) % 7; // 0=Mon
    const cells = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${calYear}-${String(calMonthNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ d, dateStr: ds, entries: $gymHistory.filter(h => h.date === ds) });
    }
    return cells;
  })();

  $: calDayEntries = selectedCalDay ? $gymHistory.filter(h => h.date === selectedCalDay) : [];

  function getExName(sess, exId) {
    return $routine[sess]?.exercises?.find(e => e.id === exId)?.name || exId;
  }

  function toggleCalDay(dateStr) {
    selectedCalDay = selectedCalDay === dateStr ? null : dateStr;
  }
</script>

<div class="gym-page">

  <!-- ── Header ─────────────────────────────────────────── -->
  <div class="page-header">
    <div>
      <h1>Gimnasio</h1>
      <p>Rellena los pesos y repeticiones de cada serie</p>
    </div>
    {#if filledSets > 0}
      <div class="progress-pill">
        <span>{filledSets} / {totalSets} series</span>
        <div class="pill-bar"><div class="pill-fill" style="width:{(filledSets/totalSets)*100}%"></div></div>
      </div>
    {/if}
  </div>

  <!-- ── Session tabs ───────────────────────────────────── -->
  <div class="session-tabs">
    {#each GYM_SESSIONS as s}
      {@const si = SESSION_INFO[s]}
      {@const done = Object.values($gymCurrentSets[s] || {}).flat().filter(v => v?.kg?.trim()).length}
      <button
        class="session-tab"
        class:active={session === s}
        style:--accent={si.color}
        on:click={() => selectedSession.set(s)}
      >
        <span class="tab-icon">{si.icon}</span>
        <span class="tab-name">{s}</span>
        {#if done > 0}
          <span class="tab-done">{done}</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- ── Session banner ────────────────────────────────── -->
  <div class="session-banner" style:border-color={info.color}>
    <span class="banner-icon">{info.icon}</span>
    <div>
      <h2 style:color={info.color}>{session}</h2>
      <p>{info.desc}</p>
    </div>
    <div class="banner-actions">
      {#if filledSets > 0}
        <button class="clear-btn" on:click={handleClear}>Limpiar</button>
      {/if}
      <button
        class="save-btn"
        class:saved={saveState === 'saved'}
        disabled={filledSets === 0}
        on:click={handleSave}
      >
        {#if saveState === 'saved'}✓ Guardado{:else}Guardar sesión{/if}
      </button>
    </div>
  </div>

  <!-- ── Exercise list ──────────────────────────────────── -->
  {#if exercises.length === 0}
    <div class="empty"><p>No hay ejercicios en esta sesión</p></div>
  {:else}
    <div class="exercises">
      {#each exercises as ex (ex.id)}
        {@const tech = TECHNIQUE_LABELS[ex.technique]}
        {@const setsCount = Number(ex.sets) || 3}
        {@const displayCount = getDisplayCount(ex.id, setsCount)}
        {@const exSets = current[ex.id] || []}
        {@const filled = exSets.filter(v => v?.kg?.trim()).length}
        {@const lastSets = lastEntry?.sets[ex.id] || []}
        {@const hasLast = lastSets.some(v => v?.kg?.trim())}

        <div class="ex-card" class:complete={filled >= displayCount}>

          <!-- Exercise header -->
          <div class="ex-header">
            <div class="ex-name-row">
              <span class="ex-name">{ex.name}</span>
              {#if tech?.label}
                <span class="tech-badge" style:background={tech.color + '22'} style:color={tech.color}>
                  {tech.label}
                </span>
              {/if}
            </div>
            <div class="ex-meta">
              <span class="ex-target">{setsCount} × {ex.reps}</span>
              <span class="ex-muscle">{ex.muscleGroup}</span>
            </div>
          </div>

          <!-- Set inputs -->
          <div class="sets-grid" style:--cols={Math.min(displayCount, 4)}>
            {#each Array(displayCount) as _, i}
              <div class="set-cell">
                <span class="set-label">Serie {i + 1}</span>

                <!-- Kg input -->
                <div class="set-input-wrap">
                  <input
                    class="set-input"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="kg"
                    value={getKg(ex.id, i)}
                    on:input={e => handleKg(ex.id, i, e)}
                  />
                  <span class="set-unit">kg</span>
                </div>

                <!-- Reps input (no placeholder) -->
                <div class="set-input-wrap reps-wrap">
                  <input
                    class="set-input reps-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder=""
                    value={getReps(ex.id, i)}
                    on:input={e => handleReps(ex.id, i, e)}
                  />
                  <span class="set-unit">rep</span>
                </div>

                <!-- Historical hint -->
                {#if getLastKg(ex.id, i) || getLastReps(ex.id, i)}
                  <span class="set-hist">
                    ant: {getLastKg(ex.id, i) || '—'}kg × {getLastReps(ex.id, i) || '—'}
                  </span>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Add set button -->
          <div class="add-set-row">
            <button class="add-set-btn" on:click={() => addSet(session, ex.id, setsCount)}>
              + Añadir serie
            </button>
          </div>

          <!-- Per-exercise history comparison -->
          {#if hasLast && lastDateLabel}
            <div class="ex-history">
              <span class="hist-label">Última sesión · {lastDateLabel}</span>
              <div class="hist-sets">
                {#each lastSets as lset, i}
                  {#if lset?.kg || lset?.reps}
                    <div class="hist-set">
                      <span class="hist-set-n">{i+1}</span>
                      <span class="hist-set-val">{lset.kg || '—'}kg</span>
                      <span class="hist-set-sep">×</span>
                      <span class="hist-set-val">{lset.reps || '—'}</span>
                      {#if exSets[i]?.kg && lset.kg}
                        {#if Number(exSets[i].kg) - Number(lset.kg) > 0}
                          <span class="hist-delta up">+{Number(exSets[i].kg) - Number(lset.kg)}</span>
                        {:else if Number(exSets[i].kg) - Number(lset.kg) < 0}
                          <span class="hist-delta down">{Number(exSets[i].kg) - Number(lset.kg)}</span>
                        {/if}
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}

        </div>
      {/each}
    </div>
  {/if}

  <!-- ── Calendar History ───────────────────────────────── -->
  <div class="calendar-section">
    <div class="calendar-header">
      <h3>Historial de entrenamientos</h3>
      <div class="cal-nav">
        <button class="cal-nav-btn" on:click={prevMonth}>‹</button>
        <span class="cal-month-label">{calMonthLabel}</span>
        <button class="cal-nav-btn" on:click={nextMonth} disabled={calMonthOffset >= 0}>›</button>
      </div>
    </div>

    <div class="cal-grid">
      {#each ['L','M','X','J','V','S','D'] as dow}
        <div class="cal-dow">{dow}</div>
      {/each}

      {#each calCells as cell}
        {#if cell === null}
          <div class="cal-empty"></div>
        {:else}
          <button
            class="cal-day"
            class:today={cell.dateStr === todayStr}
            class:has-entry={cell.entries.length > 0}
            class:selected={selectedCalDay === cell.dateStr}
            on:click={() => toggleCalDay(cell.dateStr)}
          >
            <span class="cal-day-num">{cell.d}</span>
            {#if cell.entries.length > 0}
              <div class="cal-dots">
                {#each cell.entries as entry}
                  <span class="cal-dot" style:background={SESSION_INFO[entry.session]?.color || '#e94560'}></span>
                {/each}
              </div>
            {/if}
          </button>
        {/if}
      {/each}
    </div>

    <!-- Detail panel -->
    {#if selectedCalDay && calDayEntries.length > 0}
      <div class="cal-detail">
        <div class="cal-detail-date">
          {new Date(selectedCalDay + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        {#each calDayEntries as entry}
          {@const si = SESSION_INFO[entry.session]}
          <div class="cal-detail-session">
            <div class="cal-detail-session-header" style:color={si?.color}>
              <span>{si?.icon}</span>
              <span class="cal-detail-session-name">{entry.session}</span>
            </div>
            <div class="cal-detail-exercises">
              {#each Object.entries(entry.sets) as [exId, sets]}
                {#if sets.some(s => s?.kg || s?.reps)}
                  <div class="cal-detail-ex">
                    <span class="cal-detail-ex-name">{getExName(entry.session, exId)}</span>
                    <div class="cal-detail-sets">
                      {#each sets as s}
                        {#if s?.kg || s?.reps}
                          <span class="cal-detail-set">{s.kg || '—'}kg × {s.reps || '—'}</span>
                        {/if}
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

</div>

<style>
  .gym-page {
    max-width: 860px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
  }

  /* Header */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  h1 { font-size: 1.75rem; font-weight: 800; color: #e2e8f0; margin: 0 0 0.2rem; }
  .page-header p { color: #6b7db3; margin: 0; font-size: 0.9rem; }

  .progress-pill {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
  }

  .progress-pill span { font-size: 0.78rem; color: #8892b0; }

  .pill-bar {
    width: 100px; height: 6px;
    background: #1e2a45; border-radius: 3px; overflow: hidden;
  }

  .pill-fill { height: 100%; background: #e94560; border-radius: 3px; transition: width 0.3s ease; }

  /* Session tabs */
  .session-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .session-tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background: #1a1a2e;
    border: 1.5px solid #2d3561;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .session-tab:hover  { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }
  .session-tab.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }

  .tab-icon { font-size: 1.4rem; }
  .tab-name { font-size: 0.82rem; font-weight: 700; color: #a8b2d8; }
  .session-tab.active .tab-name { color: var(--accent); }

  .tab-done {
    position: absolute; top: 6px; right: 8px;
    background: #10b981; color: white;
    font-size: 0.62rem; font-weight: 800;
    padding: 0.1rem 0.35rem; border-radius: 20px;
  }

  /* Session banner */
  .session-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #1a1a2e;
    border-left: 3px solid;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.25rem;
  }

  .banner-icon { font-size: 1.6rem; }
  .session-banner h2 { margin: 0 0 0.1rem; font-size: 1rem; font-weight: 800; }
  .session-banner p  { margin: 0; font-size: 0.8rem; color: #6b7db3; }

  .banner-actions { margin-left: auto; display: flex; gap: 0.5rem; align-items: center; }

  .clear-btn {
    padding: 0.35rem 0.8rem;
    background: transparent;
    border: 1px solid #2d3561;
    border-radius: 6px;
    color: #6b7db3;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-btn:hover { border-color: #e94560; color: #e94560; }

  .save-btn {
    padding: 0.4rem 1rem;
    background: #e94560;
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-btn:disabled { background: #2d3561; color: #4a5568; cursor: default; }
  .save-btn.saved    { background: #10b981; }
  .save-btn:not(:disabled):hover { background: #c73652; }

  /* Exercise cards */
  .exercises { display: flex; flex-direction: column; gap: 0.75rem; }

  .empty { text-align: center; padding: 4rem 2rem; color: #4a5568; font-size: 0.9rem; }

  .ex-card {
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 14px;
    padding: 1rem 1.1rem;
    transition: border-color 0.2s;
  }

  .ex-card.complete { border-color: rgba(16, 185, 129, 0.35); }

  /* Exercise header */
  .ex-header { margin-bottom: 0.9rem; }

  .ex-name-row {
    display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;
  }

  .ex-name   { font-size: 0.97rem; font-weight: 700; color: #e2e8f0; }

  .tech-badge { font-size: 0.65rem; font-weight: 800; padding: 0.1rem 0.45rem; border-radius: 20px; }

  .ex-meta   { display: flex; gap: 0.75rem; }
  .ex-target { font-size: 0.8rem; color: #e94560; font-weight: 700; }
  .ex-muscle { font-size: 0.78rem; color: #6b7db3; }

  /* Sets grid */
  .sets-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 3), 1fr);
    gap: 0.6rem;
    margin-bottom: 0.5rem;
  }

  .set-cell { display: flex; flex-direction: column; gap: 0.2rem; }

  .set-label {
    font-size: 0.68rem; font-weight: 700; color: #4a5568;
    text-transform: uppercase; letter-spacing: 0.04em;
  }

  .set-input-wrap {
    position: relative; display: flex; align-items: center;
  }

  .set-input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 0.6rem;
    background: #0f1927;
    border: 1.5px solid #2d3561;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.95rem;
    font-weight: 700;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .set-input:focus                    { border-color: #e94560; }
  .set-input:not(:placeholder-shown)  { border-color: rgba(16, 185, 129, 0.5); }

  .reps-wrap { margin-top: 0.15rem; }

  .reps-input { font-size: 0.88rem; color: #a8b2d8; }
  .reps-input:not(:placeholder-shown) { border-color: rgba(96, 165, 250, 0.45); }

  .set-unit {
    position: absolute; right: 0.55rem;
    font-size: 0.68rem; color: #4a5568;
    pointer-events: none;
  }

  .set-hist {
    font-size: 0.64rem;
    color: #3b5588;
    text-align: center;
    margin-top: 0.1rem;
  }

  /* Add set button */
  .add-set-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
  }

  .add-set-btn {
    background: transparent;
    border: 1px dashed #2d3561;
    border-radius: 6px;
    color: #4a5568;
    font-size: 0.72rem;
    padding: 0.25rem 0.65rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-set-btn:hover { border-color: #e94560; color: #e94560; }

  /* History comparison block */
  .ex-history {
    border-top: 1px solid #1e2a45;
    padding-top: 0.6rem;
    margin-top: 0.1rem;
  }

  .hist-label {
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    color: #3b5588;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.4rem;
  }

  .hist-sets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .hist-set {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    background: #0a1929;
    border: 1px solid #1e2a45;
    border-radius: 6px;
    padding: 0.2rem 0.5rem;
  }

  .hist-set-n    { font-size: 0.65rem; color: #3b5588; font-weight: 700; margin-right: 0.15rem; }
  .hist-set-val  { font-size: 0.75rem; color: #5a7db5; font-weight: 600; }
  .hist-set-sep  { font-size: 0.65rem; color: #2d3561; }

  .hist-delta {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0 0.25rem;
    border-radius: 4px;
  }

  .hist-delta.up   { color: #10b981; background: rgba(16,185,129,0.12); }
  .hist-delta.down { color: #e94560; background: rgba(233,69,96,0.12); }

  /* ── Calendar section ────────────────────────────────── */
  .calendar-section {
    margin-top: 2.5rem;
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 14px;
    padding: 1.25rem;
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .calendar-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0;
  }

  .cal-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cal-nav-btn {
    background: transparent;
    border: 1px solid #2d3561;
    border-radius: 6px;
    color: #a8b2d8;
    font-size: 1rem;
    line-height: 1;
    padding: 0.15rem 0.55rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cal-nav-btn:hover:not(:disabled) { border-color: #e94560; color: #e94560; }
  .cal-nav-btn:disabled { opacity: 0.35; cursor: default; }

  .cal-month-label {
    font-size: 0.82rem;
    color: #a8b2d8;
    text-transform: capitalize;
    min-width: 9rem;
    text-align: center;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.2rem;
  }

  .cal-dow {
    text-align: center;
    font-size: 0.65rem;
    font-weight: 700;
    color: #3b5588;
    text-transform: uppercase;
    padding: 0.3rem 0;
  }

  .cal-empty { aspect-ratio: 1; }

  .cal-day {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    padding: 0.15rem;
    gap: 0.1rem;
  }

  .cal-day:hover { background: #1e2a45; border-color: #2d3561; }
  .cal-day.today { background: rgba(233, 69, 96, 0.1); border-color: rgba(233, 69, 96, 0.3); }
  .cal-day.selected { background: #1e2a45; border-color: #e94560; }

  .cal-day-num {
    font-size: 0.75rem;
    color: #6b7db3;
    font-weight: 600;
  }

  .cal-day.today .cal-day-num    { color: #e94560; font-weight: 800; }
  .cal-day.selected .cal-day-num { color: #e2e8f0; }

  .cal-dots {
    display: flex;
    gap: 0.15rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .cal-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Detail panel */
  .cal-detail {
    margin-top: 1rem;
    border-top: 1px solid #1e2a45;
    padding-top: 1rem;
  }

  .cal-detail-date {
    font-size: 0.8rem;
    font-weight: 700;
    color: #8892b0;
    text-transform: capitalize;
    margin-bottom: 0.75rem;
  }

  .cal-detail-session { margin-bottom: 0.75rem; }

  .cal-detail-session-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 800;
    margin-bottom: 0.4rem;
  }

  .cal-detail-session-name { font-size: 0.82rem; }

  .cal-detail-exercises {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-left: 1.4rem;
  }

  .cal-detail-ex { display: flex; flex-direction: column; gap: 0.15rem; }

  .cal-detail-ex-name {
    font-size: 0.75rem;
    font-weight: 700;
    color: #a8b2d8;
  }

  .cal-detail-sets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .cal-detail-set {
    font-size: 0.72rem;
    color: #5a7db5;
    background: #0a1929;
    border: 1px solid #1e2a45;
    border-radius: 4px;
    padding: 0.15rem 0.4rem;
  }

  @media (max-width: 600px) {
    .session-tabs  { grid-template-columns: repeat(2, 1fr); }
    .sets-grid     { grid-template-columns: repeat(2, 1fr) !important; }
    .banner-actions { flex-direction: column; gap: 0.35rem; }
    .calendar-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  }
</style>
