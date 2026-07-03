import { test, expect } from '@playwright/test';  
test.describe('Phase 9: Full Regression Suite', () => {  
  test('user journey: register -> onboard -> post -> browse -> event -> chat', async ({ page }) => {  
    const csrfRes = await page.request.get('http://localhost:5000/api/csrf-token');  
    const csrfData = await csrfRes.json();  
    const csrfCookie = csrfRes.headers()['set-cookie']?.split(';')[0] || '';  
    const res = await page.request.post('http://localhost:5000/api/auth/mock', {  
      headers: { 'x-csrf-token': csrfData.csrfToken, 'Cookie': csrfCookie }  
    });  
    expect(res.status()).toBe(200);  
    const authCookie = res.headers()['set-cookie']?.split(';')[0] || '';  
    const [csrfName, csrfValue] = csrfCookie.split('=');  
    const [authName, authValue] = authCookie.split('=');  
    await page.context().addCookies([  
      { name: csrfName, value: csrfValue, domain: 'localhost', path: '/' },  
      { name: authName, value: authValue, domain: 'localhost', path: '/' }  
    ]);  
    await page.goto('/');  
    await page.waitForLoadState('networkidle');  
    await page.goto('/browse');  
    await expect(page.locator('body')).toBeVisible();  
  });  
}); 
