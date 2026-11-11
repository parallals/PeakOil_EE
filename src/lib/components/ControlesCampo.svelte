<!-- Un "Controlador" para Campo Petrolero. Permite al usuario ver los sliders.
    <ControlesCampo bind:lado bind:reserva bind:automatico />
    <CampoPetrolero filas={lado} columnas={lado} reservaPromedio={reserva} bind:automatico />
  Los controles opcionales aparecen solo si se conectan:
    bind:reserva   → slider de cantidad de petróleo por pozo
    bind:tasa      → slider de tasa de recuperación
-->
<script>
  // lado:       casillas por fila y por columna (grilla cuadrada), de 2 a 6
  // reserva:    opcional. Petróleo promedio por pozo
  // tasa:       opcional. % de su reserva que un pozo agotado recupera por turno
  // automatico: si el juego avanza solo
  let {
    lado = $bindable(4),
    reserva = $bindable(),
    tasa = $bindable(),
    automatico = $bindable()
  } = $props();
</script>

<div class="controles">

  <label>
    <span>Tamaño de la grilla <strong>{lado}×{lado}</strong></span>
    <!-- Cambiar el tamaño empieza un campo nuevo -->
    <input type="range" min="2" max="6" step="1" bind:value={lado} disabled={automatico} />
  </label>

  {#if reserva !== undefined}
    <label>
      <span>Petróleo por pozo <strong>{reserva}</strong> <small>mil barriles</small></span>
      <!-- Afecta a los pozos que se descubran desde ahora -->
      <input type="range" min="5" max="30" step="1" bind:value={reserva} disabled={automatico} />
    </label>
  {/if}

  {#if tasa !== undefined}
    <label>
      <span>Tasa de recuperación <strong>{tasa}% por turno</strong></span>
      <input type="range" min="0" max="25" step="1" bind:value={tasa} disabled={automatico}/>
      <small>
        {tasa === 0
          ? 'Los pozos agotados no vuelven.'
          : `Un pozo agotado vuelve a estar disponible en ${Math.ceil(100 / tasa)} turnos.`}
      </small>
    </label>
  {/if}

  <!-- aria-pressed: los lectores de pantalla lo anuncian como interruptor (activado/desactivado) -->
  <button type="button" class="auto" aria-pressed={automatico} onclick={() => (automatico = !automatico)}>
    {automatico ? 'Pausar' : 'Simular'}
  </button>
</div>

<style>
  .controles {
    --blue: #2747e6;
    --muted: #8a94a0;

    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    font-size: 0.875rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  label span {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
  }

  label small {
    color: var(--muted);
  }

  input[type='range'] {
    width: 100%;
    accent-color: var(--blue); /* color del slider nativo */
    cursor: pointer;
  }

  /* Bloqueado mientras corre el modo automático */
  input[type='range']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Botón interruptor: borde azul; relleno cuando está activo */
  .auto {
    align-self: center;
    padding: 0.5rem 1.25rem;
    border: 2px solid var(--blue);
    border-radius: 0.6rem;
    background: var(--blue);
    color: white;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .auto[aria-pressed='true'] {
    background: var(--blue);
    color: white;
  }

  .auto:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }
</style>
