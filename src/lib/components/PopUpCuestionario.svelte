<!--
  PopUpCuestionario: pregunta obligatoria que el Stepper muestra antes de avanzar.
  Se puede cerrar (botón, Esc o clic afuera), pero cerrar no cuenta como responder:
  el Stepper no avanza hasta recibir una respuesta.
  No guarda la respuesta: la entrega con onResponder y quien lo usa decide dónde guardarla.
-->
<script lang="ts" module>
  // Forma de una pregunta.
  // id:       nombre único; con él se guarda y se lee la respuesta (respuestas[id])
  // texto:    lo que se pregunta
  // opciones: si existen, se elige una; si no, se responde escribiendo
  // correcta: opcional, índice de la opción correcta (0 = la primera). El popup acepta cualquier
  //           respuesta (no corrige); sirve para compararla después, en el paso que muestra el resultado
  // correcto / incorrecto: opcionales, mensajes para mostrar después según si se acertó
  export type Pregunta = {
    id: string;
    texto: string;
    opciones?: string[];
    correcta?: number;
    correcto?: string;
    incorrecto?: string;
  };
</script>

<script lang="ts">
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';

  // ---------- Props ----------
  // abierto:     si el popup se ve. Es $bindable: el Stepper lo abre y, si se cierra
  //              sin responder, el cambio vuelve al Stepper
  // pregunta:    la pregunta a mostrar
  // onResponder: se llama con la respuesta al presionar "Responder"
  let {
    abierto = $bindable(false),
    pregunta,
    onResponder
  }: {
    abierto?: boolean;
    pregunta: Pregunta;
    onResponder: (valor: string) => void;
  } = $props();

  // Respuesta que se está escribiendo/eligiendo; se vacía cada vez que el popup se abre
  let valor = $state('');
  $effect(() => {
    if (abierto) valor = '';
  });

  // No se puede enviar una respuesta vacía
  const listo = $derived(valor.trim() !== '');

  function responder(e: SubmitEvent) {
    e.preventDefault(); // evita que el formulario recargue la página
    if (listo) onResponder(valor.trim());
  }
</script>

<!--
  open + onOpenChange: al cerrarse (Esc, clic afuera, "Cerrar") se actualiza abierto.
  Cerrar no llama a onResponder, así que el Stepper se queda en el mismo paso.
-->
<Dialog open={abierto} onOpenChange={(e) => (abierto = e.open)}>
  <Portal>
    <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-6 space-y-4 shadow-xl">
        <Dialog.Title class="h4">{pregunta.texto}</Dialog.Title>

        <form class="space-y-4" onsubmit={responder}>
          {#if pregunta.opciones}
            <!-- Selección única -->
            <div class="space-y-2">
              {#each pregunta.opciones as opcion}
                <label class="flex items-center gap-3 cursor-pointer">
                  <input class="radio" type="radio" name={pregunta.id} value={opcion} bind:group={valor} />
                  <span>{opcion}</span>
                </label>
              {/each}
            </div>
          {/if}
          <footer class="flex justify-end gap-2">
            <Dialog.CloseTrigger class="btn preset-tonal">Cerrar</Dialog.CloseTrigger>
            <button type="submit" class="btn preset-filled-primary-500" disabled={!listo}>Responder</button>
          </footer>
        </form>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
