/** Local, privacy-preserving guide. This is not a generative AI model. */
export type YeppoDestination='inicio'|'pasaporte'|'fotos'|'arcade'|'danzers'|'danzflor'|'danzpoints'|'cuenta'
export type GuideReply={text:string;destination?:YeppoDestination;label?:string}
const fold=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9ñ ]/g,' ').replace(/\s+/g,' ').trim()
const has=(s:string,words:string[])=>words.some(w=>s.includes(w))
export const YEPPO_SUGGESTIONS=['¿Dónde están mis fotos?','Quiero jugar','¿Cómo consigo sellos?','¿Cómo funciona DANZ?']
export function yeppoGuide(input:string):GuideReply {
 const text=fold(input.slice(0,300))
 if(!text)return{text:'¡Eh, criatura! Dime qué necesitas. Prometo no morder. Bueno, casi.'}
 if(has(text,['fotos','foto','galeria','album','fotografia','descargar']))return{text:'Las fotos viven en FOTOS. Algunas galerías privadas se desbloquean con tu sello del evento. Yo te llevo, que para algo tengo pétalos.',destination:'fotos',label:'IR A FOTOS'}
 if(has(text,['sello','pasaporte','asistencia','qr','entrada','pase']))return{text:'El PASAPORTE guarda tus sellos de asistencia. Cada evento puede usar su QR o código propio; un sello puede abrirte su galería privada.',destination:'pasaporte',label:'VER PASAPORTE'}
 if(has(text,['jugar','juego','snake','groove','arcade','record','vinilo']))return{text:'¿Quieres darle caña? En ARCADANZ tienes Snake y Groove Ninja. Si pierdes, no digas que te distraje.',destination:'arcade',label:'IR A ARCADANZ'}
 if(has(text,['ropa','tienda','shop','camiseta','merch','danzflor','comprar']))return{text:'DANZFLOR es nuestro rincón de ropa y colecciones. Mirar no cuesta, enamorarse de una camiseta ya veremos.',destination:'danzflor',label:'VER DANZFLOR'}
 if(has(text,['punto','recompensa','premio','descuento','canjear']))return{text:'Los puntos y recompensas se consultan en DANZ POINTS. Los premios disponibles dependen de lo que publique el colectivo.',destination:'danzpoints',label:'VER PUNTOS'}
 if(has(text,['perfil','cuenta','google','registr','correo','instagram','login','acceso']))return{text:'Tu perfil y el acceso con Google o correo están en CUENTA. Si un navegador integrado falla, abre DANZ directamente en Safari o Chrome.',destination:'cuenta',label:'IR A CUENTA'}
 if(has(text,['evento','fiesta','dj','calendario','agenda','cuando','donde','direccion']))return{text:'Las novedades de fiestas y actuaciones aparecen en DANZ. No te inventaré horarios: consulta siempre la información publicada por el colectivo.',destination:'inicio',label:'VER INICIO'}
 if(has(text,['quien eres','como te llamas','eres ia','inteligencia artificial','chatbot','robot']))return{text:'Soy Yeppo, la flor bocazas de DANZ. Ahora mismo soy un guía conversacional sin IA generativa: respondo sobre la app y te llevo a las secciones. Lo de tener un cerebro de IA real está por llegar.'}
 if(has(text,['hola','buenas','hey','epa','que tal','saludos']))return{text:'¡Epa! 🌸 Soy Yeppo. Pregúntame por fotos, sellos, juegos o ropa. Lo importante: no me pidas que pinche, que soy una flor.'}
 if(has(text,['ayuda','como funciona','que puedo hacer','danz','menu']))return{text:'FOTOS para tus recuerdos, PASAPORTE para sellos, ARCADANZ para juegos, DANZFLOR para ropa y CUENTA para tu perfil. ¿Qué te enseño?'}
 return{text:'Esa me ha pillado sin pétalos de respuesta. Puedo ayudarte con fotos, sellos, juegos, ropa, puntos y tu cuenta. Para datos de eventos, fíate solo de la información publicada.'}
}
