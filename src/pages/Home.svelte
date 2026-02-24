<script>
  import { gymSessions } from '../lib/stores/gym.js';
  import { gymHistory } from '../lib/stores/gymLog.js';
  import { dailyMacros, getWeekDates, DAY_SHORT, todayKey, computeKcal } from '../lib/stores/dailyMacros.js';
  import { macroTargets } from '../lib/stores/macroTargets.js';

  const today = new Date();
  const todayStr = todayKey();

  $: weekDates   = getWeekDates(today);
  $: todayMacros = $dailyMacros[todayStr] || null;

  $: kcalGoal = $macroTargets
    ? computeKcal($macroTargets.ON.carbs, $macroTargets.ON.protein, $macroTargets.ON.fat)
    : 0;

  $: todayKcal = todayMacros ? computeKcal(todayMacros.carbs, todayMacros.protein, todayMacros.fat) : 0;
  $: calPct = todayKcal ? Math.min(Math.round((todayKcal / kcalGoal) * 100), 100) : 0;

  // Days logged this week (has at least one macro)
  $: daysLogged = weekDates.filter(d => {
    const e = $dailyMacros[d];
    return e && (e.protein || e.carbs || e.fat);
  }).length;

  // Sessions done this week from gymHistory
  $: weekSessions = new Set(
    $gymHistory
      .filter(h => weekDates.includes(h.date))
      .map(h => h.session)
  );

  function fmtDate(d) {
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // ── Calendar ─────────────────────────────────────────────
  let calYear = today.getFullYear();
  let calMonth = today.getMonth(); // 0-indexed

  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const CAL_DAYS = ['L','M','X','J','V','S','D'];

  function prevMonth() {
    if (calMonth === 0) { calMonth = 11; calYear--; }
    else calMonth--;
  }

  function nextMonth() {
    if (calMonth === 11) { calMonth = 0; calYear++; }
    else calMonth++;
  }

  $: calDays = (() => {
    const first = new Date(calYear, calMonth, 1);
    const last  = new Date(calYear, calMonth + 1, 0);
    // Monday-based: 0=Mon..6=Sun
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const days = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    return days;
  })();

  // Build a lookup map: dateStr → { trained, hasKcal }
  $: calDataMap = (() => {
    const map = {};
    Object.entries($dailyMacros).forEach(([date, d]) => {
      if (d && (d.protein || d.carbs || d.fat)) {
        map[date] = { ...(map[date] || {}), hasKcal: true };
      }
    });
    $gymHistory.forEach(h => {
      map[h.date] = { ...(map[h.date] || {}), trained: true };
    });
    return map;
  })();

  function calDateStr(d) {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${calYear}-${mm}-${dd}`;
  }

  function isToday(d) {
    return calDateStr(d) === todayStr;
  }


</script>

<div class="home">

  <!-- ── Hero ───────────────────────────────────────────── -->
  <div class="hero">
    <h1>Buenos días, {$macroTargets?.name} 👋</h1>
    <p class="date">{fmtDate(today)}</p>
  </div>

  <!-- ── Summary cards ──────────────────────────────────── -->
  <div class="cards">

    <!-- Gym card -->
    <a href="#/gym" class="card gym-card">
      <div class="card-top">
        <span class="card-icon">💪</span>
        <h2>Gimnasio</h2>
      </div>

      <div class="gym-boxes">
        {#each $gymSessions as s}
          {@const done = weekSessions.has(s)}
          <div class="gym-box" class:done>
            {#if done}<span class="gym-check">✓</span>{/if}
            <span class="gym-box-label">{s}</span>
          </div>
        {/each}
      </div>

      <div class="gym-prog-wrap">
        <div class="gym-prog-bar">
          <div class="gym-prog-fill" style="width:{$gymSessions.length ? (weekSessions.size / $gymSessions.length) * 100 : 0}%"></div>
        </div>
        <span class="gym-prog-text">{weekSessions.size}/{$gymSessions.length} esta semana</span>
      </div>

      <span class="card-cta">Ir al gimnasio →</span>
    </a>

    <!-- Nutrition card -->
    <a href="#/nutrition" class="card nutrition-card">
      <div class="card-top">
        <span class="card-icon">🥗</span>
        <h2>Nutrición</h2>
      </div>

      {#if todayKcal > 0}
        <div class="macros-today">
          <div class="cal-row">
            <span class="cal-num">{todayKcal}</span>
            <span class="cal-of">/ {kcalGoal} kcal</span>
          </div>
          <div class="cal-bar"><div class="cal-fill" style="width:{calPct}%"></div></div>
          <div class="macro-chips">
            <span class="chip prot">{todayMacros.protein ?? '—'}g P</span>
            <span class="chip carb">{todayMacros.carbs ?? '—'}g C</span>
            <span class="chip fat">{todayMacros.fat ?? '—'}g G</span>
          </div>
        </div>
      {:else}
        <p class="card-empty">Sin datos hoy. ¡Registra tus macros!</p>
      {/if}

      <!-- Week mini bars -->
      <div class="week-mini">
        {#each weekDates as d, i}
          {@const entry = $dailyMacros[d]}
          {@const dk = entry ? computeKcal(entry.carbs, entry.protein, entry.fat) : 0}
          {@const h = dk ? Math.min((dk / kcalGoal) * 100, 100) : 0}
          <div class="mini-col" class:today={d === todayStr}>
            <div class="mini-bar-track">
              <div class="mini-bar-fill" style="height:{h}%"></div>
            </div>
            <span class="mini-label">{DAY_SHORT[i][0]}</span>
          </div>
        {/each}
      </div>

      <p class="card-hint">{daysLogged}/7 días registrados esta semana</p>
      <span class="card-cta blue">Ir a nutrición →</span>
    </a>

  </div>

  <!-- ── Calendario mensual ─────────────────────────────── -->
  <div class="calendar-section">
    <div class="cal-header">
      <button class="cal-nav" on:click={prevMonth}>‹</button>
      <h2 class="cal-title">{MONTH_NAMES[calMonth]} {calYear}</h2>
      <button class="cal-nav" on:click={nextMonth}>›</button>
    </div>

    <!-- Day labels -->
    <div class="cal-grid">
      {#each CAL_DAYS as dl}
        <div class="cal-dow">{dl}</div>
      {/each}

      <!-- Day cells -->
      {#each calDays as d}
        {#if d === null}
          <div class="cal-cell empty"></div>
        {:else}
          {@const ds = calDateStr(d)}
          {@const info = calDataMap[ds]}
          {@const isT = isToday(d)}
          <div class="cal-cell" class:today={isT} class:has-data={!!info}>
            <span class="cal-day-num" class:today-num={isT}>{d}</span>
            <div class="cal-indicators">
              {#if info?.trained}
                <span class="cal-dot train-dot" title="Entrenamiento"></span>
              {/if}
              {#if info?.hasKcal}
                <span class="cal-dot kcal-dot" title="Kcal registradas"></span>
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    </div>

    <!-- Legend -->
    <div class="cal-legend">
      <div class="legend-item">
        <span class="legend-dot train-dot"></span> Entrenamiento
      </div>
      <div class="legend-item">
        <span class="legend-dot kcal-dot"></span> Kcal registradas
      </div>
    </div>
  </div>

  <!-- ── Quick links ────────────────────────────────────── -->
  <div class="quick-links">
    <a href="#/gym"       class="ql">🏋️ Entrenar ahora</a>
    <a href="#/nutrition" class="ql">📝 Registrar comida</a>
    <a href="#/progreso"  class="ql">📊 Ver progreso</a>
  </div>

</div>

<style>
  .home {
    max-width: 820px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
  }

  /* Hero */
  .hero { margin-bottom: 2rem; }

  h1 { font-size: 2rem; font-weight: 800; color: #e2e8f0; margin: 0 0 0.25rem; }

  .date { color: #6b7db3; font-size: 0.95rem; margin: 0; }

  /* Cards */
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 16px;
    padding: 1.4rem;
    text-decoration: none;
    transition: border-color 0.2s, transform 0.15s;
  }

  .card:hover { transform: translateY(-2px); }

  .gym-card { border-top: 3px solid #e94560; }
  .gym-card:hover { border-color: #e94560; }

  .nutrition-card { border-top: 3px solid #3b82f6; }
  .nutrition-card:hover { border-color: #3b82f6; }

  .card-top { display: flex; align-items: center; gap: 0.6rem; }

  .card-icon { font-size: 1.6rem; }

  h2 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #e2e8f0; }

  /* Gym card */
  .gym-boxes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
  }

  .gym-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    padding: 0.55rem 0.3rem;
    background: #0f1927;
    border: 1.5px solid #2d3561;
    border-radius: 10px;
    transition: all 0.2s;
    min-height: 52px;
  }

  .gym-box.done {
    background: rgba(233,69,96,0.08);
    border-color: rgba(233,69,96,0.45);
  }

  .gym-check {
    font-size: 0.85rem;
    color: #e94560;
    font-weight: 800;
    line-height: 1;
  }

  .gym-box-label {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #4a5568;
    text-transform: uppercase;
  }

  .gym-box.done .gym-box-label { color: #e94560; }

  .gym-prog-wrap {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .gym-prog-bar {
    flex: 1;
    height: 6px;
    background: #0a1929;
    border-radius: 3px;
    overflow: hidden;
  }

  .gym-prog-fill {
    height: 100%;
    background: linear-gradient(90deg, #e94560, #f97316);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .gym-prog-text {
    font-size: 0.75rem;
    font-weight: 700;
    color: #4a5568;
    white-space: nowrap;
  }

  .card-hint { margin: 0; font-size: 0.78rem; color: #4a5568; }

  .card-cta { font-size: 0.82rem; font-weight: 700; color: #e94560; }
  .card-cta.blue { color: #3b82f6; }

  .card-empty { margin: 0; font-size: 0.85rem; color: #4a5568; font-style: italic; }

  /* Nutrition card */
  .macros-today { display: flex; flex-direction: column; gap: 0.4rem; }

  .cal-row { display: flex; align-items: baseline; gap: 0.3rem; }

  .cal-num { font-size: 1.6rem; font-weight: 800; color: #fbbf24; }

  .cal-of { font-size: 0.78rem; color: #6b9bd2; }

  .cal-bar {
    height: 6px; background: #0a1929; border-radius: 3px; overflow: hidden;
  }

  .cal-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #fbbf24);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .macro-chips { display: flex; gap: 0.4rem; }

  .chip {
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .chip.prot { background: rgba(16,185,129,0.15); color: #10b981; }
  .chip.carb { background: rgba(251,191,36,0.15); color: #fbbf24; }
  .chip.fat  { background: rgba(249,115,22,0.15); color: #f97316; }

  /* Week mini chart */
  .week-mini {
    display: flex;
    gap: 0.3rem;
    align-items: flex-end;
    height: 36px;
  }

  .mini-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    height: 100%;
    justify-content: flex-end;
  }

  .mini-bar-track {
    width: 100%; flex: 1;
    background: #0a1929;
    border-radius: 3px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
  }

  .mini-bar-fill {
    width: 100%; background: #2d5a9e; border-radius: 3px 3px 0 0;
    transition: height 0.3s ease;
  }

  .mini-col.today .mini-bar-fill { background: #3b82f6; }

  .mini-label { font-size: 0.58rem; color: #2d3561; }

  /* ── Calendar ─────────────────────────────────────────── */
  .calendar-section {
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 16px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .cal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .cal-title {
    font-size: 1rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0;
  }

  .cal-nav {
    background: none;
    border: 1px solid #2d3561;
    border-radius: 6px;
    color: #6b7db3;
    font-size: 1.1rem;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    padding: 0;
    line-height: 1;
  }

  .cal-nav:hover { color: #e2e8f0; border-color: #e94560; }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
  }

  .cal-dow {
    text-align: center;
    font-size: 0.65rem;
    font-weight: 700;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.3rem 0;
  }

  .cal-cell {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    padding: 3px 2px;
    gap: 2px;
    cursor: default;
    transition: background 0.15s;
    min-height: 38px;
  }

  .cal-cell.empty { background: transparent; }

  .cal-cell.has-data { background: rgba(255,255,255,0.03); }

  .cal-cell.today {
    background: rgba(233,69,96,0.1);
    border: 1px solid rgba(233,69,96,0.35);
  }

  .cal-day-num {
    font-size: 0.78rem;
    color: #6b7db3;
    font-weight: 500;
    line-height: 1;
  }

  .cal-day-num.today-num {
    color: #e94560;
    font-weight: 800;
  }

  .cal-indicators {
    display: flex;
    gap: 2px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    min-height: 7px;
  }

  .cal-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .train-dot { background: #e94560; }

  .kcal-dot { background: #10b981; }

  .cal-legend {
    display: flex;
    gap: 1rem;
    margin-top: 0.85rem;
    flex-wrap: wrap;
    padding-top: 0.75rem;
    border-top: 1px solid #1e2a45;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    color: #4a5568;
    font-weight: 600;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  /* Quick links */
  .quick-links { display: flex; gap: 0.6rem; }

  .ql {
    flex: 1;
    text-align: center;
    padding: 0.75rem 0.5rem;
    background: #1a1a2e;
    border: 1px solid #2d3561;
    border-radius: 12px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #8892b0;
    text-decoration: none;
    transition: all 0.2s;
  }

  .ql:hover { border-color: #e94560; color: #e94560; background: rgba(233,69,96,0.05); }

  @media (max-width: 600px) {
    .cards { grid-template-columns: 1fr; }
    .quick-links { flex-direction: column; }
    .cal-cell { min-height: 32px; }
    .cal-day-num { font-size: 0.7rem; }
    .cal-dot { width: 5px; height: 5px; }
  }
</style>
