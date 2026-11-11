/** @typedef {{ urr: number, k: number, tPico: number }} ParamsHubbert */

/**
 * @param {number} t
 * @param {ParamsHubbert} params
 */
export function produccion(t, { urr, k, tPico }) {
  const e = Math.exp(-k * (t - tPico));
  return (urr * k * e) / (1 + e) ** 2;
}

/**
 * Curva ilustrativa compartida por OilCurve y FaseHubbert. Solo de ejemplo.
 * Genera 41 puntos, uno cada 2 años desde 1930, con el peak en el punto 22 (año 1974).
 * urr = 400/k hace que el peak valga exactamente 100 (produccion vale urr·k/4 en el peak).
 * @returns {{ label: string, value: number }[]}
 */
export function curvaDemo() {
  const n = 41, peak = 22, k = 0.2, start = 1930;
  const params = { urr: 400 / k, k, tPico: peak };
  return Array.from({ length: n }, (_, i) => ({
    label: String(start + i * 2),
    value: Math.round(produccion(i, params) * 10) / 10 // redondeado a 1 decimal
  }));
}

/**
 * Producción acumulada hasta el tiempo t (curva logística, la integral de `produccion`).
 * Sirve para repartir una reserva en turnos: lo extraído en el turno t es acumulado(t+1) - acumulado(t).
 * @param {number} t
 * @param {ParamsHubbert} params
 */
export function acumulado(t, { urr, k, tPico }) {
  return urr / (1 + Math.exp(-k * (t - tPico)));
}
