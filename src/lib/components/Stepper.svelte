
<script lang="ts">
  import type { Snippet } from 'svelte';
  import PopUpCuestionario, { type Pregunta } from './PopUpCuestionario.svelte';

  // Forma de cada paso: un título obligatorio y un texto opcional.
  // pregunta: opcional. Si existe, al presionar "Siguiente" se abre PopUpCuestionario
  //           y no se avanza hasta responderla
  type Paso = { title: string; body?: string; available?: boolean; pregunta?: Pregunta };
  // ---------- Props ----------
  // pasos:  lista de pasos (define cuántos números aparecen arriba)
  // actual: índice del paso visible. Es $bindable, así que la página puede usar bind:actual
  //         para leerlo o cambiarlo desde afuera
  // paso:   snippet que dibuja el contenido; recibe (pasoActual, índice)
  // available: si el paso actual está disponible. Si no, se desactiva el botón de "Siguiente" y no se puede avanzar.
  // respuestas: respuestas dadas, por id de pregunta ({ peak: 'Decae', ... }). Es $bindable
  //         para que la página las lea y las muestre en pasos posteriores
  // onFinalizar: opcional. Si se entrega, en el último paso "Siguiente" pasa a ser "Finalizar"
  //         y al presionarlo se llama esta función (p. ej. para abrir PopupResultado)
  let {
    pasos = $bindable([] as Paso[]),
    actual = $bindable(0),
    paso,
    available = $bindable(true),
    respuestas = $bindable({}),
    onFinalizar
  }: {
    pasos: Paso[];
    actual?: number;
    paso: Snippet<[Paso, number]>;
    available?: boolean;
    respuestas?: Record<string, string>;
    onFinalizar?: () => void;
  } = $props();

  // Sirven para desactivar "Anterior" en el primer paso y "Siguiente" en el último
  const esPrimero = $derived(actual === 0);
  const esUltimo = $derived(actual === pasos.length - 1);

  // Saltar directo a un paso (al hacer clic en su número)
  function irA(i: number) {
    if(pasos[i]?.available) {
      actual = i;
    }
  }

  // Retroceder / avanzar un paso, sin salirse de los límites
  function anterior() {
    if (!esPrimero) actual--;
  }

  // ---------- Pregunta antes de avanzar ----------
  let preguntaAbierta = $state(false);
  const pregunta = $derived(pasos[actual].pregunta);

  function siguiente() {
    // Si el paso tiene una pregunta sin responder, se pregunta primero y no se avanza todavía
    if (pregunta && respuestas[pregunta.id] === undefined) {
      preguntaAbierta = true;
      return;
    }
    avanzar();
  }

  function avanzar() {
    if (!esUltimo) actual++, pasos[actual].available = true;
    else onFinalizar?.();
  }

  // Guarda la respuesta, cierra el popup y recién ahí avanza
  function alResponder(valor: string) {
    if (!pregunta) return;
    respuestas[pregunta.id] = valor;
    preguntaAbierta = false;
    avanzar();
  }

</script>

<div class="stepper">
  <div class="space-y-8">
    <!-- Timeline -->
    <div class="relative">
      <!-- Un círculo numerado por paso; el activo usa el color primario del tema -->
      <div class="flex justify-between items-center gap-4">
        {#each pasos as p, i}
          <button
            type="button"
            disabled={!p.available}
            class="btn-icon btn-icon-sm rounded-full {i === actual ? 'preset-filled-primary-500' : 'preset-filled-surface-200-800'}"
            onclick={() => irA(i)}
            title="Ir a {p.title}"
            aria-label="Ir a {p.title}"
            aria-current={i === actual ? 'step' : undefined}
          >
          </button>
        {/each}
      </div>
      <!-- Línea horizontal que une los círculos; z-[-1] la deja detrás de ellos -->
      <hr class="hr !border-surface-200-800 absolute top-[50%] left-0 right-0 z-[-1]" />
    </div>

    <!-- Contenido del paso actual (lo define quien usa el Stepper) -->
    <div class="card bg-surface-100-900 p-6 space-y-4">
      {@render paso(pasos[actual], actual)}
    </div>

    <!-- Navegación -->
    <!-- Botones con el mismo color que el recuadro del contenido; disabled en los extremos -->
    <nav class="flex justify-between items-center gap-4">
      <button type="button" class="btn bg-surface-100-900 text-surface-950-50 rounded-container px-6 py-3 hover:brightness-125" onclick={anterior} disabled={esPrimero}>
        <svg viewBox="0 0 24 24" aria-hidden="true" color="white"></svg>
        <span>Anterior</span>
      </button>
      <button type="button" class="btn bg-surface-100-900 text-surface-950-50 rounded-container px-6 py-3 hover:brightness-125" onclick={siguiente} disabled={esUltimo && !onFinalizar}>
        <span>{esUltimo && onFinalizar ? 'Finalizar' : 'Siguiente'}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" color="white"></svg>
      </button>
    </nav>
  </div>
</div>

<!-- Pregunta del paso actual (solo existe si el paso tiene una) -->
{#if pregunta}
  <PopUpCuestionario bind:abierto={preguntaAbierta} {pregunta} onResponder={alResponder} />
{/if}

<style>
  /* Tarjeta que envuelve todo el stepper */
  .stepper {
    width: min(40rem, 100%); /* máximo 40rem, pero nunca más ancho que la pantalla */
    padding: 1.5rem;
    background: rgb(255, 240, 194); /* color de fondo de la tarjeta */
    border-radius: 1rem;
    /* dos sombras: una fina pegada al borde y una amplia y difusa para dar profundidad */
    box-shadow:
      0 1px 2px rgb(31 35 40 / 0.08),
      0 12px 32px -8px rgb(31 35 40 / 0.22);
  }
</style>
