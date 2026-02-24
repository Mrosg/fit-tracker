<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let showForm = false;
  let name = '';
  let calories = '';
  let protein = '';
  let carbs = '';
  let fat = '';
  let grams = '';
  let meal = 'Almuerzo';

  const meals = ['Desayuno', 'Media mañana', 'Almuerzo', 'Merienda', 'Cena', 'Post-entreno', 'Otro'];

  function submit() {
    if (!name.trim()) return;
    dispatch('add', {
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      grams: Number(grams) || 0,
      meal
    });
    name = '';
    calories = '';
    protein = '';
    carbs = '';
    fat = '';
    grams = '';
    meal = 'Almuerzo';
    showForm = false;
  }
</script>

{#if !showForm}
  <button class="btn-add" on:click={() => (showForm = true)}>
    + Añadir alimento
  </button>
{:else}
  <div class="form-card">
    <h3>Registrar alimento</h3>
    <div class="form-grid">
      <div class="form-group full">
        <label>Nombre del alimento</label>
        <input
          type="text"
          bind:value={name}
          placeholder="Ej: Pechuga de pollo"
          autofocus
        />
      </div>
      <div class="form-group">
        <label>Comida</label>
        <select bind:value={meal}>
          {#each meals as m}
            <option value={m}>{m}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>Gramos (g)</label>
        <input type="number" bind:value={grams} placeholder="150" min="0" />
      </div>
      <div class="form-group macro-cal">
        <label>Calorías (kcal)</label>
        <input type="number" bind:value={calories} placeholder="0" min="0" />
      </div>
      <div class="form-group">
        <label>Proteína (g)</label>
        <input type="number" bind:value={protein} placeholder="0" min="0" />
      </div>
      <div class="form-group">
        <label>Carbohidratos (g)</label>
        <input type="number" bind:value={carbs} placeholder="0" min="0" />
      </div>
      <div class="form-group">
        <label>Grasas (g)</label>
        <input type="number" bind:value={fat} placeholder="0" min="0" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-cancel" on:click={() => (showForm = false)}>Cancelar</button>
      <button class="btn-save" on:click={submit} disabled={!name.trim()}>Añadir</button>
    </div>
  </div>
{/if}

<style>
  .btn-add {
    width: 100%;
    padding: 0.75rem;
    border: 2px dashed #1e3a5f;
    border-radius: 10px;
    background: transparent;
    color: #5b8dd9;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .btn-add:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }

  .form-card {
    background: #132238;
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid #1e3a5f;
    margin-top: 0.5rem;
  }

  h3 {
    margin: 0 0 1rem;
    color: #e2e8f0;
    font-size: 1rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
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

  .macro-cal {
    grid-column: 1 / -1;
  }

  label {
    font-size: 0.8rem;
    color: #6b9bd2;
    font-weight: 500;
  }

  input, select {
    padding: 0.5rem 0.75rem;
    background: #0a1929;
    border: 1px solid #1e3a5f;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }

  input:focus, select:focus {
    border-color: #3b82f6;
  }

  select option {
    background: #0a1929;
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
    border: 1px solid #1e3a5f;
    border-radius: 8px;
    color: #6b9bd2;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    border-color: #6b9bd2;
    color: #e2e8f0;
  }

  .btn-save {
    padding: 0.5rem 1.25rem;
    background: #3b82f6;
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-save:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
