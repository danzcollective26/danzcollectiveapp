import { customDriverId, customDriverRef } from './identity.ts'

export type StoredHead = { id: string; name: string; createdAt: number; png: string; cloudPath?: string }
export type HeadDraft = { id: string; name: string; png: string; createdAt?: number; cloudPath?: string }

const PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.png$/

export function packHead(input: HeadDraft): StoredHead {
  const id = input.id.toLowerCase()
  if (!customDriverId(customDriverRef(id))) throw new Error('Cabezón no válido')
  if (!input.png.startsWith('data:image/png')) throw new Error('El dibujo tiene que ser un PNG')
  const name = input.name.replace(/[^\p{L}\p{N} .'-]/gu, '').trim().slice(0, 24) || 'CABEZÓN'
  const head: StoredHead = { id, name, createdAt: input.createdAt ?? Date.now(), png: input.png }
  if (input.cloudPath && PATH.test(input.cloudPath) && input.cloudPath.startsWith(`${id}/`)) head.cloudPath = input.cloudPath
  return head
}

export interface HeadVault {
  list(): Promise<StoredHead[]>
  put(head: StoredHead): Promise<void>
  delete(id: string): Promise<void>
}

export function memoryVault(seed: StoredHead[] = []): HeadVault {
  const rows = new Map(seed.map(head => [head.id, head]))
  return {
    async list() { return [...rows.values()].sort((a, b) => a.createdAt - b.createdAt) },
    async put(head) { rows.set(head.id, head) },
    async delete(id) { rows.delete(id) },
  }
}

function idbVault(): HeadVault {
  const open = () => new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('danzporter-heads', 1)
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('heads')) request.result.createObjectStore('heads', { keyPath: 'id' }) }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  const run = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, done: (value: T) => void, fail: (error: unknown) => void) => void) => {
    const db = await open()
    try {
      return await new Promise<T>((resolve, reject) => {
        const tx = db.transaction('heads', mode)
        action(tx.objectStore('heads'), resolve, reject)
        tx.onerror = () => reject(tx.error)
      })
    } finally { db.close() }
  }
  return {
    list: () => run('readonly', (store, done, fail) => {
      const request = store.getAll()
      request.onsuccess = () => done((request.result as StoredHead[]).sort((a, b) => a.createdAt - b.createdAt))
      request.onerror = () => fail(request.error)
    }),
    put: head => run('readwrite', (store, done, fail) => {
      const request = store.put(head)
      request.onsuccess = () => done(undefined)
      request.onerror = () => fail(request.error)
    }),
    delete: id => run('readwrite', (store, done, fail) => {
      const request = store.delete(id)
      request.onsuccess = () => done(undefined)
      request.onerror = () => fail(request.error)
    }),
  }
}

let active: HeadVault | null = null
const portraits = new Map<string, string>()

export function installHeadVault(vault: HeadVault) { active = vault }
function vault(): HeadVault {
  if (!active) active = typeof indexedDB === 'undefined' ? memoryVault() : idbVault()
  return active
}

export function rememberPortrait(id: string, png: string) { portraits.set(id, png) }
export function forgetPortrait(id: string) { portraits.delete(id) }
export function portraitFor(driver: string): string | null {
  const id = customDriverId(driver)
  return id ? portraits.get(id) ?? null : null
}

export async function listHeads(): Promise<StoredHead[]> {
  const heads = await vault().list()
  for (const head of heads) rememberPortrait(head.id, head.png)
  return heads
}
export async function saveHead(draft: HeadDraft): Promise<StoredHead> {
  const head = packHead(draft)
  await vault().put(head)
  rememberPortrait(head.id, head.png)
  return head
}
export async function deleteHead(id: string): Promise<void> {
  await vault().delete(id)
  forgetPortrait(id)
}
