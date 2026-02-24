<script>
  export let label;
  export let current;
  export let goal;
  export let color;
  export let unit = 'g';

  $: percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  $: over = goal > 0 && current > goal;
</script>

<div class="macro-bar">
  <div class="macro-header">
    <div class="macro-label">
      <span class="dot" style="background: {color}"></span>
      <span>{label}</span>
    </div>
    <div class="macro-values">
      <span class="current" class:over style="color: {over ? '#ef4444' : color}">{Math.round(current)}</span>
      <span class="separator">/</span>
      <span class="goal">{goal}{unit}</span>
    </div>
  </div>
  <div class="bar-track">
    <div
      class="bar-fill"
      class:over
      style="width: {percentage}%; background: {over ? '#ef4444' : color}"
    ></div>
  </div>
  <div class="macro-remaining">
    {#if over}
      <span class="over-text">+{Math.round(current - goal)}{unit} sobre el objetivo</span>
    {:else}
      <span class="remaining-text">{Math.round(goal - current)}{unit} restantes</span>
    {/if}
  </div>
</div>

<style>
  .macro-bar {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .macro-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .macro-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: #a8b2d8;
    font-weight: 500;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .macro-values {
    display: flex;
    align-items: baseline;
    gap: 0.2rem;
    font-size: 0.85rem;
  }

  .current {
    font-weight: 700;
    font-size: 1rem;
  }

  .separator {
    color: #4a5568;
  }

  .goal {
    color: #6b7db3;
    font-size: 0.8rem;
  }

  .bar-track {
    height: 8px;
    background: #1e2a45;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.4s ease;
  }

  .macro-remaining {
    font-size: 0.72rem;
  }

  .remaining-text {
    color: #4a5568;
  }

  .over-text {
    color: #ef4444;
  }
</style>
