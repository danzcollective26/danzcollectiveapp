import {menuTab,selectReel} from '../e2e/consoleMenus'
import { expect, test } from '@playwright/test'

test('Kart artwork and engine remain reachable after the PWA is ready offline',async({page,context})=>{
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('Unsupported','NotSupportedError'))})
  await page.goto('/test')
  await expect(page.getByText('Snake disponible sin conexión',{exact:true})).toBeVisible({timeout:20000})
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.goto('/test?seccion=arcade&juego=kart')
  await expect(page.locator('.kart-board')).toHaveAttribute('data-ready','true',{timeout:15000})
  await menuTab(page,'AJUSTES');await selectReel(page,'Gráficos','2D COMPATIBLE')
  await page.getByRole('button',{name:'SALIR A PISTA',exact:true}).click()
  await expect(page.locator('.kart-game')).toHaveAttribute('data-phase','playing',{timeout:8000})
})
