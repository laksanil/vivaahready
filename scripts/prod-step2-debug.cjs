const { chromium } = require('playwright')

async function run(){
  const browser = await chromium.launch({headless:true})
  const context = await browser.newContext({viewport:{width:1280,height:900}})
  const page = await context.newPage()
  const seed = Date.now().toString().slice(-8)
  const firstName = `QA${seed}`
  const lastName = `Prod${seed}`
  const phone10 = `92555${String(seed).slice(-5).padStart(5,'0')}`.slice(0,10)
  const email = `qa.debug.${seed}@example.com`
  const password = `QaProd!${seed}`

  page.on('response', async (res)=>{
    const url = res.url()
    if(url.includes('/api/profile/create-from-modal') || url.includes('/api/profile/') || url.includes('/api/register')){
      let text=''
      try { text = await res.text() } catch {}
      console.log('RESP', res.status(), url)
      if(text) console.log('BODY', text.slice(0,350))
    }
  })

  await page.goto('https://vivaahready.com/', {waitUntil:'networkidle', timeout:60000})
  const cta1 = page.getByRole('button', {name:/find my match/i}).first()
  const cta2 = page.getByText(/find my match/i).first()
  if(await cta1.isVisible().catch(()=>false)) await cta1.click(); else await cta2.click()
  await page.getByText(/Step 1 of 9/i).first().waitFor({timeout:30000})

  await page.locator('input[name="firstName"]').fill(firstName)
  await page.locator('input[name="lastName"]').fill(lastName)
  await page.locator('input[type="tel"]').first().fill(phone10)
  await page.getByRole('button',{name:/Don't have Gmail\? Use another email/i}).click()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[placeholder="Enter password"]').first().fill(password)
  await page.locator('input[placeholder="Re-enter password"]').first().fill(password)
  await page.getByRole('button',{name:/Create Account & Continue/i}).click()
  await page.getByText(/Step 2 of 9/i).first().waitFor({timeout:45000})

  await page.selectOption('select[name="createdBy"]', 'self')
  await page.selectOption('select[name="gender"]', 'male')
  await page.locator('input[name="dateOfBirth"]').fill('01/01/1992')
  await page.selectOption('select[name="height"]', `5'8"`)
  await page.selectOption('select[name="motherTongue"]', 'English')

  const continueBtn = page.getByRole('button',{name:/^Continue$/}).last()
  console.log('continue disabled?', await continueBtn.isDisabled())
  await continueBtn.click()

  await page.waitForTimeout(6000)
  const step2Visible = await page.getByText(/Step 2 of 9/i).first().isVisible().catch(()=>false)
  const step3Visible = await page.getByText(/Step 3 of 9/i).first().isVisible().catch(()=>false)
  console.log('step2Visible', step2Visible, 'step3Visible', step3Visible)
  console.log('url', page.url())

  await browser.close()
}
run().catch(e=>{ console.error(e); process.exit(1) })
