export const YEPPO_LINES = {
  open: [
    'Seis de la mañana y ya estáis con las cartas. Qué jaleo.',
    'Barajo yo, que si no os liáis.',
    'Siete cartas. Que no se note el tembleque.',
    'Hoy se gana con estilo o se roba con dignidad.',
  ],
  seis: [
    '¡SEIS! Dilo alto, que la cabina está sorda.',
    'Una carta. Ahora no me falles el grito.',
    'Te queda una. Esto es un SEIS o es un disgusto.',
  ],
  mock: [
    'Se te ha olvidado el SEIS. Dos cartas de propina.',
    'Eso no se grita, se sufre. Roba dos.',
    'Te he visto. Sin SEIS no hay milagro.',
  ],
  perfect: [
    'Lo has dicho y lo has clavado. No te emociones.',
    'SEIS y victoria. Hoy te dejo fardar un poquito.',
    'Grito a tiempo y mano vacía. Así se cierra.',
  ],
  win: [
    'Mano vacía. Los demás que recojan la pista.',
    'Has ganado. Ahora invita, que es de ley.',
    'Te has quedado sin cartas. No lo vendas como suerte.',
  ],
  lose: [
    'Te han cerrado la pista. Otra, y con más cara.',
    'Hoy se lleva la mesa otra persona.',
    'Has perdido. El mazo no es tu colega.',
  ],
  strong: [
    'Esa carta hace ruido. Aparta el vaso.',
    'Uy, eso duele más que el último tema.',
    'Carta fuerte. Que nadie parpadee.',
  ],
  miss: [
    'Dos turnos mirando. ¿Juegas o posas?',
    'Llevas un rato sin encajar ni una.',
    'Si no puedes, al menos no finjas.',
  ],
  shield: [
    'Te cubro el siguiente marrón. Uno solo.',
    'Escudo puesto. No te acostumbres.',
  ],
} as const

export function yeppoLine(bucket: readonly string[], step: number, seat: number) {
  return bucket[(step + seat) % bucket.length]
}
