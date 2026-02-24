<script>
  import { createEventDispatcher } from 'svelte';

  export let food;

  const dispatch = createEventDispatcher();

  const mealIcons = {
    'Desayuno': '☀️',
    'Media mañana': '🍎',
    'Almuerzo': '🍽️',
    'Merienda': '🥐',
    'Cena': '🌙',
    'Post-entreno': '💪',
    'Otro': '🍴'
  };
</script>

<div class="food-entry">
  <div class="food-main">
    <div class="food-left">
      <span class="meal-icon">{mealIcons[food.meal] || '🍴'}</span>
      <div class="food-info">
        <span class="food-name">{food.name}</span>
        {#if food.grams}
          <span class="food-grams">{food.grams}g</span>
        {/if}
      </div>
    </div>
    <div class="food-right">
      <span class="food-calories">{food.calories} kcal</span>
      <button class="remove-btn" on:click={() => dispatch('remove')} title="Eliminar">×</button>
    </div>
  </div>
  <div class="food-macros">
    <span class="macro-chip protein">P: {food.protein}g</span>
    <span class="macro-chip carbs">C: {food.carbs}g</span>
    <span class="macro-chip fat">G: {food.fat}g</span>
  </div>
</div>

<style>
  .food-entry {
    background: #0a1929;
    border: 1px solid #1e3a5f;
    border-radius: 10px;
    padding: 0.75rem;
    transition: border-color 0.2s;
  }

  .food-entry:hover {
    border-color: #2d5a9e;
  }

  .food-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  .food-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .meal-icon {
    font-size: 1.2rem;
  }

  .food-info {
    display: flex;
    flex-direction: column;
  }

  .food-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .food-grams {
    font-size: 0.75rem;
    color: #6b9bd2;
  }

  .food-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .food-calories {
    font-size: 0.9rem;
    font-weight: 700;
    color: #fbbf24;
  }

  .remove-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.15);
    border: none;
    color: #ef4444;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    line-height: 1;
  }

  .remove-btn:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .food-macros {
    display: flex;
    gap: 0.4rem;
  }

  .macro-chip {
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 600;
  }

  .protein {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .carbs {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
  }

  .fat {
    background: rgba(249, 115, 22, 0.15);
    color: #f97316;
  }
</style>
