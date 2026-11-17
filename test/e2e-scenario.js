// Playwright scenario for the Playwright MCP `browser_run_code_unsafe` tool
// (pass this file as `filename`). Uses the fake camera and records every
// live region update. Assumes the site is served at http://localhost:8080.
async (page) => {
  await page.addInitScript({ path: 'test/fake-camera.js' });
  await page.addInitScript(() => {
    window.__log = [];
    document.addEventListener('DOMContentLoaded', () => {
      const el = document.getElementById('announcer');
      new MutationObserver(() => window.__log.push(el.textContent.trim())).observe(el, {
        childList: true, characterData: true, subtree: true,
      });
    });
  });
  await page.goto('http://localhost:8080/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const results = {};
  const take = () => page.evaluate(() => window.__log.splice(0));
  const state = () => page.evaluate(() => window.__faceCentering.state.current);

  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__faceCentering.state.running, null, { timeout: 30000 });
  await page.waitForTimeout(2500);
  results.start = { log: await take(), levels: await state() };

  // Sweep the photo around; u, v = photo center, size = photo height fraction.
  const moves = [
    ['center', 0.5, 0.5, 1],
    ['user-left', 0.8, 0.5, 1],
    ['user-right-far', 0.08, 0.5, 1],
    ['up', 0.5, 0.15, 1],
    ['down-left', 0.65, 0.85, 1],
    ['distant', 0.5, 0.5, 0.45],
    ['close', 0.5, 0.5, 1.8],
    ['gone', null, null],
    ['back', 0.5, 0.5, 1],
  ];
  for (const [name, u, v, size] of moves) {
    await page.evaluate(([u, v, size]) => window.__fakeCam.set(u, v, size), [u, v, size]);
    await page.waitForTimeout(1500);
    results[name] = { log: await take(), levels: await state() };
  }

  // Where am I repeats the current state.
  await page.getByRole('button', { name: 'Where am I' }).click();
  await page.waitForTimeout(100);
  results.where = await take();

  // Switch camera.
  await page.getByRole('combobox', { name: 'Camera' }).selectOption({ label: 'Fake USB Camera' });
  await page.waitForTimeout(500);
  results.switch = { log: await take(), inUse: await page.locator('#camera-label').textContent() };

  // Shortcut stops.
  await page.keyboard.press('Alt+Shift+KeyS');
  await page.waitForTimeout(300);
  results.stop = await take();
  return results;
}
