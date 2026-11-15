/** Mensajes controlados por DANZ; sin generación IA ni peticiones externas. */
export type YeppoCategory = 'fotos'|'racha'|'aviso'|'regreso'|'juego'|'pasaporte'|'danzflor'|'fiesta'|'seccion'|'hora'
export type YeppoVariables = Partial<Record<'evento'|'fotos'|'dias'|'producto'|'puntos', string|number>>
export const YEPPOLINES: Record<YeppoCategory, readonly string[]> = {
 fotos:['¡Fotos de {evento}! A ver esas caras.','Hay {fotos} fotos nuevas. No me señales a mí.','Uy. Esa foto tiene historia.','He visto una foto tuya. O eso creo.','Sonríe, que luego vienen las pruebas.'],
 racha:['Un sello más. Tú puedes.','Ese pasaporte pide calle.','¿Repetimos? Tú dirás.','Cuidado, que te enganchas.'],
 aviso:['Eh, tienes un aviso.','Te han dejado algo. Cotilla.','Mira tus avisos, anda.','¡Psst! Hay novedades.'],
 regreso:['¿{dias} días sin venir? ¡Oye!','¡Has vuelto! Disimula un poco.','Pensé que te habías fugado.','Eh, qué alegría verte.'],
 juego:['¿Otra? Vale, yo te cubro.','Esa jugada… ¿era aposta?','¡Uy! Por poco.','Dale, que te estoy mirando.','¿Un reto? Venga, valiente.'],
 pasaporte:['¿Otro sello? Bien ahí.','Mira ese pasaporte, figura.','Eso ya parece una colección.','Tú a por sellos. Yo vigilo.'],
 danzflor:['Uy, esa prenda te mira.','¿Solo vas a mirar? Ya.','A mí me queda todo bien.','Ese look tiene peligro.'],
 fiesta:['¿Agua? Buena idea.','Nos vemos en {evento}.','Esa fiesta promete.','¿Preparado para bailar?'],
 seccion:['¿Qué miras? Ah, soy yo.','No he tocado nada. Creo.','¡Psst! Te he visto.','Sigue, sigue. Yo no estaba.','¿Te ayudo o te molesto?'],
 hora:['¡Ey! ¿Qué tal?','Buenos días. Más o menos.','¿Otra noche larga?','Eh, no te duermas.']
}
export function yeppoMessage(category:YeppoCategory,index:number,variables:YeppoVariables={}):string|null{
 const message=YEPPOLINES[category]?.[Math.abs(Math.floor(index))%YEPPOLINES[category].length]
 if(!message)return null
 let missing=false
 const rendered=message.replace(/\{(\w+)\}/g,(_match,key:string)=>{const value=variables[key as keyof YeppoVariables];if(value===undefined||value===null){missing=true;return ''}return String(value).slice(0,60)})
 return missing?null:rendered.slice(0,180)
}
export const YEPPOLINE_COUNT=Object.values(YEPPOLINES).reduce((sum,lines)=>sum+lines.length,0)
