import { expect, test } from '@playwright/test'
import { installMockSession, supabaseHost, USER_B } from './helpers/supabase'

test('shared member card exposes only opted-in verified alias and Instagram', async ({ page }) => {
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_public_instagram_card`, async route => {
    expect(route.request().postDataJSON()).toEqual({ p_user: USER_B })
    await route.fulfill({ json: { userId: USER_B, name: 'Socia DANZ', handle: 'danz_socia' } })
  })
  await page.goto(`/?seccion=cuenta&miembro=${USER_B}`)
  const card = page.getByRole('region', { name: 'Tarjeta pública de miembro' })
  await expect(card).toBeVisible()
  await expect(card.getByRole('heading', { name: 'Socia DANZ' })).toBeVisible()
  await expect(card.getByRole('link', { name: 'Abrir el Instagram verificado @danz_socia' })).toHaveAttribute('href', 'https://www.instagram.com/danz_socia/')
  await expect(page.getByText('first@example.invalid')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'ADMINISTRAR MI PERFIL' })).toHaveCount(0)
})

test('member without consent has no visible profile card fields', async ({ page }) => {
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_public_instagram_card`, route => route.fulfill({ json: null }))
  await page.goto(`/?seccion=cuenta&miembro=${USER_B}`)
  await expect(page.getByText('Este miembro no tiene una tarjeta pública de Instagram disponible.')).toBeVisible()
  await expect(page.getByRole('link', { name: /Abrir el Instagram verificado/ })).toHaveCount(0)
})
