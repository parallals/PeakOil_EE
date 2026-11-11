<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';

  // ---------- Props ----------
  // abierto:  si el popup se ve o no. Es $bindable: se cierra solo (Esc, clic afuera, botón)
  //           y el cambio vuelve a quien lo usa
  // titulo:   encabezado del popup
  // children: contenido del mensaje
  // acciones: botones extra opcionales (p. ej. "Volver al inicio"), junto al de cerrar
  let {
    abierto = $bindable(false),
    titulo = 'Aviso',
    children,
    acciones
  }: {
    abierto?: boolean;
    titulo?: string;
    children?: Snippet;
    acciones?: Snippet;
  } = $props();
</script>

<!--
  open + onOpenChange: el Dialog queda "controlado" por la variable abierto.
  Cuando el Dialog se cierra por su cuenta, onOpenChange actualiza abierto.
-->
<Dialog open={abierto} onOpenChange={(e) => (abierto = e.open)}>
  <!-- Portal: dibuja el popup al final del <body>, por encima de todo el Stepper -->
  <Portal>
    <!-- Fondo semitransparente que oscurece la página -->
    <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
    <!-- Centra el contenido en la pantalla -->
    <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-6 space-y-4 shadow-xl">
        <Dialog.Title class="h4">{titulo}</Dialog.Title>
        <Dialog.Description>
          {@render children?.()}
        </Dialog.Description>
        <footer class="flex justify-end gap-2">
          {@render acciones?.()}
          <Dialog.CloseTrigger class="btn preset-filled-primary-500">Cerrar</Dialog.CloseTrigger>
        </footer>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
