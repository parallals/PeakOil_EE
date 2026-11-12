
# Explorable Explanation para la teoría de Peak Oil

Estaes una explicación interactiva sobre la teoría de Hubbert *"Peak Oil"*, que consiste en el modelo en forma de campana que toma la produccíon del petróleo a lo largo del tiempo.

El usuario aprende de este tópico a través de un modelo de Stepper, y controlando variables en módulos jugables, en el que puede controlar los factores que cambian la forma de esta curva.

Insírada en "Peak Oil: The Comic" de Stuart McMillen.

## Instalación

Se requiere instalar las dependencias de node.js (Versión v20 en adelante).

Una vez hecho esto, correr:


```sh
npm install
```

Y una vez instaladas las dependencias


```sh
npm run dev

```

Si se desea generar y probar la versión final, se puede usar

```sh
npm run build
npm run preview
```


## Recorrido

1. Introducción
2. Modelo de Hubbert (Primer módulo jugable: Ver como funciona la curva)
3. Modelo llevado a múltiples instancias de sacar petróleo.
4. Tasa de recuperación: ¿Que pasaría si los pozos se regeneran?
5. Otros recursos y la tasa real de regeneración del petróleo
6. Conclusión y referencias.

## Estructura

```
src/
├── lib/
│   ├── assets/                        
│   ├── components/
│   │   ├── CampoPetrolero.svelte      
│   │   ├── ControlesCampo.svelte      
│   │   ├── OilCurve.svelte            
│   │   ├── PopUpCuestionario.svelte   
│   │   ├── PopupResultado.svelte      
│   │   └── Stepper.svelte             
│   └── model/
│       ├── grafico.js                 
│       ├── hubbert.js                 
│       └── pasos.js                   
└── routes/
    ├── +layout.svelte                 
    └── +page.svelte                   
```


## Componentes

Esta Explorable Explanation tiene 2 componentes que realizan funciones interactuables, las cuales son OilCurve y CampoPetrolero, ambos hechos en Svelte.

OilCurve es un módulo en el cual se dibuja una curva, simulando la producción del petróleo, presionando un botón. Todas las gráficas sacan su estilo de model/grafico.js

CampoPetrolero es la extensiónd e OilCurve, pero como un minijuego en el que en unas casillas representan un yacimiento.

ControlesCampo es lo que manipula a CampoPetrolero para que muestre cierta cantidad de elementos, y los demás componentes son para la estructura de la página con formato Stepper.

## Agregar un Paso

Todo lo relacionado al contenido de los pasos, ocupa pasos.js. Están ordenados cronológicamente, y es un objeto de múltiples campos, los cuales uno va rellenando.

- title: Título del paso.
- body: Contenido del paso.
- pregunta: Pregunta de selección múltiple, también es un objeto de múltiples elementos.
  - id: Identificador para guardar la respuesta.
  - texto: La pregunta, como tal.
  - opciones: Respuestas a la pregunta, se guarda en un array.
  - correcta: Identificador de la opcion correcta en el array. IMPORTANTE: es de 0 a n, n siendo la cantidad de respuestas - 1.
  - correcto: Texto que se mostrará si se selecciona la opción correcta.
  - equivocado:  Texto default.
- imagen
- alt: Texto ALT de la imagen.
- modulo: Agrega un módulo jugable al paso. Para este, hay 5 tipos de módulo:
  - curvalenta: OilCurve
  - extraer: CampoPetrolero SIN variables a manipular, sólo el juego.
  - simulacrum: Permite jugar con las variables de cantidad de petróleo por pozo + tamaño de la grilla.
  - retorno: CampoPetrolero SIN variables a manipular, pero agregado la tasa de renovación.
  - regeneracionpetrolera: lo mismo de simulacrum, pero ahora se agrega el slider de Tasa de Renovación.
- notacion: Para comentarios sobre las referencias de las que se hablan. 

Los modulos se determinan en +page.svelte, en una secuencia de {:else if}. 

## Herramientas

Skeleton-dev para los elementos de stepper y modal.
Svelte 5
Vite
Tailwind CSS

Las variables son manipuladas en routes/page.svelte