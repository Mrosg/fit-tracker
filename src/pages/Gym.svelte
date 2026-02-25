<script>
  import { routine, selectedSession, gymSessions, createSession, renameSession, deleteSession, addExercise, updateExercise, updateSessionEmoji, reorderExercises, reorderSessions } from '../lib/stores/gym.js';
  import {
    gymCurrentSets, gymHistory,
    setKg, setReps, saveSession, clearCurrentSession, addSet, removeSet
  } from '../lib/stores/gymLog.js';
  import ExerciseForm from '../lib/components/gym/ExerciseForm.svelte';

  const COLORS = ['#e94560','#0f72ea','#dc2626','#db2777','#10b981','#f97316','#a78bfa'];
  const ICONS  = ['🏋️','💪','🦵','🔥','⚡','🏃','🎯'];

  const TECHNIQUE_LABELS = {
    'Recta':     { label: null,   color: null },
    'Inclinado': { label: 'INC',  color: '#a78bfa' },
    'Dropset':   { label: 'DS',   color: '#fbbf24' },
  };

  // Auto-select first session when sessions change
  $: if ($gymSessions.length > 0 && !$gymSessions.includes($selectedSession)) {
    selectedSession.set($gymSessions[0]);
  }

  $: session = $selectedSession;
  $: $selectedSession, (showEmojiPicker = false);
  $: sessionIdx   = $gymSessions.indexOf(session);
  $: sessionColor = COLORS[(sessionIdx >= 0 ? sessionIdx : 0) % COLORS.length];
  $: sessionIcon  = $routine[session]?.emoji || ICONS[(sessionIdx >= 0 ? sessionIdx : 0) % ICONS.length];
  $: sessionColorMap = Object.fromEntries($gymSessions.map((s, i) => [s, COLORS[i % COLORS.length]]));

  const EMOJI_OPTIONS = [
    '🏋️','💪','🦵','🔥','⚡','🏃','🎯',
    '🤸','🧗','🚴','🏊','🥊','🧘','🏅',
    '⚽','🏈','🎽','🩺','🏇','🤾','🥋','🏄',
  ];

  let showEmojiPicker = false;

  function pickEmoji(emoji) {
    updateSessionEmoji(session, emoji);
    showEmojiPicker = false;
  }

  function handlePickerKeydown(e) {
    if (e.key === 'Escape') showEmojiPicker = false;
  }

  $: exercises = $routine[session]?.exercises || [];
  $: current   = $gymCurrentSets[session] || {};

  // Rename state
  let renaming = false;
  let renameValue = '';

  function startRename() {
    renameValue = session;
    renaming = true;
  }

  function confirmRename() {
    if (renameValue.trim() && renameValue.trim() !== session) {
      renameSession(session, renameValue.trim());
    }
    renaming = false;
  }

  function handleRenameKey(e) {
    if (e.key === 'Enter') confirmRename();
    if (e.key === 'Escape') renaming = false;
  }

  function handleDeleteSession() {
    if (!confirm(`¿Eliminar la sesión "${session}"? Se perderá su configuración de ejercicios.`)) return;
    deleteSession(session);
  }

  function addNewSession() {
    const name = `Día ${$gymSessions.length + 1}`;
    createSession(name);
    selectedSession.set(name);
  }

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
  let saveDate  = new Date().toISOString().split('T')[0];

  // Expanded exercises (collapsed by default)
  let expandedExercises = new Set();
  $: $selectedSession, (expandedExercises = new Set());

  function toggleExercise(exId) {
    if (expandedExercises.has(exId)) {
      expandedExercises.delete(exId);
    } else {
      expandedExercises.add(exId);
    }
    expandedExercises = expandedExercises;
  }

  function handleSave() {
    if (filledSets === 0) return;
    saveSession(session, $gymCurrentSets[session] || {}, saveDate);
    clearCurrentSession(session);
    saveDate = new Date().toISOString().split('T')[0];
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
  $: calMonthLabel = (() => {
    const m = calDate.toLocaleDateString('es-ES', { month: 'long' });
    return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + calYear;
  })();
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

  // ── Exercise progress history ─────────────────────────────────
  let histExId = null;

  // Auto-select first exercise, reset when session changes
  $: if (!exercises.find(e => e.id === histExId)) {
    histExId = exercises[0]?.id ?? null;
  }

  $: histRawData = histExId !== null
    ? $gymHistory
        .filter(h => h.session === session && (h.sets[histExId] || []).some(s => s?.kg?.trim()))
        .map(h => {
          const sets = (h.sets[histExId] || []).filter(s => s?.kg?.trim());
          const maxKg = Math.max(...sets.map(s => Number(s.kg)));
          return { date: h.date, sets, maxKg };
        })
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  // Chart uses last 10 sessions oldest→newest; table shows newest first
  $: histChartData = histRawData.slice(-10);
  $: histTableData = [...histRawData].reverse();

  $: histMaxKg  = histChartData.length ? Math.max(...histChartData.map(d => d.maxKg)) : 0;
  $: histMinKg  = histChartData.length ? Math.min(...histChartData.map(d => d.maxKg)) : 0;
  $: histRange  = (histMaxKg - histMinKg) || 1;
  $: histChartPts = histChartData.length > 1
    ? histChartData.map((d, i) => {
        const x = (i / (histChartData.length - 1)) * 400;
        const y = 72 - ((d.maxKg - histMinKg) / histRange) * 62;
        return `${x},${y}`;
      })
    : [];

  function fmtHistDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
    {#each $gymSessions as s, i}
      {@const color = COLORS[i % COLORS.length]}
      {@const icon  = $routine[s]?.emoji || ICONS[i % ICONS.length]}
      {@const done = Object.values($gymCurrentSets[s] || {}).flat().filter(v => v?.kg?.trim()).length}
      <button
        class="session-tab"
        class:active={session === s}
        style:--accent={color}
        on:click={() => selectedSession.set(s)}
      >
        <span class="tab-icon">{icon}</span>
        <span class="tab-name">{s}</span>
        {#if done > 0}
          <span class="tab-done">{done}</span>
        {/if}
        {#if $gymSessions.length > 1}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="tab-order-btns" on:click|stopPropagation>
            <button
              class="tab-order-btn"
              disabled={i === 0}
              on:click={() => reorderSessions(i, i - 1)}
              title="Mover izquierda"
            >◄</button>
            <button
              class="tab-order-btn"
              disabled={i === $gymSessions.length - 1}
              on:click={() => reorderSessions(i, i + 1)}
              title="Mover derecha"
            >►</button>
          </div>
        {/if}
      </button>
    {/each}
    <button class="session-tab add-session-tab" on:click={addNewSession} title="Nueva sesión">
      <span class="tab-icon">＋</span>
    </button>
  </div>

  <!-- ── Session banner ────────────────────────────────── -->
  {#if $gymSessions.length === 0}{:else}
  <div class="session-banner" style:border-color={sessionColor}>
    <div class="banner-emoji-wrap">
      <button
        class="banner-icon-btn"
        on:click={() => (showEmojiPicker = !showEmojiPicker)}
        title="Cambiar emoji"
      >{sessionIcon}</button>
      {#if showEmojiPicker}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="emoji-backdrop" on:click={() => (showEmojiPicker = false)} on:keydown={handlePickerKeydown}></div>
        <div class="emoji-picker">
          {#each EMOJI_OPTIONS as em}
            <button
              class="emoji-opt"
              class:selected={em === sessionIcon}
              on:click={() => pickEmoji(em)}
            >{em}</button>
          {/each}
        </div>
      {/if}
    </div>
    <div class="banner-title">
      {#if renaming}
        <input
          class="rename-input"
          bind:value={renameValue}
          on:keydown={handleRenameKey}
          on:blur={confirmRename}
          autofocus
        />
      {:else}
        <h2 style:color={sessionColor}>{session}</h2>
        <p>{exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}</p>
      {/if}
    </div>
    <div class="banner-actions">
      <button class="icon-btn-sm" on:click={startRename} title="Renombrar">✏️</button>
      <button class="icon-btn-sm" on:click={handleDeleteSession} title="Eliminar sesión">🗑️</button>
      {#if filledSets > 0}
        <button class="clear-btn" on:click={handleClear}>Limpiar</button>
      {/if}
      <input
        class="save-date-input"
        type="date"
        bind:value={saveDate}
        max={new Date().toISOString().split('T')[0]}
        title="Día de la sesión"
      />
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
  {/if}

  <!-- ── Exercise list ──────────────────────────────────── -->
  {#if $gymSessions.length === 0}
    <div class="empty">
      <p>No tienes sesiones configuradas.</p>
      <p>Pulsa <strong>＋</strong> para crear tu primera sesión.</p>
    </div>
  {:else if exercises.length === 0}
    <div class="empty"><p>Sin ejercicios. Usa el formulario de abajo para añadir el primero.</p></div>
  {:else}
    <div class="exercises">
      {#each exercises as ex, exIdx (ex.id)}
        {@const tech = TECHNIQUE_LABELS[ex.technique]}
        {@const setsCount = Number(ex.sets) || 3}
        {@const stored = current[ex.id] || []}
        {@const displayCount = stored.length > 0 ? stored.length : setsCount}
        {@const exSets = stored}
        {@const filled = exSets.filter(v => v?.kg?.trim()).length}
        {@const lastSets = lastEntry?.sets[ex.id] || []}
        {@const hasLast = lastSets.some(v => v?.kg?.trim())}

        {@const isExpanded = expandedExercises.has(ex.id)}

        <div class="ex-card" class:complete={filled >= displayCount} class:expanded={isExpanded}>

          <!-- Collapsed header (always visible, clickable) -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="ex-header"
            on:click={() => toggleExercise(ex.id)}
            on:keydown={e => e.key === 'Enter' && toggleExercise(ex.id)}
            role="button"
            tabindex="0"
          >
            <div class="ex-name-info">
              <span class="ex-name">{ex.name}</span>
              <span class="ex-muscle">{ex.muscleGroup}</span>
            </div>
            <div class="ex-header-right">
              <span class="ex-target">{setsCount} × {ex.reps}</span>
              {#if filled > 0}
                <span class="ex-fill-chip">{filled}/{displayCount}</span>
              {/if}
              {#if exercises.length > 1}
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="ex-order-btns" on:click|stopPropagation>
                  <button
                    class="order-btn"
                    disabled={exIdx === 0}
                    on:click={() => reorderExercises(session, exIdx, exIdx - 1)}
                    title="Subir"
                  >▲</button>
                  <button
                    class="order-btn"
                    disabled={exIdx === exercises.length - 1}
                    on:click={() => reorderExercises(session, exIdx, exIdx + 1)}
                    title="Bajar"
                  >▼</button>
                </div>
              {/if}
              <span class="ex-chevron" class:open={isExpanded}>›</span>
            </div>
          </div>

          <!-- Expanded body -->
          {#if isExpanded}
            <div class="ex-body">

              <!-- Technique + notes -->
              <div class="ex-body-top">
                <select
                  class="tech-select"
                  value={ex.technique || 'Recta'}
                  on:change={e => updateExercise(session, ex.id, { technique: e.target.value })}
                >
                  <option>Recta</option>
                  <option>Inclinado</option>
                  <option>Dropset</option>
                </select>
                {#if ex.notes}
                  <p class="ex-notes">{ex.notes}</p>
                {/if}
              </div>

              <!-- Set inputs -->
              <div class="sets-grid" style:--cols={Math.min(displayCount, 4)}>
                {#each Array(displayCount) as _, i}
                  <div class="set-cell">
                    <span class="set-label">Serie {i + 1}</span>

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

                    {#if getLastKg(ex.id, i) || getLastReps(ex.id, i)}
                      <span class="set-hist">
                        ant: {getLastKg(ex.id, i) || '—'}kg × {getLastReps(ex.id, i) || '—'}
                      </span>
                    {/if}

                    {#if displayCount > 1}
                      <button class="remove-set-btn" on:click={() => removeSet(session, ex.id, i)} title="Eliminar serie">×</button>
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
          {/if}

        </div>
      {/each}
    </div>
  {/if}

  <!-- ── Add exercise ───────────────────────────────────── -->
  {#if session}
    <ExerciseForm day={session} on:add={e => addExercise(session, e.detail)} />
  {/if}

  <!-- ── Exercise Progress History ─────────────────────── -->
  {#if session && exercises.length > 0}
    <div class="ex-prog-section">
      <h3 class="ex-prog-title">Progreso por ejercicio</h3>

      <!-- Exercise selector -->
      <div class="ex-prog-pills">
        {#each exercises as ex}
          <button
            class="ex-prog-pill"
            class:active={histExId === ex.id}
            on:click={() => (histExId = ex.id)}
          >{ex.name}</button>
        {/each}
      </div>

      {#if histTableData.length === 0}
        <div class="ex-prog-empty">
          Guarda una sesión para empezar a ver el progreso aquí.
        </div>
      {:else}
        <!-- Sparkline chart (2+ data points) -->
        {#if histChartData.length > 1}
          <div class="ex-prog-chart">
            <div class="ex-prog-chart-top">
              <span class="ex-prog-chart-label">Peso máximo · últimas {histChartData.length} sesiones</span>
              <span class="ex-prog-chart-peak">{histMaxKg} kg</span>
            </div>
            <svg class="ex-prog-svg" viewBox="0 0 400 80" preserveAspectRatio="none">
              {#each [0, 40, 80] as y}
                <line x1="0" y1={y} x2="400" y2={y} stroke="#1e2a45" stroke-width="0.5"/>
              {/each}
              <defs>
                <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#e94560" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#e94560" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <polygon
                points={`0,80 ${histChartPts.join(' ')} 400,80`}
                fill="url(#progGrad)"
              />
              <polyline
                points={histChartPts.join(' ')}
                fill="none" stroke="#e94560" stroke-width="2.5" stroke-linejoin="round"
              />
              {#each histChartData as d, i}
                {@const x = (i / (histChartData.length - 1)) * 400}
                {@const y = 72 - ((d.maxKg - histMinKg) / histRange) * 62}
                <circle cx={x} cy={y} r="4" fill="#e94560"/>
                <circle cx={x} cy={y} r="7" fill="#e94560" fill-opacity="0.18"/>
              {/each}
            </svg>
            <div class="ex-prog-x-labels">
              {#each histChartData as d, i}
                {#if i === 0 || i === histChartData.length - 1 || histChartData.length <= 5}
                  <span>{fmtHistDate(d.date)}</span>
                {:else}
                  <span></span>
                {/if}
              {/each}
            </div>
          </div>
        {/if}

        <!-- Session log entries -->
        <div class="ex-prog-entries">
          {#each histTableData as entry, idx}
            {@const prev = histTableData[idx + 1]}
            {@const delta = prev != null ? +(entry.maxKg - prev.maxKg).toFixed(1) : null}
            <div class="ex-prog-entry">
              <div class="ex-prog-entry-left">
                <span class="ex-prog-entry-date">{fmtHistDate(entry.date)}</span>
                {#if delta !== null}
                  <span
                    class="ex-prog-delta"
                    class:up={delta > 0}
                    class:down={delta < 0}
                    class:same={delta === 0}
                  >{delta > 0 ? `+${delta}` : delta === 0 ? '=' : delta}kg</span>
                {/if}
              </div>
              <div class="ex-prog-sets-row">
                {#each entry.sets as s}
                  <span class="ex-prog-set-badge">{s.kg}kg{s.reps ? ` × ${s.reps}` : ''}</span>
                {/each}
              </div>
              <span class="ex-prog-max">máx {entry.maxKg}kg</span>
            </div>
          {/each}
        </div>
      {/if}
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
                  <span class="cal-dot" style:background={sessionColorMap[entry.session] || '#e94560'}></span>
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
        <div class="cal-detail-sessions">
          {#each calDayEntries as entry}
            {@const entryColor = sessionColorMap[entry.session] || '#6b7db3'}
            <span class="cal-detail-session-chip" style:background={`${entryColor}22`} style:color={entryColor} style:border-color={`${entryColor}55`}>
              🏋️ {entry.session}
            </span>
          {/each}
        </div>
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

  .banner-emoji-wrap { position: relative; flex-shrink: 0; }

  .banner-icon-btn {
    background: none;
    border: none;
    font-size: 1.6rem;
    cursor: pointer;
    padding: 0.2rem;
    border-radius: 8px;
    transition: background 0.15s;
    line-height: 1;
    display: block;
  }

  .banner-icon-btn:hover { background: rgba(255,255,255,0.08); }

  .emoji-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9;
  }

  .emoji-picker {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 10;
    background: #1e2a45;
    border: 1px solid #2d3561;
    border-radius: 12px;
    padding: 0.5rem;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.2rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }

  .emoji-opt {
    background: none;
    border: none;
    font-size: 1.3rem;
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 7px;
    transition: background 0.12s;
    line-height: 1;
  }

  .emoji-opt:hover   { background: rgba(255,255,255,0.1); }
  .emoji-opt.selected { background: rgba(233, 69, 96, 0.25); }

  .banner-title { flex: 1; min-width: 0; }
  .session-banner h2 { margin: 0 0 0.1rem; font-size: 1rem; font-weight: 800; }
  .session-banner p  { margin: 0; font-size: 0.8rem; color: #6b7db3; }

  .rename-input {
    padding: 0.3rem 0.6rem;
    background: #0f1927;
    border: 1.5px solid #e94560;
    border-radius: 7px;
    color: #e2e8f0;
    font-size: 0.95rem;
    font-weight: 700;
    outline: none;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  .icon-btn-sm {
    background: none;
    border: none;
    font-size: 0.9rem;
    cursor: pointer;
    opacity: 0.45;
    padding: 0.2rem 0.3rem;
    border-radius: 4px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .icon-btn-sm:hover { opacity: 1; background: rgba(255,255,255,0.08); }

  .banner-actions { margin-left: auto; display: flex; gap: 0.5rem; align-items: center; }

  /* Add session tab */
  .add-session-tab {
    opacity: 0.5;
    border-style: dashed !important;
    --accent: #6b7db3 !important;
  }

  .add-session-tab:hover { opacity: 1; }

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

  .save-date-input {
    padding: 0.35rem 0.55rem;
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 6px;
    color: #a8b2d8;
    font-size: 0.75rem;
    outline: none;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .save-date-input:focus { border-color: #e94560; }
  .save-date-input::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }

  .save-btn:disabled { background: #2d3561; color: #4a5568; cursor: default; }
  .save-btn.saved    { background: #10b981; }
  .save-btn:not(:disabled):hover { background: #c73652; }

  /* Exercise cards */
  .exercises { display: flex; flex-direction: column; gap: 0.5rem; }

  .empty { text-align: center; padding: 4rem 2rem; color: #4a5568; font-size: 0.9rem; }

  .ex-card {
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .ex-card.complete { border-color: rgba(16, 185, 129, 0.35); }
  .ex-card.expanded { border-color: #3b5588; }

  /* Exercise header (collapsed, always visible) */
  .ex-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;
  }

  .ex-header:hover { background: rgba(255,255,255,0.025); }

  /* Exercise reorder buttons */
  .ex-order-btns {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex-shrink: 0;
  }

  .order-btn {
    background: none;
    border: none;
    color: #2d3561;
    font-size: 0.55rem;
    line-height: 1;
    padding: 0.15rem 0.3rem;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.15s;
  }

  .order-btn:hover:not(:disabled) { color: #e94560; background: rgba(233,69,96,0.1); }
  .order-btn:disabled { opacity: 0.2; cursor: default; }

  /* Session tab reorder buttons */
  .tab-order-btns {
    display: flex;
    gap: 2px;
    margin-top: 0.1rem;
  }

  .tab-order-btn {
    background: none;
    border: none;
    color: #2d3561;
    font-size: 0.6rem;
    line-height: 1;
    padding: 0.1rem 0.25rem;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.15s;
  }

  .tab-order-btn:hover:not(:disabled) { color: var(--accent); background: color-mix(in srgb, var(--accent) 15%, transparent); }
  .tab-order-btn:disabled { opacity: 0.15; cursor: default; }

  .ex-name-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .ex-name { font-size: 0.97rem; font-weight: 700; color: #e2e8f0; }

  .ex-header-right {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-shrink: 0;
  }

  .ex-fill-chip {
    padding: 0.1rem 0.45rem;
    background: rgba(16,185,129,0.15);
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 700;
    color: #10b981;
  }

  .ex-chevron {
    font-size: 1.1rem;
    color: #4a5568;
    transition: transform 0.2s;
    display: inline-block;
    transform: rotate(90deg);
  }

  .ex-chevron.open { transform: rotate(-90deg); }

  /* Expanded body */
  .ex-body {
    padding: 0 1rem 1rem;
    border-top: 1px solid #1e2a45;
  }

  .ex-body-top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0 0.75rem;
  }

  .tech-select {
    padding: 0.1rem 0.4rem;
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 6px;
    color: #a8b2d8;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    outline: none;
    font-family: inherit;
  }

  .tech-select:focus { border-color: #e94560; }
  .tech-select option { background: #0f1927; }

  .ex-notes {
    margin: 0;
    font-size: 0.75rem;
    color: #4a5568;
    font-style: italic;
  }

  .ex-target { font-size: 0.8rem; color: #e94560; font-weight: 700; }
  .ex-muscle { font-size: 0.75rem; color: #4a5568; }

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

  .remove-set-btn {
    align-self: center;
    background: none;
    border: none;
    color: #2d3561;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    transition: all 0.15s;
    margin-top: 0.15rem;
  }

  .remove-set-btn:hover { color: #e94560; background: rgba(233,69,96,0.1); }

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

  /* ── Exercise progress history ───────────────────────── */
  .ex-prog-section {
    margin-top: 2rem;
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 14px;
    padding: 1.25rem;
  }

  .ex-prog-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0 0 1rem;
  }

  /* Exercise pill selector */
  .ex-prog-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.1rem;
  }

  .ex-prog-pill {
    padding: 0.3rem 0.8rem;
    background: #0f1927;
    border: 1.5px solid #2d3561;
    border-radius: 20px;
    color: #6b7db3;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .ex-prog-pill:hover  { border-color: #e94560; color: #e94560; }
  .ex-prog-pill.active { border-color: #e94560; color: #e94560; background: rgba(233,69,96,0.1); }

  /* Empty state */
  .ex-prog-empty {
    text-align: center;
    padding: 2rem 1rem;
    font-size: 0.82rem;
    color: #4a5568;
    border: 1px dashed #1e2a45;
    border-radius: 10px;
  }

  /* Sparkline chart */
  .ex-prog-chart {
    background: #0f1927;
    border: 1px solid #1e2a45;
    border-radius: 10px;
    padding: 0.9rem 1rem 0.6rem;
    margin-bottom: 1rem;
  }

  .ex-prog-chart-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.7rem;
  }

  .ex-prog-chart-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .ex-prog-chart-peak {
    font-size: 1.3rem;
    font-weight: 800;
    color: #e94560;
  }

  .ex-prog-svg {
    width: 100%;
    height: 90px;
    overflow: visible;
  }

  .ex-prog-x-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.35rem;
  }

  .ex-prog-x-labels span {
    font-size: 0.65rem;
    color: #3b5588;
  }

  /* Session entries */
  .ex-prog-entries {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .ex-prog-entry {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #0f1927;
    border: 1px solid #1e2a45;
    border-radius: 8px;
    padding: 0.55rem 0.85rem;
  }

  .ex-prog-entry-left {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 52px;
    flex-shrink: 0;
  }

  .ex-prog-entry-date {
    font-size: 0.72rem;
    font-weight: 700;
    color: #8892b0;
  }

  .ex-prog-delta {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.05rem 0.3rem;
    border-radius: 3px;
    width: fit-content;
  }

  .ex-prog-delta.up   { color: #10b981; background: rgba(16,185,129,0.12); }
  .ex-prog-delta.down { color: #e94560; background: rgba(233,69,96,0.12); }
  .ex-prog-delta.same { color: #4a5568; background: transparent; }

  .ex-prog-sets-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    flex: 1;
  }

  .ex-prog-set-badge {
    padding: 0.15rem 0.5rem;
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 5px;
    font-size: 0.72rem;
    color: #a8b2d8;
    font-weight: 600;
  }

  .ex-prog-max {
    font-size: 0.78rem;
    font-weight: 800;
    color: #e94560;
    flex-shrink: 0;
  }

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
    margin-bottom: 0.6rem;
  }

  .cal-detail-sessions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .cal-detail-session-chip {
    padding: 0.25rem 0.75rem;
    border: 1px solid;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 700;
  }

  @media (max-width: 600px) {
    .session-tabs  { grid-template-columns: repeat(2, 1fr); }
    .sets-grid     { grid-template-columns: repeat(2, 1fr) !important; }
    .banner-actions { flex-direction: column; gap: 0.35rem; }
    .calendar-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  }
</style>
