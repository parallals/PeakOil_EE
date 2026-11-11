<script>
  import { acumulado } from '#lib/model/hubbert.js';
  import { crearEscalas, trazarLinea, trazarArea } from '#lib/model/grafico.js';

  // Motor del juego: no tiene controles de configuración propios; todo llega por props.
  // Los controles (sliders, botón automático) viven afuera, p. ej. en ControlesCampo.svelte.
  //
  // filas, columnas:  tamaño de la grilla. Se leen al crear el campo: si cambian, quien lo usa
  //                   debe recrear el componente con {#key} (ver +page.svelte)
  // reservaPromedio:  petróleo promedio de cada pozo. Cada pozo varía al azar entre 2/3 y 4/3
  //                   de este valor (con 15: entre 10 y 20). Se lee al descubrir cada pozo, así
  //                   que cambiarlo a mitad de partida afecta solo a los pozos nuevos
  // tasaRecuperacion:      % de su reserva que un pozo agotado recupera por turno. Al llegar al 100%
  //                   vuelve a estar disponible para explorar. 0 (por defecto) = nunca vuelve
  // automatico:       $bindable. Si es true, el juego avanza solo; se apaga al terminar
  // conExtraer:       si se muestra el botón "Extraer". En false, los turnos solo avanzan en
  //                   modo automático (p. ej. cuando lo controla ControlesCampo)
  let {
    filas = 3,
    columnas = 3,
    reservaPromedio = 15,
    tasaRecuperacion = 0,
    automatico = $bindable(false),
    conExtraer = true,
    conTasa = false,
    unit = 'mil barriles/turno', // unidad que se muestra junto al valor
    title = 'Explora una casilla, extrae, repite' // texto pequeño sobre la grilla
  } = $props();

  // ---------- Reglas del juego ----------
  const MS_POR_TURNO = 300; // modo automático: cada cuánto avanza un turno
  const K_POZO = 1; // qué tan rápido sube y cae cada pozo (más alto = vida más corta)
  const T_PICO_POZO = 2; // un pozo alcanza su máximo 2 turnos después de descubrirse
  const UMBRAL_AGOTADO = 0.02; // si le queda menos del 2% de su reserva, se considera agotado
  const UMBRAL_DECLIVE = 0.3; // si le queda menos del 30%, se marca como "en declive"
  // Con tasa de recuperación el juego puede no terminar nunca: el gráfico muestra solo los últimos turnos
  const VENTANA = 100;

  // recuperado: en un pozo agotado, cuánto lleva recuperado (0 a 1)
  /** @typedef {{ estado: 'oculto' | 'activo' | 'agotado', reserva: number, extraido: number, inicio: number, recuperado: number }} Pozo */

  /** @returns {Pozo} */
  const pozoNuevo = () => ({ estado: 'oculto', reserva: 0, extraido: 0, inicio: 0, recuperado: 0 });

  /** @returns {Pozo[]} */
  function campoNuevo() {
    return Array.from({ length: filas * columnas }, pozoNuevo);
  }

  // ---------- Estado ----------
  let pozos = $state(campoNuevo());
  let turno = $state(0); // turnos transcurridos
  let exploradoEsteTurno = $state(false); // solo se puede explorar una casilla por turno
  // Producción total de cada turno. Empieza en 0 para que la curva nazca desde el eje.
  // "nuevo" marca los turnos en que se descubrió un pozo (se dibujan con un círculo).
  /** @type {{ valor: number, nuevo: boolean }[]} */
  let historia = $state([{ valor: 0, nuevo: false }]);

  const activos = $derived(pozos.filter((p) => p.estado === 'activo').length);
  const ocultos = $derived(pozos.filter((p) => p.estado === 'oculto').length);
  // Todo explorado y agotado
  const todoAgotado = $derived(ocultos === 0 && activos === 0);
  // Terminado: todo agotado y sin tasa de recuperación (nada va a volver)
  const terminado = $derived(todoAgotado && tasaRecuperacion <= 0);
  // Esperando: todo agotado, pero con tasa de recuperación los pozos se van recuperando
  const esperando = $derived(todoAgotado && tasaRecuperacion > 0);
  // Turnos que faltan para que vuelva el pozo más recuperado
  const faltan = $derived.by(() => {
    if (tasaRecuperacion <= 0) return Infinity;
    const masAvanzado = Math.max(0, ...pozos.filter((p) => p.estado === 'agotado').map((p) => p.recuperado));
    return Math.ceil(((1 - masAvanzado) * 100) / tasaRecuperacion);
  });

  // ---------- Acciones ----------

  // Explora una casilla: aparece un pozo con una reserva al azar.
  /** @param {number} i */
  function explorar(i) {
    const p = pozos[i];
    if (p.estado !== 'oculto' || exploradoEsteTurno) return;
    p.reserva = reservaPromedio * (2 / 3 + Math.random() * (2 / 3)); // entre 2/3 y 4/3 del promedio
    p.extraido = 0;
    p.inicio = turno;
    p.estado = 'activo';
    exploradoEsteTurno = true;
  }

  // Cuánto extrae un pozo en un turno, según su edad (turnos desde que se descubrió).
  // Usa la curva acumulada de Hubbert: lo que sale en el turno "edad" es la diferencia
  // entre lo acumulado al final y al inicio de ese turno. Se reescala para que la suma
  // desde la edad 0 sea exactamente la reserva del pozo.
  /** @param {Pozo} p */
  function produccionDelTurno(p) {
    const params = { urr: p.reserva, k: K_POZO, tPico: T_PICO_POZO };
    const edad = turno - p.inicio;
    const yaAntes = acumulado(0, params); // parte de la curva "anterior" al descubrimiento
    const factor = p.reserva / (p.reserva - yaAntes);
    return (acumulado(edad + 1, params) - acumulado(edad, params)) * factor;
  }

  // Avanza el tiempo un turno: los pozos activos extraen y los agotados se recuperan
  // según la tasa de recuperación. Un pozo recuperado al 100% vuelve a estar disponible.
  function extraer() {
    // Sin pozos activos solo se avanza si se está esperando que alguno se recupere
    if (activos === 0 && !esperando) return;
    let total = 0;
    for (let i = 0; i < pozos.length; i++) {
      const p = pozos[i];
      if (p.estado === 'agotado') {
        // Retorno: recupera tasaRecuperación% por turno
        p.recuperado = Math.min(1, p.recuperado + tasaRecuperacion / 100);
        if (p.recuperado >= 1) pozos[i] = pozoNuevo(); // vuelve a estar disponible
        continue;
      }
      if (p.estado !== 'activo') continue;
      let q = Math.min(produccionDelTurno(p), p.reserva - p.extraido);
      // Si queda muy poco, se extrae el resto y el pozo se cierra
      if (p.reserva - p.extraido - q < p.reserva * UMBRAL_AGOTADO) {
        q = p.reserva - p.extraido;
        p.estado = 'agotado';
        p.recuperado = 0;
      }
      p.extraido += q;
      total += q;
    }
    historia.push({ valor: total, nuevo: exploradoEsteTurno });
    turno++;
    exploradoEsteTurno = false;
    // Si el campo terminó, se agrega el 0 final para cerrar la curva
    if (terminado) historia.push({ valor: 0, nuevo: false });
  }

  function reiniciar() {
    pozos = campoNuevo();
    turno = 0;
    exploradoEsteTurno = false;
    historia = [{ valor: 0, nuevo: false }];
  }

  // ---------- Modo automático ----------

  // Un turno automático: si el usuario no exploró en este turno, se explora una casilla
  // al azar (si quedan); luego se extrae. Al terminar el campo, el modo se apaga solo.
  function turnoAutomatico() {
    if (!exploradoEsteTurno) {
      const libres = pozos.map((_, i) => i).filter((i) => pozos[i].estado === 'oculto');
      if (libres.length) explorar(libres[Math.floor(Math.random() * libres.length)]);
    }
    extraer();
    if (terminado) automatico = false;
  }

  // Mientras "automatico" sea true, llama a turnoAutomatico cada MS_POR_TURNO.
  // La función que retorna detiene el temporizador al pausar o al destruir el componente.
  $effect(() => {
    if (!automatico) return;
    const id = setInterval(turnoAutomatico, MS_POR_TURNO);
    return () => clearInterval(id);
  });

  // ---------- Geometría del gráfico ----------
  const W = 300, H = 200;
  const pad = { top: 18, right: 14, bottom: 26, left: 22 };

  // Solo los últimos VENTANA turnos
  const visibles = $derived(historia.slice(-VENTANA));

  // El eje x muestra al menos 16 turnos y se estira hasta VENTANA
  const n = $derived(Math.max(16, visibles.length));
  // Con muchos turnos, una marca cada 10 en vez de una por turno
  const cadaMarca = $derived(n > 40 ? 10 : 1);
  // El eje y se ajusta al valor más alto visible (con 15% de aire), con un mínimo de 10
  const max = $derived(Math.max(10, ...visibles.map((d) => d.valor)) * 1.15);
  const escala = $derived(crearEscalas({ W, H, pad, n, max }));

  const points = $derived(visibles.map((d, i) => [escala.x(i), escala.y(d.valor)]));
  const linePath = $derived(trazarLinea(points));
  const areaPath = $derived(trazarArea(points, escala.base));

  // Peak: el turno de mayor producción. Se muestra cuando la producción ya bajó desde ahí.
  const peakIndex = $derived(visibles.reduce((best, d, i) => (d.valor > visibles[best].valor ? i : best), 0));
  const passedPeak = $derived(visibles[peakIndex].valor > 0 && visibles.at(-1).valor < visibles[peakIndex].valor);

  const ultimo = $derived(historia.at(-1).valor); // producción del último turno

  // Formatea números al estilo chileno (coma decimal), con máximo 1 decimal
  /** @param {number} v */
  const fmt = (v) => v.toLocaleString('es-CL', { maximumFractionDigits: 1 });

  // Mensaje que acompaña cada etapa del juego
  const phase = $derived(
    terminado
      ? 'El campo se agotó y la producción volvió a 0. Todo el campo dibujó la misma forma de crecimiento, peak y decay que la curva de Hubbert.'
      : turno === 0 && activos === 0
        ? 'Elige una casilla para explorar.'
        : esperando
          ? `Todos los pozos están agotados. Con esta tasa de recuperación, el primero vuelve en ${fmt(faltan)} turno${faltan === 1 ? '' : 's'}.`
          : activos === 0
            ? 'No hay pozos activos: explora otra casilla para seguir extrayendo.'
            : ocultos === 0 && passedPeak && tasaRecuperacion <= 0
              ? 'Ya no quedan lugares por explorar: la producción solo puede bajar.'
              : passedPeak
                ? 'Pasado el peak: los pozos nuevos ya no compensan a los que se agotan.'
                : 'La producción sube: cada pozo nuevo suma petróleo.'
  );

  // Texto accesible de cada casilla
  /** @param {Pozo} p @param {number} i */
  function etiqueta(p, i) {
    const pos = `fila ${Math.floor(i / columnas) + 1}, columna ${(i % columnas) + 1}`;
    if (p.estado === 'oculto') return `Explorar ${pos}`;
    if (p.estado === 'agotado') {
      return tasaRecuperacion > 0
        ? `Pozo agotado en ${pos}, recuperado ${Math.round(p.recuperado * 100)}%`
        : `Pozo agotado en ${pos}`;
    }
    const resto = Math.round((1 - p.extraido / p.reserva) * 100);
    return `Pozo activo en ${pos}, le queda ${resto}%`;
  }
