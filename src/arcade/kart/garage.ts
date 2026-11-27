export const CHASSIS = [
  { id:'club', name:'CLUB 01', note:'Equilibrado. La base de la crew.', speed:1, acceleration:1, steering:1, durability:1 },
  { id:'sprint', name:'SPRINT', note:'Monoplaza: aceleración y giro muy rápidos; carrocería frágil.', speed:1.12, acceleration:1.16, steering:1.10, durability:.75 },
  { id:'hauler', name:'TRANSPORT', note:'Blindado: resiste impactos; sacrifica salida, punta y giro.', speed:.88, acceleration:.84, steering:.90, durability:1.55 },
] as const
export const WHEELS = [
  { id:'street', name:'STREET', note:'Agarre y desgaste equilibrados.', speed:1, acceleration:1, grip:1, drift:1, durability:1 },
  { id:'grip', name:'GRIP', note:'Gira con más agarre; cuesta iniciar el derrape.', speed:.97, acceleration:1.03, grip:1.14, drift:.88, durability:.95 },
  { id:'slide', name:'SLIDE', note:'Derrapes más largos; menos agarre y resistencia.', speed:1.01, acceleration:.98, grip:.87, drift:1.18, durability:.82 },
  { id:'endurance', name:'ENDURANCE', note:'Rueda reforzada; dura más a costa de velocidad.', speed:.95, acceleration:.97, grip:1.03, drift:.94, durability:1.3 },
  { id:'light', name:'LIGHT', note:'Sale rápido de curva; más delicada al chocar.', speed:1.04, acceleration:1.1, grip:.96, drift:1.03, durability:.7 },
  { id:'slick', name:'SLICK', note:'Más punta en asfalto; exige cuidar las ruedas.', speed:1.06, acceleration:.95, grip:1.07, drift:.91, durability:.76 },
] as const
export const DRIVERS = [
  { id:'crew',name:'LA CREW',color:'#223b3e',helmet:'#eee8d5' },
  { id:'courier',name:'NIGHT COURIER',color:'#c99945',helmet:'#233138' },
  { id:'mechanic',name:'PIT CREW',color:'#826c57',helmet:'#e4d1b0' },
] as const
export const KART_COLORS=['#edb644','#d9fa69','#82dadd','#f595b7','#e8e3d0','#f27452'] as const
export type ChassisId=typeof CHASSIS[number]['id']
export type WheelId=typeof WHEELS[number]['id']
export type DriverId=typeof DRIVERS[number]['id']
export type KartBuild={chassis:ChassisId;wheels:WheelId;driver:DriverId;color:string}
export const DEFAULT_BUILD:KartBuild={chassis:'club',wheels:'street',driver:'crew',color:KART_COLORS[0]}
export function normalizeBuild(value:unknown,fallback:KartBuild=DEFAULT_BUILD):KartBuild{
  const v=value&&typeof value==='object'?value as Record<string,unknown>:{}
  return {
    chassis:CHASSIS.some(c=>c.id===v.chassis)?v.chassis as ChassisId:fallback.chassis,
    wheels:WHEELS.some(w=>w.id===v.wheels)?v.wheels as WheelId:fallback.wheels,
    driver:DRIVERS.some(d=>d.id===v.driver)?v.driver as DriverId:fallback.driver,
    color:typeof v.color==='string'&&/^#[0-9a-f]{6}$/i.test(v.color)?v.color:fallback.color,
  }
}
export function kartStats(build:KartBuild){
  const chassis=CHASSIS.find(c=>c.id===build.chassis)??CHASSIS[0],wheels=WHEELS.find(w=>w.id===build.wheels)??WHEELS[0]
  return {speed:198*chassis.speed*wheels.speed,acceleration:1.6*chassis.acceleration*wheels.acceleration,
    steering:2.65*chassis.steering,grip:wheels.grip,drift:wheels.drift,durability:chassis.durability,tireDurability:wheels.durability}
}
/** Only mechanical parts affect a time record; paint and driver are cosmetic. */
export const buildKey=(build:KartBuild)=>`${build.chassis}:${build.wheels}`
export const buildName=(build:KartBuild)=>`${CHASSIS.find(c=>c.id===build.chassis)?.name??'CLUB 01'} / ${WHEELS.find(w=>w.id===build.wheels)?.name??'STREET'}`

export const VENUES=[
  {id:'harbor',name:'MUELLE DANZ',note:'Petróleo, hormigón y crew.',ground:'#59655f',water:'#355b64',curb:'#bccf8c',sky:'#173741',sun:'#ffead2',road:'#b9c3c3'},
  {id:'night',name:'ÚLTIMO SERVICIO',note:'Noche de terminal. Luces ámbar.',ground:'#29353e',water:'#142c3c',curb:'#e0aa48',sky:'#0b1725',sun:'#ffd28c',road:'#87959f'},
  {id:'paddock',name:'CREW PADDOCK',note:'Tarde cálida de pruebas.',ground:'#928e75',water:'#597d7d',curb:'#d5ddab',sky:'#455c5c',sun:'#fff0cc',road:'#c7c5b3'},
] as const
export type VenueId=typeof VENUES[number]['id']
