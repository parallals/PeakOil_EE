<!--
  OilCurve: módulo jugable "mantén presionado para extraer".
  Mientras el usuario mantiene presionado el botón, la curva de producción
  de petróleo se va dibujando de izquierda a derecha. Al soltar, se pausa.
  Al llegar al final aparece el botón "Reiniciar".
-->
<script>
  import { crearEscalas, trazarLinea, trazarArea } from '#lib/model/grafico.js';
  import { curvaDemo } from '#lib/model/hubbert.js';

  // ---------- Props (lo que se puede configurar desde afuera) ----------
  // Uso: <OilCurve />  o  <OilCurve data={misDatos} unit="m³/día" duration={5000} />
  let {
    // Datos: [{ label: '1940', value: 12.3 }, ...]. Reemplázalos por los de la petrolera real.
    data = curvaDemo(), // curva de ejemplo de hubbert.js
    unit = 'mil barriles/día', // unidad que se muestra junto al valor
    duration = 7000, // ms de presión continua para recorrer toda la curva
    title = 'Mantén presionado para extraer' // texto pequeño sobre el gráfico
  } = $props();

  // ---------- Interacción: mantener presionado ----------
  let progress = $state(0); // cuánto de la curva se ha recorrido: 0 = nada, 1 = completa
  let holding = $state(false); // true mientras el botón está presionado
  let raf = 0; // id del requestAnimationFrame activo (para poder cancelarlo)
  let last = 0; // instante del cuadro anterior, para medir cuánto tiempo pasó

  // Se ejecuta en cada cuadro de animación (~60 veces por segundo) mientras se presiona.
  // Avanza el progreso en proporción al tiempo transcurrido, así la velocidad
  // no depende de los FPS del dispositivo.
  function tick(now) {
    if (!holding) return;
    // El "now" del primer cuadro puede ser anterior a performance.now() de start():
    // Math.max(0, …) evita que el progreso retroceda y quede negativo (idx = -1 → data[-1] no existe)
    progress = Math.min(1, progress + Math.max(0, now - last) / duration);
    last = now;
    if (progress >= 1) return stop(); // llegó al final: detener
    raf = requestAnimationFrame(tick); // pedir el siguiente cuadro
  }

  // Empieza a extraer (al presionar el botón o la tecla).
  function start(e) {
    if (holding || progress >= 1) return;
    // "Captura" el puntero: el botón sigue recibiendo eventos aunque el dedo/mouse se salga de él
    if (e?.pointerId !== undefined) e.currentTarget.setPointerCapture(e.pointerId);
    holding = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  // Pausa la extracción (al soltar, perder el foco, etc.).
  function stop() {
    holding = false;
    cancelAnimationFrame(raf);
  }

  // Vuelve la curva al inicio.
  function reset() {
    stop();
    progress = 0;
  }

  // Teclado: Espacio o Enter funcionan igual que mantener presionado el botón.
  function onkeydown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); // evita que Espacio haga scroll
      if (!e.repeat) start(); // ignora la repetición automática al dejar la tecla apretada
    }
  }

  function onkeyup(e) {
    if (e.key === ' ' || e.key === 'Enter') stop();
  }

  // Limpieza: si el componente se destruye (p. ej. al cambiar de paso), cancela la animación.
  $effect(() => () => cancelAnimationFrame(raf));

  // ---------- Geometría del gráfico ----------
  // El SVG mide 300×200 "unidades" (viewBox) y se escala al ancho disponible.
  const W = 300, H = 200;
  const pad = { top: 18, right: 14, bottom: 26, left: 22 }; // márgenes para ejes y textos

  const n = $derived(data.length);
  const max = $derived(Math.max(...data.map((d) => d.value)) * 1.15); // 15% de aire sobre el peak
  const peakIndex = $derived(data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)); // índice del valor máximo

  // Convierten un índice de dato (x) o un valor (y) en coordenadas del SVG (ver grafico.js).
  // escala.base es la coordenada y del eje x; escala.innerW el ancho útil para la curva
  const escala = $derived(crearEscalas({ W, H, pad, n, max }));
  const x = (i) => escala.x(i);
  const y = (v) => escala.y(v);

  // Posición continua sobre los datos, para que la línea avance suave entre puntos
  const position = $derived(progress * (n - 1)); // ej. 12.4 = 40% del camino entre el punto 12 y el 13
  const idx = $derived(Math.floor(position)); // último punto completo alcanzado
  const frac = $derived(position - idx); // cuánto se avanzó hacia el siguiente punto (0–1)

  // Valor actual, interpolado linealmente entre el punto idx y el siguiente
  const currentValue = $derived(
    idx >= n - 1 ? data[n - 1].value : data[idx].value + (data[idx + 1].value - data[idx].value) * frac
  );
  const currentLabel = $derived(data[Math.min(Math.round(position), n - 1)].label); // año más cercano

  // Puntos [x, y] de la parte de la curva ya recorrida (más un punto intermedio si va entre dos)
  const points = $derived.by(() => {
    const pts = data.slice(0, idx + 1).map((d, i) => [x(i), y(d.value)]);
    if (idx < n - 1 && frac > 0) pts.push([x(position), y(currentValue)]);
    return pts;
  });

  // Trazados SVG de la línea y del área bajo la curva (ver grafico.js)
  const linePath = $derived(trazarLinea(points));
  const areaPath = $derived(trazarArea(points, escala.base));
  const head = $derived(points.at(-1)); // punta de la curva (el círculo que avanza)

  // Hitos marcados con círculos, como en el boceto: cada 5 puntos, solo los ya alcanzados
  const milestones = $derived(data.map((d, i) => i).filter((i) => i % 5 === 0 && i > 0 && i <= idx));
  const passedPeak = $derived(position >= peakIndex); // ¿ya se pasó el máximo?
  const done = $derived(progress >= 1); // ¿se recorrió toda la curva?

  // Mensaje que acompaña cada etapa de la extracción
  const phase = $derived(
    progress === 0
      ? 'El yacimiento está intacto.'
      : !passedPeak
        ? 'La producción sube: cada año sale más petróleo.'
        : done
          ? 'El yacimiento casi se agotó.'
          : 'Pasado el peak, cada vez sale menos.'
  );

  // Formatea números al estilo chileno (coma decimal), con máximo 1 decimal
  const fmt = (v) => v.toLocaleString('es-CL', { maximumFractionDigits: 1 });
