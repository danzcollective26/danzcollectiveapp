import { expect, type Page } from '@playwright/test'

// The approved layout has direct desktop tabs and a mobile MÁS sheet.
const tabs:Record<string,string>={INICIO:'INICIO',FOTOS:'FOTOS',ARCADANZ:'ARCADANZ',DANZERS:'EVENTOS'}
const more:Record<string,string>={PASAPORTE:'MI PASAPORTE',DANZPOINTS:'DANZPOINTS','DANZ IN':'DANZ IN',DANZFLOR:'DANZFLOR',CUENTA:'MI CUENTA'}
export async function navigateSection(page:Page,section:string){
  const mobile=page.getByRole('navigation',{name:'Navegación principal móvil'})
  if(await mobile.isVisible()){
    if(tabs[section])await mobile.getByRole('button',{name:tabs[section],exact:true}).click()
    else{
      const title=more[section];if(!title)throw new Error('Unknown DANZ section: '+section)
      await mobile.getByRole('button',{name:'Más secciones',exact:true}).click()
      await page.getByRole('region',{name:'Más secciones de DANZ'}).getByRole('button',{name:new RegExp('^'+title)}).click()
    }
  }else await page.getByRole('navigation',{name:'Navegación principal'}).getByRole('button',{name:section,exact:true}).click()
}
export async function expectSectionActive(page:Page,section:string){
  const mobile=page.getByRole('navigation',{name:'Navegación principal móvil'})
  if(await mobile.isVisible()){
    if(tabs[section])await expect(mobile.getByRole('button',{name:tabs[section],exact:true})).toHaveAttribute('aria-current','page')
    else await expect(mobile.getByRole('button',{name:'Más secciones',exact:true})).toHaveClass(/is-active/)
  }else await expect(page.getByRole('navigation',{name:'Navegación principal'}).getByRole('button',{name:section,exact:true})).toHaveAttribute('aria-current','page')
}
