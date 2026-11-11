import retratoHubbert from '#lib/assets/Marion_King_Hubbert_Trim.jpg';
import hubbertInicio from '#lib/assets/hubbert-inicio.svg';
import hubbertPeak from '#lib/assets/hubbert-peak.svg';
import hubbertFinal from '#lib/assets/hubbert-final.svg';
import Wowo from '#lib/assets/tipos-de-energia-no-renobable.jpeg';
import placeholder from '#lib/assets/PLACEHOLDER.jpg';
import madera from '#lib/assets/PLACEHOLDER2.jpg';
	export const pasos = [
	{
		title: 'Introducción',
		imagen: retratoHubbert,
		alt: 'Imagen de Marion King Hubbert',
		body:' En Marzo de 1956, en una conferencia de la American Petroleum Institute en Texas, Marion King Hubbert se presenta frente a múltiples representantes de diferentes empresas petroleras. \n\n Estados Unidos, en ese momento, era el mayor productor de petróleo del mundo y su economía dependía crucialmente de este recurso.',
		notacion: 'La estructura de esta Explorable Explanation está inspirada fuertemente en el comic de Stuart McMillen, “Peak Oil: The Comic” (https://www.stuartmcmillen.com/comic/peak-oil/).'
	},

	{ title: 'Introducción',
		body: 'Mientras más crecía el país, más petróleo se necesitaba, y estando en la cima del mundo nadie se imaginaba que esto la producción de petróleo podría cambiar. \n\n \n Lo que se esperaba en la industria en aquel momento era, en otras palabras, que la producción del petróleo sería una función lineal, siempre ascendiente, por bastante tiempo. \n\n Hubbert, sin embargo, tenía una visión diferente.',
		pregunta: {
			id: 'peak',
			texto: '¿Como crees tú que se verá realmente la curva de extracción de petróleo?',
			opciones: ['Siempre subirá', 'Se mantendrá tras cierto punto', 'Decaerá tras cierto punto'],
			correcta: 2,
			correcto: 'Correcto!',
			incorrecto: 'En realidad, llegado a un punto, la producción decae.'
		}
	},

	{
		title: 'El Modelo de Hubbert',
		body: ' Él había estudiado la producción de petróleo en Estados Unidos y había notado que la producción de petróleo seguía un patrón específico: subía rápidamente, alcanzaba un pico y luego caía lentamente. \n\n Este patrón se conoce como la curva de Hubbert, y es una representación gráfica de la producción de petróleo a lo largo del tiempo. La curva de Hubbert muestra que la producción de petróleo no puede crecer indefinidamente, sino que eventualmente alcanzará un pico y luego comenzará a declinar, como se ve aquí.',
		modulo: 'curvalenta',
	},
	{
		title: 'Modelo de Hubbert',
		imagen: hubbertInicio,
		alt: 'Curva de Hubbert con la subida resaltada',
		body: 'En el inicio, cuando el petróleo es más fácil de extraer en la superficie, este se produce en mayor cantidad, junto con el empleo de nuevas tecnologías para hacer la producción más eficiente. En el modelo, esta es la parte de la función en que "crece",'
	},
	{
		title: 'Modelo de Hubbert',
		imagen: hubbertPeak,
		alt: 'Curva de Hubbert con el peak resaltado',
		body: 'Y luego, inevitablemente se llega al "Peak", el punto máximo de producción, que es dónde recibe su nombre la teoría. En este punto, la producción de petróleo alcanza su máximo y luego comienza a declinar, y nunca más vuelve a esta cantidad de barriles por día. En el modelo, esta es la parte de la función en que entra en "decay", o el punto más alto del gráfico.'
	},
	{
		title: 'Modelo de Hubbert',
		imagen: hubbertFinal,
		alt: 'Curva de Hubbert con la bajada resaltada',
		body: 'Una vez que se alcanza el "Peak", la producción de petróleo comienza a declinar, y eventualmente se vuelve cada vez más difícil y costoso extraer petróleo, hasta que finalmente queda muy poco petróleo disponible. En el modelo, esta es la parte de la función en que "decay" se vuelve más pronunciada, y eventualmente llega a cero. \n\n Hubbert predijo que la producción de petróleo en Estados Unidos alcanzaría su pico en la década de 1970, y que luego comenzaría a declinar. Desde entonces, la producción de Estados Unidos ha seguido el patrón predicho por Hubbert, y en 1974 alcanzó su primer "peak". Una de las maneras de retrasar o extender la llegada del "Peak" es a través de la búsqueda de nuevas fuentes de petróleo, como la exploración de nuevos yacimientos.',
		pregunta: {
			id: 'pm2',
			texto: '¿Se logrará evitar el peak con múltiples fuentes de petróleo?',
			opciones: ['La curva se mantiene igual', 'Cambia y la curva se desplaza', 'Cambia y la curva se achica'],
			correcta: 0,
			correcto: 'Correcto! La producción total también aumenta, pero se mantiene la forma de crecimiento, de "Peak", y de decay. ',
			incorrecto: 'Esto es incorrecto, pues la curva mantiene la formación de crecimiento, peak y decay.'
		}
	},
	{ title: 'El modelo llevado a la vida real',
		body: 'Como se ha visto, esto no se aplica sólo a nivel país, si no que se aplica para todos los yacimientos a nivel mundial. Eventualmente, todos los yacimientos seguirán el mismo patrón predicho por Hubbert.',
	  modulo: 'extraer'
	},
	
	{
		title: 'Experimenta con el campo',
		// modulo: la página muestra el campo con controles (ControlesCampo + CampoPetrolero)
		modulo: 'simulacrum',
		body: 'Ahora cambia el tamaño del campo y cuánto petróleo tiene cada pozo, y deja que el juego avance solo. ¿Cambia la forma de la curva?'
	},
	
	{ title: 'Modelo de Hubbert a otros elementos',
		body: 'El modelo de Hubbert no sólo se aplica a la producción de petróleo, si no que también se aplica a otros recursos finitos, como el gas natural, el carbón y los minerales. Esto se debe a que todos estos recursos siguen un patrón similar de producción, con un aumento inicial, un pico y un decay eventual. \n\n La diferencia vital entre estos recursos es la tasa de recuperación.', imagen: Wowo, alt: 'Tipos de energía no renovable' 
	},
	
	{
		title: 'La tasa de recuperación',
		// modulo: el mismo juego, con el slider de tasa de recuperación
		modulo: 'retorno',
		body: 'Imagina que un pozo agotado pudiera volver a llenarse. La tasa de recuperación indica qué parte de su reserva recupera en cada turno. Muévela, deja que el juego avance solo y observa qué pasa con la curva.'
	},
	{	title: 'Se puede aplicar a otros elementos?',
		body:'Como pudiste ver, si la tasa de recuperación es mayor que 0 la curva puede volver a "levantarse". Algunos recursos enérgicos si gozan de una tasa de recuperación lo suficientemente alta; La madera, que se demora unos 10 a 60 años en que crezca denuevo el árbol, es una de estas. Si cada turno fuera un año, su tasa estaría entre el 10% y 1,666%, como se ve en la imagen. La energía solar natural nunca se "gasta" ya que es un flujo de energía que nos llega todos los días, obteniendo una tasa de recuperación "infinita".  \n\n\n ',
		imagen: madera,
		alt: 'Imagen de la tasa de recuperación de la madera',
		modulo: 'maderatr',
		pregunta: {
			id: 'pm3',
			texto: '¿Cuál crees que será la tasa de renovación del petróleo?',
			opciones: ['0,0001%', '0,0000001%', '0,0000000001%'],
			correcta: 2,
			correcto: 'Correcto! El petróleo se regenera entre 10 y 100 millones de años. Es por esto su curva siempre inicia y termina en cero, pues es muy improbable que en la historia de la humanidad se vuelva a generar.',
			incorrecto: 'Incorrecto, es mucho menor que eso, el petróleo se regenera entre 10 y 100 millones de años. Y es por esto su curva siempre inicia y termina en cero, pues es muy improbable que en la historia de la humanidad se vuelva a generar.'
		}},
	{title: 'La tasa de regeneración del petróleo, en la vida real.',
		body: 'Si se pudiera ver en un gráfico, se vería como una pequeñísimo línea entre millones y millones de años',
		modulo: 'regeneracionpetrolera',
		imagen: placeholder,
		alt: 'Gráfico de la tasa de regeneración del petróleo',
		notacion: 'Estimación dada según la Fundación de la Energía de la Comunidad de Madrid (FENERCOM),  "Recorrido de la Energía: El Petróleo", pg. 4'},
	{ title: 'El desnivel de la curva', body: 'El modelo de Hubbert es una representación matemática de la producción de un recurso finito a lo largo del tiempo, pero también es un tema polarizante dentro de los investigadores de energía. Pero lo más importante es que nos ayuda a comprender los límites de los recursos finitos, y la urgencia de gestionarlos de manera sostenible.' },
	{ title: 'Conclusión y referencias', body: 'Referencias: \n\n McMillen, S. (s.f.). Peak Oil: The Comic. https://www.stuartmcmillen.com/comic/peak-oil/ \n\n Fundación de la Energía de la Comunidad de Madrid (FENERCOM). (s.f.). Recorrido de la Energía: El Petróleo (p. 4).  \n\n Hubbert, M. K. (1956). Nuclear Energy and the Fossil Fuels https://aspofrance.org/wp-content/uploads/2024/04/king_hubbert_1956_ocr.pdf' }
];

// Popup que aparece al presionar "Finalizar" en el último paso
export const final = {
	titulo: 'Fin del recorrido',
	texto:
		'Ahora sabes más sobre Peak Oil. Si quieres puedes volver a ver cualquiera de los pasos, o proseguir con la siguiente parte de la evaluación.'
};