</script>

<div class="module">
  <p class="hint">{title}</p>

  <!-- Lectura en vivo: año actual y producción de ese año -->
  <div class="readout" aria-hidden={progress === 0}>
    <span class="year">{progress === 0 ? '—' : currentLabel}</span>
    <span class="value">{progress === 0 ? '0' : fmt(currentValue)} <small>{unit}</small></span>
  </div>

  <svg
    viewBox="0 0 {W} {H}"
    role="img"
    aria-label={`Producción de petróleo en el tiempo. ${phase}`}
  >
    <!-- Punta de flecha reutilizable para los extremos de los ejes -->
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10" fill="none" stroke="currentColor" stroke-width="2" />
      </marker>
    </defs>

    <!-- Ejes -->
    <g class="axis">
      <!-- Eje y (vertical) y eje x (horizontal), ambos con flecha -->
      <line x1={pad.left} y1={escala.base} x2={pad.left} y2={pad.top - 8} marker-end="url(#arrow)" />
      <line x1={pad.left} y1={escala.base} x2={W - 4} y2={escala.base} marker-end="url(#arrow)" />
      <!-- Marcas pequeñas sobre el eje x, cada 8 puntos -->
      {#each data as d, i}
        {#if i % 8 === 0 && i > 0}
          <line x1={x(i)} y1={escala.base - 4} x2={x(i)} y2={escala.base + 4} />
        {/if}
      {/each}
      <!-- Primer y último año bajo el eje x -->
      <text x={pad.left} y={H - 6} text-anchor="start">{data[0].label}</text>
      <text x={pad.left + escala.innerW} y={H - 6} text-anchor="end">{data[n - 1].label}</text>
    </g>

    <!-- Curva -->
    {#if areaPath}<path class="area" d={areaPath} />{/if}
    {#if linePath}<path class="line" d={linePath} />{/if}

    {#each milestones as i}
      <circle class="milestone" cx={x(i)} cy={y(data[i].value)} r="3.5" />
    {/each}

    <!-- Peak: aparece solo cuando la curva ya pasó por el máximo -->
    {#if passedPeak}
      <g class="peak">
        <line x1={x(peakIndex)} y1={y(data[peakIndex].value)} x2={x(peakIndex)} y2={escala.base} />
        <circle cx={x(peakIndex)} cy={y(data[peakIndex].value)} r="5" />
        <text x={x(peakIndex)} y={y(data[peakIndex].value) - 10} text-anchor="middle">Peak</text>
      </g>
    {/if}

    <!-- Punta de la curva; late (clase "pulsing") mientras se mantiene presionado -->
    {#if head && !done}
      <circle class="head" class:pulsing={holding} cx={head[0]} cy={head[1]} r="4.5" />
    {/if}
  </svg>

  <!-- aria-live: los lectores de pantalla anuncian el mensaje cuando cambia -->
  <p class="phase" aria-live="polite">{phase}</p>

  {#if done}
    <button class="extract" onclick={reset}>Reiniciar</button>
  {:else}
    <!--
      Botón principal. Escucha varios eventos para que "soltar" funcione en todos los casos:
      soltar el dedo/mouse, cancelar el toque, perder la captura del puntero o el foco.
      oncontextmenu evita que en móvil aparezca el menú al mantener presionado.
    -->
    <button
      class="extract"
      class:holding
      onpointerdown={start}
      onpointerup={stop}
      onpointercancel={stop}
      onlostpointercapture={stop}
      oncontextmenu={(e) => e.preventDefault()}
      {onkeydown}
      {onkeyup}
      onblur={stop}
      aria-label="Extraer: mantener presionado"
    >
      Extraer
    </button>
  {/if}
</div>

<style>
  /* Contenedor: define la paleta del módulo como variables CSS */
  .module {
    --blue: #2747e6; /* color de la curva y del botón */
    --ink: currentColor; /* texto principal y ejes: hereda el color del recuadro, se ve en tema claro y oscuro */
    --muted: #8a94a0; /* textos secundarios */

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    color: var(--ink);
    user-select: none; /* evita seleccionar texto al mantener presionado */
    -webkit-user-select: none;
  }

  /* Texto pequeño en mayúsculas sobre el gráfico */
  .hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* Fila con el año (izquierda) y el valor (derecha) */
  .readout {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    width: 100%;
    font-variant-numeric: tabular-nums; /* dígitos de igual ancho: los números no "bailan" */
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

  svg {
    width: 100%;
    height: auto;
    overflow: visible; /* deja ver flechas y textos que se salen del viewBox */
  }

  /* ----- Elementos del gráfico ----- */
  .axis line {
    stroke: var(--ink);
    stroke-width: 2;
    stroke-linecap: round;
    color: var(--ink); /* las flechas usan currentColor */
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

  /* Línea punteada vertical del peak */
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

  /* Punta de la curva y su animación de latido */
  .head {
    fill: var(--blue);
  }

  .head.pulsing {
    animation: pulse 0.6s ease-in-out infinite alternate;
    transform-box: fill-box; /* escala desde el centro del propio círculo */
    transform-origin: center;
  }

  @keyframes pulse {
    to { transform: scale(1.5); }
  }

  /* Mensaje de la etapa; min-height evita saltos cuando el texto ocupa 1 o 2 líneas */
  .phase {
    margin: 0;
    min-height: 2.6em;
    font-size: 0.875rem;
    text-align: center;
    color: var(--muted);
  }

  /* ----- Botón "Extraer" con efecto de tecla física ----- */
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
    touch-action: none; /* evita scroll/zoom mientras se mantiene presionado en móvil */
    box-shadow: 0 4px 0 #1a32a8; /* sombra sólida = "grosor" del botón */
    transition: transform 0.08s, box-shadow 0.08s;
  }

  /* Presionado: baja 3px y la sombra se achica, como si se hundiera */
  .extract.holding {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #1a32a8;
  }

  .extract:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
  }

  /* |eta a quienes configuraron su sistema para reducir animaciones */
  @media (prefers-reduced-motion: reduce) {
    .head.pulsing { animation: none; }
    .extract { transition: none; }
  }
</style>
