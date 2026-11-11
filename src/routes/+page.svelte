<script>
	// Componentes: el Stepper organiza los pasos; los demás son los módulos interactivos
	import Stepper from '#lib/components/Stepper.svelte';
	import OilCurve from '#lib/components/OilCurve.svelte';
	import CampoPetrolero from '#lib/components/CampoPetrolero.svelte';
	import ControlesCampo from '#lib/components/ControlesCampo.svelte';
	import PopupResultado from '#lib/components/PopupResultado.svelte';

	// Todo lo relacionado a texto está en pasos.js
	
	import { pasos as contenido, final } from '#lib/model/pasos.js';

	let pasos = $state(contenido.map((p, i) => ({ ...p, available: i === 0 })));

	// Empieza por el primer paso
	let actual = $state(0);

	// Para valores de ControlesCampo
	let lado = $state(4);
	let reserva = $state(15);
	let automatico = $state(false);
	let tasa = $state(0); // tasa de recuperación, % por turno (solo en el paso "retorno")

	// Para cuando se acaba la explorable explanation
	let popupFinished = $state(false);

	// Las llena el Stepper (bind:respuestas) y cualquier paso posterior puede leerlas.
	// TODO: Aparentemente, con $effect se pueden guardar respuestas en vez de hacerlo cada vez que pasa el Stepper. Siento que se aprovecharía mejor Svelte de esta manera
	/** @type {Record<string, string>} */
	let respuestas = $state({});

	// Busca en pasos.js la pregunta con ese id
	/** @param {string} id */
	const buscarPregunta = (id) => contenido.find((p) => p.pregunta?.id === id)?.pregunta;

	// Compara el id de la pregunta con la respuesta correcta y devuelve true/false.
	/** @param {string} id */
	function acerto(id) {
		const q = buscarPregunta(id);
		return !!q?.opciones && q.correcta !== undefined && respuestas[id] === q.opciones[q.correcta];
	}

	// Cierra el popup y vuelve al primer paso
	function volverAlInicio() {
		popupFinished = false;
		actual = 0;
	}
</script>

<main>
	<Stepper bind:pasos bind:actual bind:respuestas onFinalizar={() => (popupFinished = true)}>
		{#snippet paso(p, i)}
			<h2 class="h3">{p.title}</h2>
			<p class="whitespace-pre-line">{p.body}</p>
			<!-- Para las imágenes -->
			{#if p.imagen}
				<img src={p.imagen} alt={p.alt ?? ''} class="w-full h-auto rounded-container" />
			{/if}
			<!-- Para la notación (Documentación) -->
			{#if p.notacion}
				<p class="text-sm italic opacity-70">{p.notacion}</p>
			{/if}
			<!-- Para el Componente. p.modulo se encuentra en pasos.js -->
			{#if p.modulo === 'curvalenta'}
				<OilCurve />
				{@render resultado('peak')}
			{:else if p.modulo === 'extraer'}
				<CampoPetrolero />
				{@render resultado('pm2')}
			{:else if p.modulo === 'simulacrum'}
				<ControlesCampo bind:lado bind:reserva bind:automatico />
				{@render campo(0, false)}
			{:else if p.modulo === 'retorno'}
				<!-- bind:tasa hace aparecer el slider de tasa de recuperación -->
				<ControlesCampo bind:lado bind:reserva bind:automatico bind:tasa />
				{@render campo(tasa, true)}
			{:else if p.modulo === 'regeneracionpetrolera'}
				{@render resultado('pm3')}
			
			{/if}

		{/snippet}

		<!-- Motor del campo (CampoPetrolero): 
		     tasaRecuperacion = 0: los pozos agotados no vuelven
		     conTasa: si el paso tiene el slider de tasa (aunque esté en 0) -->
		{#snippet campo(/** @type {number} */ tasaRecuperacion, /** @type {boolean} */ conTasa)}
			<!-- {#key lado}: al cambiar el tamaño se crea un campo nuevo desde cero.
			     La tasa no está en el key: cambiarla no reinicia el juego -->
			{#key lado}
				<CampoPetrolero
					filas={lado}
					columnas={lado}
					reservaPromedio={reserva}
					{tasaRecuperacion}
					bind:automatico
					conExtraer={false}
					{conTasa}
					title="Configura el campo y observa la curva"
				/>
			{/key}
		{/snippet}

		<!-- Muestra lo que se respondió a la pregunta "id" y el mensaje correcto/incorrecto de pasos.js -->
		{#snippet resultado(/** @type {string} */ id)}
			{@const q = buscarPregunta(id)}
			{#if q && respuestas[id]}
				<p class="card preset-tonal p-4">
					Antes respondiste: <strong>{respuestas[id]}</strong>.
					{acerto(id) ? q.correcto : q.incorrecto}
				</p>
			{/if}
		{/snippet}


	</Stepper>

	<!-- Popup que aparece al terminar el recorrido -->
	<PopupResultado bind:abierto={popupFinished} titulo={final.titulo}>
		<p>{final.texto}</p>
		{#snippet acciones()}
			<button type="button" class="btn preset-tonal" onclick={volverAlInicio}>Volver al inicio</button>
		{/snippet}
	</PopupResultado>
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 1.5rem 1rem;
		background: rgb(0,0,0);
	}
</style>
