const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.setCookie({
    name: 'player_id',
    value: '13',
    domain: 'localhost',
    path: '/'
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const initialCookies = await page.evaluate(() => gameState.cookies);
  console.log('=== Initial Cookies ===');
  console.log('cookies:', initialCookies);
  
  // 클릭해서 쿠키 증가
  await page.click('#cookie-btn');
  await new Promise(r => setTimeout(r, 500));
  
  const afterClick = await page.evaluate(() => gameState.cookies);
  console.log('\n=== After Click ===');
  console.log('cookies:', afterClick);
  console.log('increase:', afterClick - initialCookies);
  
  // 5초 대기 (syncGame interval)
  console.log('\n=== Waiting 5 seconds for sync... ===');
  await new Promise(r => setTimeout(r, 6000));
  
  const afterSync = await page.evaluate(() => gameState.cookies);
  console.log('\n=== After Sync ===');
  console.log('cookies:', afterSync);
  
  // 서버에서 가져온 값 확인
  const serverCookies = await page.evaluate(async () => {
    const res = await fetch('/api/game');
    const data = await res.json();
    return data.cookies;
  });
  console.log('server cookies:', serverCookies);
  
  console.log('\n=== Test Result ===');
  if (afterSync < afterClick) {
    console.log('FAIL: Cookies decreased after sync');
    console.log('Lost:', afterClick - afterSync);
  } else {
    console.log('PASS: Cookies preserved');
  }
  
  await browser.close();
}

test().catch(console.error);