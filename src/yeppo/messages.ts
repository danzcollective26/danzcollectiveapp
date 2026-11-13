/** Mensajes controlados por DANZ; sin generación IA ni peticiones externas. */
export type YeppoCategory = 'fotos'|'racha'|'aviso'|'regreso'|'juego'|'pasaporte'|'danzflor'|'fiesta'|'seccion'|'hora'
export type YeppoVariables = Partial<Record<'evento'|'fotos'|'dias'|'producto'|'puntos', string|number>>
export const YEPPOLINES: Record<YeppoCategory, readonly string[]> = {
 fotos:['Hay fotos nuevas de {evento}. ¿Te atreves a mirar?','Han caído {fotos} fotos nuevas. Busca tu mejor cara.','El carrete viene calentito. No digas que no avisé.','Las fotos de {evento} ya están. Hazte el valiente.'],
 racha:['Tu racha pide otra noche. No me la dejes tirada.','Ese pasaporte está pidiendo pista. Tú sabrás.','Tu racha peligra más que el móvil a las seis.','Otro sello y la cosa se pone interesante.'],
 aviso:['Tienes un aviso pendiente. Luego no digas que no te enteraste.','Te han dejado algo importante. Mira antes de salir.','Hay novedades serias. Bueno, serias para DANZ.'],
 regreso:['Llevabas {dias} días desaparecido. ¿Secuestro de resaca?','Has vuelto. El colectivo empezaba a poner carteles.','No te veía desde hace días. ¿Dónde escondías el flow?'],
 juego:['¿Otra vez al Snake? El cable va a pedir vacaciones.','Mucho Groove, pero ¿cuándo sacamos el disco?','Llevas rato practicando. Eso ya cuenta como ensayo.','La máquina te conoce mejor que el portero.','Tu récord no se bate mirándolo, figura.'],
 pasaporte:['Ese pasaporte necesita más tinta de fiesta.','Coleccionas sellos mejor que excusas para salir.','Un sello más y la flor se viene arriba.','A ver ese pasaporte. Que no sea solo postureo.'],
 danzflor:['Mira bien esa prenda. Luego vuelan las tallas.','El armario pide DANZFLOR. Yo solo informo.','Ese look viene con ganas de última canción.','¿Venías a mirar o a darle trabajo a tu armario?','Esa camiseta se está haciendo la interesante.'],
 fiesta:['Ayer hubo fiesta. Hoy toca agua y dignidad.','La noche acabó. La historia sigue en DANZ.','Se acerca {evento}. Ve calentando las zapatillas.','Esa fiesta no se baila sola, colega.'],
 seccion:['Llevas un rato aquí. ¿Buscando algo o haciendo tiempo?','La flor te está vigilando. Con cariño, ¿eh?','Mucho scroll y poco baile. Ponte las pilas.','Que no se te pase la noche entre pantallas.'],
 hora:['Buenos días, campeón de la resaca. Agua primero.','¿Ya es de noche? Pues la flor se despereza.','Hora de cerrar pestañas y abrir horizontes.','Buenas, criatura nocturna. ¿Vienes de bailar?']
}
export function yeppoMessage(category:YeppoCategory,index:number,variables:YeppoVariables={}):string|null{
 const message=YEPPOLINES[category]?.[Math.abs(Math.floor(index))%YEPPOLINES[category].length]
 if(!message)return null
 let missing=false
 const rendered=message.replace(/\{(\w+)\}/g,(_match,key:string)=>{const value=variables[key as keyof YeppoVariables];if(value===undefined||value===null){missing=true;return ''}return String(value).slice(0,60)})
 return missing?null:rendered.slice(0,180)
}
export const YEPPOLINE_COUNT=Object.values(YEPPOLINES).reduce((sum,lines)=>sum+lines.length,0)
