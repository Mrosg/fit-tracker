<script>
  import { createEventDispatcher } from 'svelte';

  export let exercise;
  export let session;

  const dispatch = createEventDispatcher();

  const muscleGroups = [
    'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
    'Piernas', 'Glúteos', 'Core', 'Cardio', 'Otro'
  ];

  let editing = false;
  let editName = exercise.name;
  let editMuscleGroup = exercise.muscleGroup || 'Otro';
  let editSets = exercise.sets;
  let editReps = exercise.reps;
  let editTechnique = exercise.technique || 'Recta';
  let editNotes = exercise.notes || '';

  // Inline week history editing
  let editingWeek = null; // 0, 1, or 2
  let weekDraft = '';

  const muscleColors = {
    'Pecho':    '#e94560', 'Espalda':  '#0f72ea', 'Hombros':  '#7c3aed',
    'Bíceps':   '#059669', 'Tríceps':  '#d97706', 'Piernas':  '#dc2626',
    'Glúteos':  '#db2777', 'Core':     '#0891b2', 'Cardio':   '#65a30d', 'Otro': '#6b7280'
  };

  const techniqueColors = {
    'DROP SET': { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
    'RECTA':    { bg: 'rgba(100,116,139,0.12)', color: '#64748b' }
  };

  function openEdit() {
    editName        = exercise.name;
    editMuscleGroup = exercise.muscleGroup || 'Otro';
    editSets        = exercise.sets;
    editReps        = exercise.reps;
    editTechnique   = exercise.technique || 'Recta';
    editNotes       = exercise.notes || '';
    editing         = true;
  }

  function saveEdit() {
    dispatch('update', {
      name: editName,
      muscleGroup: editMuscleGroup,
      sets: Number(editSets),
      reps: editReps,
      technique: editTechnique,
      notes: editNotes
    });
    editing = false;
  }

  function startWeekEdit(i) {
    editingWeek = i;
    weekDraft = exercise.weekHistory?.[i] || '';
  }

  function saveWeekEdit() {
    if (editingWeek === null) return;
    dispatch('updateWeek', { weekIndex: editingWeek, value: weekDraft });
    editingWeek = null;
    weekDraft = '';
  }

  function cancelWeekEdit() {
    editingWeek = null;
    weekDraft = '';
  }

  $: color = muscleColors[exercise.muscleGroup] || '#6b7280';
  $: techStyle = techniqueColors[exercise.technique] || techniqueColors['RECTA'];
  $: weekHistory = exercise.weekHistory || ['', '', ''];
  $: hasHistory = weekHistory.some(w => w && w.trim());
</script>

<div class="exercise-card">
  {#if editing}
    <!-- ── Edit mode ─────────────────────────────────────── -->
    <div class="edit-form">
      <input class="edit-input main-input" bind:value={editName} placeholder="Nombre del ejercicio" />
      <div class="edit-row">
        <div class="edit-field">
          <label for="edit-muscle-{exercise.id}">Grupo muscular</label>
          <select id="edit-muscle-{exercise.id}" class="edit-input" bind:value={editMuscleGroup}>
            {#each muscleGroups as g}
              <option value={g}>{g}</option>
            {/each}
          </select>
        </div>
        <div class="edit-field">
          <label for="edit-tech-{exercise.id}">Técnica</label>
          <select id="edit-tech-{exercise.id}" class="edit-input" bind:value={editTechnique}>
            <option>Recta</option>
            <option>Inclinado</option>
            <option>Dropset</option>
          </select>
        </div>
      </div>
      <div class="edit-row">
        <div class="edit-field">
          <label for="edit-sets-{exercise.id}">Series</label>
          <input id="edit-sets-{exercise.id}" type="number" class="edit-input" bind:value={editSets} min="1" placeholder="4" />
        </div>
        <div class="edit-field">
          <label for="edit-reps-{exercise.id}">Repeticiones</label>
          <input id="edit-reps-{exercise.id}" class="edit-input" bind:value={editReps} placeholder="8-12" />
        </div>
      </div>
      <input class="edit-input" bind:value={editNotes} placeholder="Notas adicionales..." />
      <div class="edit-actions">
        <button class="btn-sm cancel" on:click={() => (editing = false)}>Cancelar</button>
        <button class="btn-sm save" on:click={saveEdit} disabled={!editName.trim()}>Guardar</button>
      </div>
    </div>

  {:else}
    <!-- ── View mode ──────────────────────────────────────── -->
    <div class="exercise-header">
      <div class="exercise-info">
        <div class="tags">
          <span class="muscle-tag" style="background:{color}22; color:{color}; border-color:{color}44">
            {exercise.muscleGroup || 'Otro'}
          </span>
          {#if exercise.technique && exercise.technique !== 'RECTA'}
            <span class="tech-tag" style="background:{techStyle.bg}; color:{techStyle.color}">
              {exercise.technique}
            </span>
          {/if}
        </div>
        <h4>{exercise.name}</h4>
      </div>
      <div class="exercise-actions">
        <button class="icon-btn" on:click={openEdit} title="Editar">✏️</button>
        <button class="icon-btn danger" on:click={() => dispatch('remove')} title="Eliminar">🗑️</button>
      </div>
    </div>

    <div class="exercise-stats">
      {#if exercise.sets}
        <div class="stat">
          <span class="stat-value">{exercise.sets}</span>
          <span class="stat-label">series</span>
        </div>
      {/if}
      {#if exercise.reps}
        <div class="stat">
          <span class="stat-value">{exercise.reps}</span>
          <span class="stat-label">reps</span>
        </div>
      {/if}
    </div>

    {#if exercise.notes}
      <p class="exercise-notes">{exercise.notes}</p>
    {/if}

    <!-- ── Weekly history W1 / W2 / W3 ───────────────────── -->
    <div class="week-history">
      {#each ['S1', 'S2', 'S3'] as label, i}
        <div class="week-cell" class:has-data={weekHistory[i]}>
          <span class="week-label">{label}</span>
          {#if editingWeek === i}
            <input
              class="week-input"
              bind:value={weekDraft}
              placeholder="ej: 60×10 / 60×10"
              on:keydown={e => { if (e.key === 'Enter') saveWeekEdit(); if (e.key === 'Escape') cancelWeekEdit(); }}
            />
            <div class="week-edit-actions">
              <button class="week-btn-ok" on:click={saveWeekEdit}>✓</button>
              <button class="week-btn-cancel" on:click={cancelWeekEdit}>✕</button>
            </div>
          {:else}
            <button class="week-value-btn" on:click={() => startWeekEdit(i)}>
              {weekHistory[i] || '—'}
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .exercise-card {
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 12px;
    padding: 1rem;
    transition: border-color 0.2s;
  }

  .exercise-card:hover {
    border-color: #3d4d7a;
  }

  /* Header */
  .exercise-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.6rem;
  }

  .exercise-info { display: flex; flex-direction: column; gap: 0.3rem; }

  .tags { display: flex; gap: 0.3rem; flex-wrap: wrap; }

  h4 { margin: 0; color: #e2e8f0; font-size: 0.95rem; font-weight: 600; }

  .muscle-tag {
    display: inline-block; padding: 0.12rem 0.55rem;
    border-radius: 20px; font-size: 0.7rem; font-weight: 700;
    border: 1px solid; white-space: nowrap;
  }

  .tech-tag {
    display: inline-block; padding: 0.12rem 0.55rem;
    border-radius: 20px; font-size: 0.68rem; font-weight: 700;
    white-space: nowrap;
  }

  .exercise-actions { display: flex; gap: 0.25rem; }

  .icon-btn {
    background: none; border: none; cursor: pointer; padding: 0.25rem;
    border-radius: 6px; font-size: 0.85rem; opacity: 0.5; transition: all 0.2s;
  }
  .icon-btn:hover { opacity: 1; background: rgba(255,255,255,0.08); }
  .icon-btn.danger:hover { background: rgba(233,69,96,0.2); }

  /* Stats */
  .exercise-stats { display: flex; gap: 1.25rem; margin-bottom: 0.5rem; }

  .stat { display: flex; align-items: baseline; gap: 0.25rem; }

  .stat-value { font-size: 1rem; font-weight: 700; color: #e94560; }

  .stat-label { font-size: 0.72rem; color: #6b7db3; }

  .exercise-notes { margin: 0 0 0.5rem; font-size: 0.78rem; color: #6b7db3; font-style: italic; }

  /* Weekly history */
  .week-history {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.4rem;
    margin-top: 0.5rem;
    padding-top: 0.6rem;
    border-top: 1px solid #1e2a45;
  }

  .week-cell {
    background: #0a111e;
    border: 1px dashed #1e2a45;
    border-radius: 8px;
    padding: 0.4rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
    transition: border-color 0.2s;
  }

  .week-cell.has-data {
    border-color: #2d3561;
    border-style: solid;
  }

  .week-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .week-cell.has-data .week-label {
    color: #e94560;
  }

  .week-value-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #a8b2d8;
    font-size: 0.75rem;
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    line-height: 1.4;
    min-height: 1.2rem;
  }

  .week-value-btn:hover { color: #e94560; }

  .week-input {
    background: #1e2a45;
    border: 1px solid #e94560;
    border-radius: 4px;
    padding: 0.25rem 0.4rem;
    color: #e2e8f0;
    font-size: 0.75rem;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
  }

  .week-edit-actions {
    display: flex; gap: 0.25rem; margin-top: 0.2rem;
  }

  .week-btn-ok, .week-btn-cancel {
    flex: 1; border: none; border-radius: 4px; cursor: pointer;
    font-size: 0.7rem; padding: 0.2rem; font-weight: 700;
  }

  .week-btn-ok { background: rgba(233,69,96,0.2); color: #e94560; }
  .week-btn-ok:hover { background: rgba(233,69,96,0.35); }

  .week-btn-cancel { background: rgba(255,255,255,0.05); color: #6b7db3; }
  .week-btn-cancel:hover { background: rgba(255,255,255,0.1); }

  /* Edit form */
  .edit-form { display: flex; flex-direction: column; gap: 0.5rem; }

  .edit-input {
    padding: 0.4rem 0.6rem;
    background: #1e2a45; border: 1px solid #2d3561; border-radius: 6px;
    color: #e2e8f0; font-size: 0.85rem; outline: none;
    width: 100%; box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .edit-input:focus { border-color: #e94560; }
  .main-input { font-weight: 600; }

  .edit-row { display: flex; gap: 0.5rem; }

  .edit-field { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }

  .edit-field label { font-size: 0.72rem; color: #6b7db3; }

  .edit-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

  .btn-sm {
    padding: 0.3rem 0.75rem; border-radius: 6px;
    font-size: 0.82rem; cursor: pointer; font-weight: 600; transition: all 0.2s;
  }
  .btn-sm.cancel { background: transparent; border: 1px solid #2d3561; color: #8892b0; }
  .btn-sm.cancel:hover { color: #e2e8f0; }
  .btn-sm.save { background: #e94560; border: none; color: white; }
  .btn-sm.save:hover { background: #c73652; }

  select.edit-input option { background: #0f1927; }
</style>