</script>

<div class="module">
  <p class="hint">{title}</p>

  <!-- Grilla del campo: cada casilla es un botón -->
  <div class="campo" style="grid-template-columns: repeat({columnas}, 1fr);">
    {#each pozos as p, i}
      {@const resto = p.estado === 'oculto' ? 1 : 1 - p.extraido / p.reserva}
      <button
        class="casilla {p.estado}"
        class:declive={p.estado === 'activo' && resto < UMBRAL_DECLIVE}
        disabled={p.estado !== 'oculto' || exploradoEsteTurno || terminado}
        onclick={() => explorar(i)}
        aria-label={etiqueta(p, i)}
      >
        {#if p.estado !== 'oculto'}
          <!-- Torre de perforación -->
          <svg class="icono" viewBox="0 0 20 24" aria-hidden="true">
            <path d="M10 2 L4 22 M10 2 L16 22 M6 15 L14 15 M7.5 9 L12.5 9 M2 22 L18 22" />
          </svg>
          {#if p.estado === 'agotado' && tasaRecuperacion > 0}
            <!-- Barra verde: cuánto se ha recuperado el pozo agotado -->
            <span class="reserva recupera"><span style="width: {p.recuperado * 100}%"></span></span>
          {:else}
            <!-- Barra con la reserva que le queda -->
            <span class="reserva"><span style="width: {resto * 100}%"></span></span>
          {/if}
        {/if}
      </button>
    {/each}
  </div>

  <!-- Lectura: tiempo transcurrido y producción del último turno -->
  <div class="readout">
    <span class="year">Turno {turno}</span>
    <span class="value">{fmt(ultimo)} <small>{unit}</small></span>
  </div>

  <svg viewBox="0 0 {W} {H}" role="img" aria-label={`Producción total del campo en el tiempo. ${phase}`}>
    <!-- Punta de flecha reutilizable para los extremos de los ejes -->
    <defs>
      <marker id="flecha-campo" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10" fill="none" stroke="currentColor" stroke-width="2" />
      </marker>
    </defs>

    <!-- Ejes, con marcas de tiempo -->
    <g class="axis">
      <line x1={pad.left} y1={escala.base} x2={pad.left} y2={pad.top - 8} marker-end="url(#flecha-campo)" />
      <line x1={pad.left} y1={escala.base} x2={W - 4} y2={escala.base} marker-end="url(#flecha-campo)" />
      {#each { length: n - 1 } as _, i}
        {#if (i + 1) % cadaMarca === 0}
          <line x1={escala.x(i + 1)} y1={escala.base - 3} x2={escala.x(i + 1)} y2={escala.base + 3} />
        {/if}
      {/each}
      <text x={pad.left + escala.innerW} y={H - 6} text-anchor="end">
        tiempo (turnos{historia.length > VENTANA ? `, últimos ${VENTANA}` : ''})
      </text>
    </g>

    <!-- Curva de producción total -->
    {#if areaPath}<path class="area" d={areaPath} />{/if}
    {#if linePath}<path class="line" d={linePath} />{/if}

    <!-- Un círculo en cada turno en que se descubrió una casilla -->
    {#each visibles as d, i}
      {#if d.nuevo}
        <circle class="milestone" cx={escala.x(i)} cy={escala.y(d.valor)} r="3.5" />
      {/if}
    {/each}

    <!-- Peak: aparece cuando la producción ya bajó desde el máximo -->
    {#if passedPeak}
      <g class="peak">
        <line x1={escala.x(peakIndex)} y1={escala.y(visibles[peakIndex].valor)} x2={escala.x(peakIndex)} y2={escala.base} />
        <circle cx={escala.x(peakIndex)} cy={escala.y(visibles[peakIndex].valor)} r="5" />
        <text x={escala.x(peakIndex)} y={escala.y(visibles[peakIndex].valor) - 10} text-anchor="middle">Peak</text>
      </g>
    {/if}
  </svg>

  <!-- aria-live: los lectores de pantalla anuncian el mensaje cuando cambia -->
  <p class="phase" aria-live="polite">{phase}</p>

  {#if terminado}
    <button class="extract" onclick={reiniciar}>Reiniciar</button>
  {:else if conExtraer}
    <!-- En modo automático los turnos avanzan solos, así que "Extraer" se desactiva -->
    <button class="extract" onclick={extraer} disabled={(activos === 0 && !esperando) || automatico}>Extraer</button>
  {:else if conTasa}
    <p class="hint">La producción de los pozos agotados se recupera a {tasaRecuperacion}% por turno.</p>
  {/if}
</div>

<style>
  /* Misma paleta que OilCurve, más los colores de las casillas */
  .module {
    --blue: #2747e6;
    --ink: currentColor; /* hereda el color de texto del recuadro: se ve en tema claro y oscuro */
    --muted: #8a94a0;
    --tinta-casilla: #1f2933; /* ícono y barra, siempre oscuros sobre casillas claras */
    --activo: #b7e4a8; /* casilla produciendo */
    --declive: #f3d98b; /* casilla con poca reserva */
    --agotado: #d5d8dc; /* casilla agotada */
    --recupera: #3f9b4f; /* barra de recuperación */

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    color: var(--ink);
    user-select: none;
    -webkit-user-select: none;
  }

  .hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ----- Grilla del campo ----- */
  .campo {
    display: grid; /* las columnas se definen inline según la prop "columnas" */
    gap: 4px;
    width: min(14rem, 100%);
    padding: 4px;
    background: var(--ink); /* el fondo asoma entre casillas y forma las líneas de la grilla */
    border-radius: 0.4rem;
  }

  .casilla {
    aspect-ratio: 1; /* casillas cuadradas */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    border: none;
    border-radius: 2px;
    background: white;
    opacity: 1; /* Skeleton atenúa los botones desactivados; aquí no queremos eso */
    transition: background 0.2s;
  }

  /* Durante el turno en que ya se exploró, las casillas libres se atenúan un poco */
  .casilla.oculto:disabled {
    opacity: 0.6;
  }

  /* Casilla sin explorar: se puede presionar */
  .casilla.oculto:not(:disabled) {
    cursor: pointer;
  }

  .casilla.oculto:not(:disabled):hover {
    background: #e8ecff;
  }

  .casilla.activo { background: var(--activo); }
  .casilla.activo.declive { background: var(--declive); }
  .casilla.agotado { background: var(--agotado); }

  .casilla:focus-visible {
    outline: 2px solid var(--blue);
    outline-offset: -2px;
  }

  .icono {
    width: 40%;
    fill: none;
    stroke: var(--tinta-casilla);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .agotado .icono { opacity: 0.4; }

  /* Barra de reserva restante */
  .reserva {
    width: 60%;
    height: 4px;
    border-radius: 2px;
    background: rgb(0 0 0 / 0.15);
    overflow: hidden;
  }

  .reserva span {
    display: block;
    height: 100%;
    background: var(--tinta-casilla);
    transition: width 0.3s;
  }

  /* Barra de recuperación: verde */
  .reserva.recupera span {
    background: var(--recupera);
  }

  /* ----- Lectura ----- */
  .readout {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    width: 100%;
    font-variant-numeric: tabular-nums;
  }

  .year {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .value {
    font-size: 1rem;
    font-weight: 600;
    color: var(--blue);
  }

  .value small {
    font-weight: 400;
    color: var(--muted);
  }

  /* ----- Gráfico (igual que OilCurve) ----- */
  svg {
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .axis line {
    stroke: var(--ink);
    stroke-width: 2;
    stroke-linecap: round;
    color: var(--ink);
  }

  .axis text {
    font-size: 9px;
    fill: var(--muted);
  }

  .area {
    fill: var(--blue);
    opacity: 0.1;
  }

  .line {
    fill: none;
    stroke: var(--blue);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .milestone {
    fill: white;
    stroke: var(--blue);
    stroke-width: 2;
  }

  .peak line {
    stroke: var(--blue);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.6;
  }

  .peak circle {
    fill: white;
    stroke: var(--blue);
    stroke-width: 2.5;
  }

  .peak text {
    font-size: 10px;
    font-weight: 700;
    fill: var(--blue);
  }

  .phase {
    margin: 0;
    min-height: 2.6em;
    font-size: 0.875rem;
    text-align: center;
    color: var(--muted);
  }

  /* ----- Botón "Extraer" (mismo estilo que OilCurve) ----- */
  .extract {
    padding: 0.6rem 2rem;
    border: none;
    border-radius: 0.6rem;
    background: var(--blue);
    color: white;
    font: inherit;
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 4px 0 #1a32a8;
    transition: transform 0.08s, box-shadow 0.08s;
  }

  .extract:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #1a32a8;
  }

  /* Gris mientras no haya nada activo, como en el boceto */
  .extract:disabled {
    background: var(--muted);
    box-shadow: 0 4px 0 #4b545e;
    cursor: not-allowed;
  }

  .extract:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .casilla, .reserva span, .extract { transition: none; }
  }
</style>
