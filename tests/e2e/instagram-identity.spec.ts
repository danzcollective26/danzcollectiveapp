import{expect,test}from'@playwright/test'
import{installMockSession,supabaseHost,switchMockSession,USER_B}from'./helpers/supabase'
const identity=`${supabaseHost}/rest/v1/rpc/danz_identity_status`
const none={verified:false,emailVerified:true,status:'none',handle:null,profileHandle:null,code:null,expiresAt:null}
const pending={...none,status:'pending',handle:'miembro_qa',code:'DANZ-ABCDEF1234',expiresAt:'2026-12-01T00:00:00Z'}
test('competition requires Instagram ownership and the account prepares a private challenge rather than self-verifying',async({page})=>{
 await installMockSession(page);let state:any=none;await page.route(identity,r=>r.fulfill({json:state}));await page.route(`${supabaseHost}/rest/v1/rpc/danz_snake_board`,r=>r.fulfill({json:{rows:[],mine:null,awards:[],closesAt:'2026-11-15T23:00:00Z'}}))
 await page.route(`${supabaseHost}/rest/v1/rpc/danz_instagram_request`,async r=>{expect(r.request().postDataJSON()).toEqual({p_handle:'@miembro_qa'});state=pending;await r.fulfill({json:pending})})
 await page.goto('/?seccion=arcade');await expect(page.getByRole('button',{name:'COMPETIR EN CLÁSICO ↗',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'VINCULAR INSTAGRAM EN MI CUENTA ↗',exact:true}).click();const link=page.getByRole('region',{name:'Vincular Instagram para puntos'})
 await link.getByLabel('INSTAGRAM PARA VERIFICAR',{exact:true}).fill('@miembro_qa');await link.getByRole('button',{name:'PREPARAR MI CÓDIGO',exact:true}).click();await expect(link.getByLabel('TU CÓDIGO DE VINCULACIÓN',{exact:true})).toHaveValue('DANZ-ABCDEF1234');await expect(link).toContainText('La revisión es manual.');await expect(link.getByText(/^INSTAGRAM VERIFICADO · @/)).toHaveCount(0)
 await expect(link.getByRole('link',{name:'ABRIR INSTAGRAM DE DANZ ↗',exact:true})).toHaveAttribute('href','https://www.instagram.com/danz.collective/');await expect(link).toContainText('@danz.collective')
 state=none;await switchMockSession(page,USER_B);await expect(page.getByText('Sesión iniciada como',{exact:false})).toContainText('second@example.invalid');await expect(page.getByLabel('TU CÓDIGO DE VINCULACIÓN',{exact:true})).toHaveCount(0)
})
test('DANZPOINTS remain reserved until the service confirms the link, then refresh shows available points',async({page})=>{
 await installMockSession(page);await page.route(identity,r=>r.fulfill({json:none}));let verified=false
 await page.route(`${supabaseHost}/rest/v1/rpc/danz_points_summary`,r=>r.fulfill({json:{identityVerified:verified,emailVerified:true,code:'DNZ-ABCDEF123456',available:verified?1000:0,pending:verified?0:1000,events:[],arcade:0}}))
 await page.goto('/?seccion=danzpoints');await expect(page.locator('.points-total')).toHaveText(/^0\s+POINTS$/);await expect(page.getByText('Lo acumulado queda reservado.',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'VINCULAR INSTAGRAM EN MI CUENTA ↗',exact:true})).toBeVisible();verified=true;await page.getByRole('button',{name:'ACTUALIZAR PUNTOS ↻',exact:true}).click();await expect(page.locator('.points-total')).toContainText('1000');await expect(page.getByRole('button',{name:'VINCULAR INSTAGRAM EN MI CUENTA ↗',exact:true})).toHaveCount(0)
})
