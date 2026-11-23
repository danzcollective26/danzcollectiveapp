import { expect, type Page } from '@playwright/test'

/** The desktop nav and the approved mobile MÁS sheet expose the same sections. */
const MOBILE_TABS:Record<string,string>={
  INICIO:'INICIO', FOTOS:'FOTOS', ARCADANZ:'ARCADANZ', DANZERS:'EVENTOS',
}
const MORE_LABELS:Record<string,string>={PASAPORTE:'MI PASAPORTE',CUENTA:'MI CUENTA'}

export async function visitDanzSection(page:Page,section:string){
  const more=page.getByRole('button',{name:'Más secciones',exact:true})
  if(await more.isVisible()){
    const direct=MOBILE_TABS[section]
    if(direct){
      await page.getByRole('navigation',{name:'Navegación principal móvil'}).getByRole('button',{name:direct,exact:true}).click()
    }else{
      await more.click()
      const name=MORE_LABELS[section]??section
      await page.getByRole('region',{name:'Más secciones de DANZ'}).getByRole('button',{name:new RegExp('^'+name)}).click()
    }
  }else{
    await page.getByRole('navigation',{name:'Navegación principal'}).getByRole('button',{name:section,exact:true}).click()
  }
}

export async function expectDanzSectionSelected(page:Page,section:string){
  const more=page.getByRole('button',{name:'Más secciones',exact:true})
  if(await more.isVisible()){
    const direct=MOBILE_TABS[section]
    if(direct)await expect(page.getByRole('navigation',{name:'Navegación principal móvil'}).getByRole('button',{name:direct,exact:true})).toHaveAttribute('aria-current','page')
    else await expect(more).toHaveClass(/is-active/)
  }else{
    await expect(page.getByRole('navigation',{name:'Navegación principal'}).getByRole('button',{name:section,exact:true})).toHaveAttribute('aria-current','page')
  }
}
