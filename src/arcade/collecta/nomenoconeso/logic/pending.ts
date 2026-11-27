/** La función existe a propósito y falla alto si alguien la llama antes de tiempo. */
export class NomeNoConEsoPendiente extends Error {
  readonly code = 'pendiente' as const
  readonly fn: string

  constructor(fn: string) {
    super(`NomeNoConEso: ${fn} está pendiente. El esqueleto no juega todavía.`)
    this.name = 'NomeNoConEsoPendiente'
    this.fn = fn
  }
}
