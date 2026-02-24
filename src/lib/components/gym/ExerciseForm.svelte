<script>
  import { createEventDispatcher } from 'svelte';

  export let day;

  const dispatch = createEventDispatcher();

  let name = '';
  let sets = '';
  let reps = '';
  let notes = '';
  let showForm = false;

  const muscleGroups = [
    'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
    'Piernas', 'Glúteos', 'Core', 'Cardio', 'Otro'
  ];
  let muscleGroup = 'Pecho';
  let technique = 'RECTA';

  function submit() {
    if (!name.trim()) return;
    dispatch('add', {
      name: name.trim(),
      sets: Number(sets) || 0,
      reps: reps.trim(),
      muscleGroup,
      technique,
      notes: notes.trim()
    });
    name = '';
    sets = '';
    reps = '';
    notes = '';
    muscleGroup = 'Pecho';
    technique = 'RECTA';
    showForm = false;
  }
</script>

{#if !showForm}
  <button class="btn-add" on:click={() => (showForm = true)}>
    + Añadir ejercicio
  </button>
{:else}
  <div class="form-card">
    <h3>Nuevo ejercicio — {day}</h3>
    <div class="form-grid">
      <div class="form-group full">
        <label for="ex-name">Nombre del ejercicio</label>
        <input id="ex-name" type="text" bind:value={name} placeholder="Ej: Press de banca" />
      </div>
      <div class="form-group">
        <label for="ex-muscle">Grupo muscular</label>
        <select id="ex-muscle" bind:value={muscleGroup}>
          {#each muscleGroups as g}
            <option value={g}>{g}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label for="ex-tech">Técnica</label>
        <select id="ex-tech" bind:value={technique}>
          <option>RECTA</option>
          <option>DROP SET</option>
          <option>PIRÁMIDE</option>
        </select>
      </div>
      <div class="form-group">
        <label for="ex-sets">Series</label>
        <input id="ex-sets" type="number" bind:value={sets} placeholder="4" min="1" />
      </div>
      <div class="form-group">
        <label for="ex-reps">Repeticiones</label>
        <input id="ex-reps" type="text" bind:value={reps} placeholder="8-12" />
      </div>
      <div class="form-group full">
        <label for="ex-notes">Notas</label>
        <input id="ex-notes" type="text" bind:value={notes} placeholder="Observaciones..." />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-cancel" on:click={() => (showForm = false)}>Cancelar</button>
      <button class="btn-save" on:click={submit} disabled={!name.trim()}>Guardar</button>
    </div>
  </div>
{/if}

<style>
  .btn-add {
    width: 100%;
    padding: 0.75rem;
    border: 2px dashed #2d3561;
    border-radius: 10px;
    background: transparent;
    color: #6b7db3;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .btn-add:hover {
    border-color: #e94560;
    color: #e94560;
    background: rgba(233, 69, 96, 0.05);
  }

  .form-card {
    background: #1e2a45;
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid #2d3561;
    margin-top: 0.5rem;
  }

  h3 {
    margin: 0 0 1rem;
    color: #e2e8f0;
    font-size: 1rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .full {
    grid-column: 1 / -1;
  }

  label {
    font-size: 0.8rem;
    color: #8892b0;
    font-weight: 500;
  }

  input, select {
    padding: 0.5rem 0.75rem;
    background: #0f1927;
    border: 1px solid #2d3561;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }

  input:focus, select:focus {
    border-color: #e94560;
  }

  select option {
    background: #0f1927;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .btn-cancel {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #2d3561;
    border-radius: 8px;
    color: #8892b0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    border-color: #8892b0;
    color: #e2e8f0;
  }

  .btn-save {
    padding: 0.5rem 1.25rem;
    background: #e94560;
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-save:hover:not(:disabled) {
    background: #c73652;
  }

  .btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
