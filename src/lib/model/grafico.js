/** @typedef {{ top: number, right: number, bottom: number, left: number }} Margenes */

/**
 * Crea las escalas que convierten datos en coordenadas del SVG.
 * x(i): índice del dato (0 … n-1) → posición horizontal
 * y(v): valor → posición vertical (en SVG la y crece hacia abajo, por eso se resta desde la base)
 * @param {{ W: number, H: number, pad: Margenes, n: number, max: number }} opciones
 */
export function crearEscalas({ W, H, pad, n, max }) {
	const innerW = W - pad.left - pad.right; // ancho útil para la curva
	const innerH = H - pad.top - pad.bottom; // alto útil para la curva
	const base = pad.top + innerH; // coordenada y del eje x
	return {
		innerW,
		innerH,
		base,
		/** @param {number} i */
		x: (i) => pad.left + (i / Math.max(1, n - 1)) * innerW,
		/** @param {number} v */
		y: (v) => base - (v / max) * innerH
	};
}

/**
 * Trazado de una línea que une los puntos: "M" mueve el lápiz al primero, "L" traza hasta los siguientes.
 * @param {number[][]} puntos lista de [x, y]
 */
export function trazarLinea(puntos) {
	return puntos.length ? 'M' + puntos.map((p) => p.join(',')).join(' L') : '';
}

/**
 * Área bajo la curva: la misma línea, cerrada hacia el eje x ("Z" cierra la figura).
 * @param {number[][]} puntos lista de [x, y]
 * @param {number} base coordenada y del eje x
 */
export function trazarArea(puntos, base) {
	if (puntos.length < 2) return '';
	return `${trazarLinea(puntos)} L${puntos.at(-1)[0]},${base} L${puntos[0][0]},${base} Z`;
}
