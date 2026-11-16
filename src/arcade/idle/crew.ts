export type CrewMate = {
  name: string
  dx: number
  dy: number
  lines: string[]
}

/** Hablan al llegar y se callan. */
export const CREW: Record<string, CrewMate[]> = {
  music: [
    { name: "Luitzmi", dx: -46, dy: 18, lines: ["Eso no es un bajo. Es el vecino.", "Otra toma, sin el microondas.", "Si suena a lata, es el estilo."] },
    { name: "Chicharro", dx: 54, dy: 28, lines: ["El archivo se llama final-final-3.", "No toques el rojo. Es el rojo.", "Graba ya, que se enfría."] },
  ],
  fashion: [
    { name: "Roncero", dx: -40, dy: 10, lines: ["Esa manga es una decisión.", "El hilo opina que no.", "Corta recto. O no. Sorpréndeme."] },
    { name: "Juanfran", dx: 48, dy: 24, lines: ["El burro ha votado que sí.", "Esto no es una arruga, es volumen.", "Más azul. Siempre más azul."] },
  ],
  video: [
    { name: "Cosa", dx: -42, dy: 8, lines: ["Corta antes de que respire.", "La luz rosa es una advertencia.", "No mires a cámara. Mírala un poco."] },
    { name: "Alpi", dx: 50, dy: 22, lines: ["Ese plano dura demasiado. Bien.", "El trípode está emocional.", "Si parpadea, lo dejamos."] },
  ],
  print: [
    { name: "Mike", dx: -44, dy: 12, lines: ["El mechero no enciende. Ese es el modelo.", "El papel ya viene con la excusa escrita.", "Si no sabes para qué sirve, es edición limitada."] },
    { name: "Jokano", dx: 46, dy: 26, lines: ["Hoy el perro del vecino. Mañana el vecino.", "El prototipo sí se cobra. Y caro.", "El trofeo es al segundo puesto. El primero no vino."] },
  ],
  sello: [
    { name: "León", dx: -40, dy: 8, lines: ["Esto no es un hobby. Es un sello.", "La maqueta se queda. El resto, fuera.", "Firma aquí. Y aquí. Y aquí."] },
    { name: "Tomy", dx: 48, dy: 22, lines: ["El disco sale el viernes. O el otro.", "La caja ya tiene nombre. El nuestro.", "Si no suena, no sale."] },
  ],
  seguridad: [
    { name: "Mono", dx: 0, dy: 8, lines: ["Si entran, se llevan los Loops.", "El chaleco no se mejora. Se compra.", "La puerta la miro yo."] },
    { name: "Mono", dx: 20, dy: 16, lines: ["Ronda hecha.", "El baño sigue cerrado.", "Eso no es un arma. Es una compra."] },
  ],
  cocina: [
    { name: "Sol", dx: -36, dy: 6, lines: ["El microondas es un instrumento.", "Eso no se come, se referencia.", "Hay que calentar el loop."] },
    { name: "Pepe", dx: 40, dy: 16, lines: ["La taza es un premio.", "No es sopa. Es concepto.", "Si pita, ya está masterizado."] },
  ],
  sala: [
    { name: "Vero", dx: -38, dy: 4, lines: ["Silencio, que aquí se piensa en rosa.", "Esa luz no se toca.", "Siéntate. O flota. Tú verás."] },
    { name: "Lux", dx: 42, dy: 18, lines: ["El sofá es un cargo.", "Esto es la sala buena.", "Aplaude bajito."] },
  ],
}

export function hostLine(stationId: string) {
  const mates = CREW[stationId]
  if (!mates?.length) return null
  const person = mates[Math.floor(Math.random() * mates.length)]!
  const text = person.lines[Math.floor(Math.random() * person.lines.length)]!
  return { stationId, name: person.name, text }
}

export function quipFor(stationId: string, name: string) {
  const person = Object.values(CREW).flat().find((mate) => mate.name === name)
  if (!person) return null
  const text = person.lines[Math.floor(Math.random() * person.lines.length)]!
  return { stationId, name: person.name, text }
}
