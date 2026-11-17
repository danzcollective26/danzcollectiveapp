const CUSTOM = /^custom:([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

export function customDriverId(driver: string): string | null {
  const match = CUSTOM.exec(driver)
  return match ? match[1].toLowerCase() : null
}

export function customDriverRef(id: string): `custom:${string}` {
  return `custom:${id.toLowerCase()}`
}
