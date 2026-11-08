import { test as base, expect, type Page } from '@playwright/test'

// A generated one-pixel PNG: these tests never need a person's photograph.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')

const test = base.extend<{ pageErrors: void }>({
  pageErrors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await use()
    expect(errors, 'No uncaught browser exceptions').toEqual([])
  }, { auto: true }],
})

async function navigate(page: Page, section: string) {
  await page.getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('button', { name: section, exact: true }).click()
}

async function openGallery(page: Page) {
  await navigate(page, 'Fotos')
  await page.getByRole('button', { name: 'Álbumes de este navegador', exact: true }).click()
  await expect(page.getByText('✓ GUARDADO LOCAL ACTIVADO', { exact: true })).toBeVisible()
}

async function createAlbum(page: Page, name: string) {
  await page.getByPlaceholder('Nombre de la fiesta').fill(name)
  await page.getByRole('button', { name: 'CREAR ÁLBUM ＋', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'CREAR ÁLBUM ＋', exact: true })).toBeEnabled()
}

async function upload(page: Page, album: string, names: string[]) {
  await page.getByLabel(`Añadir fotografías a ${album}`, { exact: true }).setInputFiles(
    names.map((name) => ({ name, mimeType: 'image/png', buffer: png })),
  )
  await expect(page.getByRole('button', { name: `Abrir fotografía ${names.length}: ${names.at(-1)}`, exact: true })).toBeVisible()
}

function albumCard(page: Page, name: string) {
  return page.locator('.gallery-event-grid').getByRole('button').filter({ has: page.getByText(name, { exact: true }) })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await openGallery(page)
})

test('preserves albums and images after reload; viewer, download and visitor preview work', async ({ page }) => {
  await createAlbum(page, 'DANZ QA')
  await upload(page, 'DANZ QA', ['synthetic-one.png', 'synthetic-two.png'])

  await page.reload()
  await openGallery(page)
  await expect(albumCard(page, 'DANZ QA')).toContainText('2 FOTOGRAFÍAS')
  await page.getByRole('button', { name: 'Abrir fotografía 1: synthetic-one.png', exact: true }).click()
  const viewer = page.getByRole('dialog')
  await expect(viewer).toHaveAccessibleName('Fotografía 1 de 2 del álbum DANZ QA')
  await expect.poll(() => viewer.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1)
  await page.keyboard.press('ArrowRight')
  await expect(viewer).toHaveAccessibleName('Fotografía 2 de 2 del álbum DANZ QA')
  await page.keyboard.press('ArrowLeft')
  await expect(viewer).toHaveAccessibleName('Fotografía 1 de 2 del álbum DANZ QA')
  const downloaded = page.waitForEvent('download')
  await viewer.getByRole('link', { name: 'DESCARGAR FOTO ↓', exact: true }).click()
  expect((await downloaded).suggestedFilename()).toBe('synthetic-one.png')
  await page.keyboard.press('Escape')
  await expect(viewer).not.toBeVisible()

  await page.getByRole('button', { name: 'VISTA ASISTENTE', exact: true }).click()
  await expect(page.getByRole('button', { name: 'VISTA ASISTENTE', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByPlaceholder('Nombre de la fiesta')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'ELIMINAR ÁLBUM', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Abrir fotografía 1: synthetic-one.png', exact: true }).click()
  await expect(viewer.getByRole('button', { name: 'QUITAR FOTO ✕', exact: true })).toHaveCount(0)
  await viewer.getByRole('button', { name: 'Cerrar fotografía', exact: true }).click()
  await expect(page.getByText(/DEMO SIN SEGURIDAD REAL/)).toBeVisible()
})

test('keeps albums separate and persists editing and confirmed deletion', async ({ page }) => {
  await createAlbum(page, 'Primera fiesta QA')
  await upload(page, 'Primera fiesta QA', ['first.png'])
  await createAlbum(page, 'Segunda fiesta QA')
  await expect(page.getByRole('button', { name: /^Abrir fotografía/ })).toHaveCount(0)
  await upload(page, 'Segunda fiesta QA', ['second.png'])
  await albumCard(page, 'Primera fiesta QA').click()
  await expect(page.getByRole('button', { name: 'Abrir fotografía 1: first.png', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /second.png/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'EDITAR NOMBRE Y FECHA', exact: true }).click()
  await page.getByLabel('NOMBRE DEL EVENTO', { exact: true }).fill('Primera fiesta editada')
  await page.locator('#gallery-edit-date').fill('2026-11-09')
  await page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Primera fiesta editada', exact: true })).toBeVisible()
  await page.reload()
  await openGallery(page)
  await expect(albumCard(page, 'Primera fiesta editada')).toContainText('09/11/2026')
  await expect(albumCard(page, 'Segunda fiesta QA')).toContainText('1 FOTOGRAFÍA')

  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'ELIMINAR ÁLBUM', exact: true }).click()
  await expect(albumCard(page, 'Primera fiesta editada')).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Quitar first.png de este álbum', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Abrir fotografía/ })).toHaveCount(0)
  await expect(albumCard(page, 'Segunda fiesta QA')).toContainText('1 FOTOGRAFÍA')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'ELIMINAR ÁLBUM', exact: true }).click()
  await expect(albumCard(page, 'Primera fiesta editada')).toHaveCount(0)
  await page.reload()
  await openGallery(page)
  await expect(albumCard(page, 'Primera fiesta editada')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Abrir fotografía 1: second.png', exact: true })).toBeVisible()
})

test('rejects unsupported files without changing an album', async ({ page }) => {
  await createAlbum(page, 'Validación QA')
  await page.getByLabel('Añadir fotografías a Validación QA', { exact: true }).setInputFiles({
    name: 'unsupported.txt', mimeType: 'text/plain', buffer: Buffer.from('synthetic test input'),
  })
  await expect(page.getByText(/^No se han añadido fotos\./)).toBeVisible()
  await expect(page.getByRole('button', { name: /^Abrir fotografía/ })).toHaveCount(0)
  await expect(albumCard(page, 'Validación QA')).toContainText('0 FOTOGRAFÍAS')
})

test('main sections and photo viewer fit the current viewport', async ({ page }) => {
  for (const section of ['Inicio', 'Fotos', 'Arcade', 'DANZERS', 'DANZ IN', 'DANZFLOR', 'Cuenta']) {
    await navigate(page, section)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  await openGallery(page)
  await createAlbum(page, 'Responsive QA')
  await upload(page, 'Responsive QA', ['viewport.png'])
  await page.getByRole('button', { name: 'Abrir fotografía 1: viewport.png', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Cerrar fotografía', exact: true }).click()
})
