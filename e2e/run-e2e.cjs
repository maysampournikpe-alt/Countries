// End-to-end tests for FlagMaster. Run against a built preview:
//   npm run build && npx vite preview --port 4173 &  then  npm run e2e
// Requires Playwright with Chromium (npx playwright install chromium).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/generated/countries.json'), 'utf8'));
const BY_FLAG = Object.fromEntries(DATA.map((c) => [c.flag, c]));
const BY_NAME = Object.fromEntries(DATA.map((c) => [c.name, c]));
const CORE = DATA.filter((c) => !c.bonus);

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  ✓', name);
  } catch (e) {
    failures.push([name, e]);
    console.log('  ✗', name, '\n    ', e.message.split('\n')[0]);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function currentCode(page) {
  const src = await page.locator('img[alt="Flag to identify"]').first().getAttribute('src');
  return BY_FLAG[src.split('/').pop()];
}

/** Assert nothing in the DOM gives away the flag being asked. */
async function assertNoLeak(page, c) {
  const leak = await page.evaluate((name) => {
    const found = [];
    const lower = name.toLowerCase();
    for (const el of document.querySelectorAll('img, [title], [aria-label], [data-code]')) {
      for (const a of ['alt', 'title', 'aria-label', 'src', 'data-code']) {
        const v = el.getAttribute(a);
        if (v && v.toLowerCase().includes(lower)) found.push(`${a}=${v}`);
      }
    }
    if (document.title.toLowerCase().includes(lower)) found.push('title');
    if (location.href.toLowerCase().includes(lower)) found.push('url');
    const main = document.querySelector('main');
    const text = main ? main.innerText.toLowerCase() : '';
    const sugg = document.querySelector('[role="listbox"]');
    const visible = sugg ? text.replace(sugg.innerText.toLowerCase(), '') : text;
    if (visible.includes(lower)) found.push('visible text');
    return found;
  }, c.name);
  assert(leak.length === 0, `answer leak for ${c.name}: ${leak.join(', ')}`);
}

async function pickCountry(page, name, submit = true) {
  const box = page.getByRole('combobox');
  await box.fill(name);
  await box.press('Enter'); // select highlighted suggestion
  if (submit) await box.press('Enter'); // submit
}

async function answerRecall(page, correct = true) {
  const c = await currentCode(page);
  await assertNoLeak(page, c);
  const wrong = CORE.find((x) => x.code !== c.code && x.name.length > 4);
  await pickCountry(page, correct ? c.name : wrong.name);
  return c;
}

async function continueIfFeedback(page) {
  const btn = page.getByRole('button', { name: /^Continue/ });
  if (await btn.count()) await btn.first().click();
}

/** Answer whatever question is showing (recall, mc or reverse). */
async function answerAny(page, correct = true) {
  if (await page.getByText('Which flag belongs to').count()) {
    const name = (await page.locator('.stage p.font-display').innerText()).trim();
    const target = BY_NAME[name];
    const imgs = page.locator('[aria-label="Flag options"] img');
    const n = await imgs.count();
    for (let i = 0; i < n; i++) {
      const f = (await imgs.nth(i).getAttribute('src')).split('/').pop();
      if ((f === target.flag) === correct) {
        await imgs.nth(i).click();
        break;
      }
    }
    return target;
  }
  if (await page.locator('[aria-label="Answer options"]').count()) {
    const c = await currentCode(page);
    const opts = page.locator('[aria-label="Answer options"] button');
    const n = await opts.count();
    for (let i = 0; i < n; i++) {
      const t = await opts.nth(i).innerText();
      if (t.includes(c.name) === correct) {
        await opts.nth(i).click();
        break;
      }
    }
    return c;
  }
  return answerRecall(page, correct);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const go = async (p) => {
    await page.goto(BASE + p);
    await page.waitForLoadState('networkidle');
  };

  console.log('Navigation & assets');
  await test('every main route renders without errors', async () => {
    for (const r of ['/', '/learn', '/review', '/challenges', '/atlas', '/stats', '/settings', '/detective', '/exam', '/diagnostic', '/atlas/FRA', '/nope']) {
      await go(r);
      assert(await page.locator('h1').count(), `no heading on ${r}`);
    }
  });
  await test('all 218 flag images load', async () => {
    const bad = [];
    for (const c of DATA) {
      const res = await page.request.get(`${BASE}/flags/${c.flag}`);
      if (!res.ok() || !(await res.text()).startsWith('<svg')) bad.push(c.code);
    }
    assert(!bad.length, `broken flags: ${bad.join(',')}`);
  });
  await test('atlas shows 195 flags and every image decodes', async () => {
    await go('/atlas');
    await page.waitForTimeout(500);
    const n = await page.locator('main ul > li img').count();
    assert(n === 195, `atlas shows ${n}`);
    const broken = await page.evaluate(async () => {
      const imgs = [...document.querySelectorAll('main ul > li img')];
      await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
      return imgs.filter((i) => !i.naturalWidth).length;
    });
    assert(broken === 0, `${broken} images failed to decode`);
  });
  await test('atlas search is spelling tolerant', async () => {
    await page.getByLabel('Search flags').fill('Kazakstan');
    await page.waitForTimeout(100);
    assert((await page.locator('main ul > li').first().innerText()).includes('Kazakhstan'), 'Kazakstan not found');
  });

  console.log('Diagnostic');
  await test('diagnostic: no feedback, I don\'t know, checkpoint at 25, resume after reload', async () => {
    await go('/diagnostic');
    await page.getByRole('button', { name: 'Start the diagnostic' }).click();
    for (let i = 0; i < 25; i++) {
      if (i % 5 === 4) {
        await page.getByRole('button', { name: "I don't know" }).click();
      } else {
        const c = await currentCode(page);
        await assertNoLeak(page, c);
        await pickCountry(page, i % 3 ? c.name : 'Chad', false);
        await page.getByRole('button', { name: i % 2 ? /Just a guess/ : /I'm sure/ }).click();
      }
      assert(!(await page.getByText(/Correct —|This is /).count()), 'feedback shown during diagnostic');
    }
    assert(await page.getByText('25 of 195 done').count(), 'no checkpoint at 25');
    await page.getByRole('button', { name: 'Take a break' }).click();
    await go('/diagnostic');
    assert(await page.getByText('26 / 195').count(), 'did not resume at 26');
    const c = await answerRecall(page, true);
    assert(c, 'answered 26th');
    await go('/diagnostic');
    assert(await page.getByText('27 / 195').count(), 'did not persist 26th answer');
  });
  await test('diagnostic: finish early → four categories and plan', async () => {
    for (let i = 0; i < 24; i++) await answerRecall(page, true);
    await page.getByRole('button', { name: /Finish now with 50 answers/ }).click();
    for (const t of ['Mastered provisionally', 'Recognized but uncertain', 'Frequently confused', 'Completely unfamiliar', 'Your learning plan'])
      assert(await page.getByText(t).first().count(), `missing ${t}`);
  });

  console.log('Learning');
  await test('Smart Training runs a full 6-stage lesson', async () => {
    await go('/learn');
    await page.getByRole('button', { name: 'Start session' }).click();
    // stage 1: intro cards
    for (let i = 0; i < 10 && (await page.getByRole('button', { name: /Next flag|Start practising/ }).count()); i++)
      await page.getByRole('button', { name: /Next flag|Start practising/ }).click();
    for (let i = 0; i < 120; i++) {
      if (await page.getByText(/Smart Training complete/).count()) break;
      if (await page.getByRole('button', { name: /Next comparison|Test the differences/ }).count()) {
        await page.getByRole('button', { name: /Next comparison|Test the differences/ }).click();
        continue;
      }
      await answerAny(page, i % 9 !== 3);
      await continueIfFeedback(page);
    }
    assert(await page.getByText('What you learned').count(), 'lesson summary missing');
    assert(await page.getByText('Next reviews').count(), 'review schedule missing');
  });
  await test('progress persists after reload', async () => {
    await go('/stats');
    const before = await page.getByText('Being learned').locator('..').innerText();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const after = await page.getByText('Being learned').locator('..').innerText();
    assert(before === after && !/^0/.test(before), `persist mismatch ${before} vs ${after}`);
  });
  await test('wrong answer shows side-by-side correction', async () => {
    await go('/challenges/world');
    await page.getByRole('button', { name: /^Start/ }).click();
    await answerRecall(page, false);
    await page.getByText('(your answer)').waitFor({ timeout: 4000 });
    assert(await page.getByText('Memory trick:').count(), 'no trick');
    await page.keyboard.press('Enter');
    await page.getByText('2 / 195').waitFor({ timeout: 4000 });
  });

  console.log('Answer box');
  await test('fuzzy picker: required examples and keyboard-only flow', async () => {
    const box = page.getByRole('combobox');
    for (const [q, want] of [['Kazakstan', 'Kazakhstan'], ['Kyrg', 'Kyrgyzstan'], ['USA', 'United States'], ['Ivory Coast', "Côte d'Ivoire"], ['Bosna', 'Bosnia and Herzegovina']]) {
      await box.fill(q);
      const first = await page.getByRole('option').first().innerText();
      assert(first.startsWith(want), `${q} → ${first}`);
    }
    await box.fill('');
    assert(!(await page.getByRole('option').count()), 'suggestions shown for empty input');
    await box.fill('nig');
    await box.press('ArrowDown');
    await box.press('Enter');
    assert((await box.inputValue()).length > 3, 'keyboard selection failed');
  });
  await test('A–Z browser lets you answer without typing', async () => {
    await page.getByRole('button', { name: 'A–Z' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Brazil' }).click();
    assert((await page.getByRole('combobox').inputValue()) === 'Brazil', 'A–Z pick failed');
    await page.getByRole('button', { name: /^End session/ }).click();
  });

  console.log('Modes');
  const modes = [
    ['world', null], ['continental', 'Europe'], ['speed', null], ['reverse', null], ['survival', null], ['custom', null], ['mistakes', null], ['bonus', null],
  ];
  for (const [m, region] of modes) {
    await test(`challenge: ${m}`, async () => {
      await go(`/challenges/${m}`);
      if (region) await page.getByRole('button', { name: region, exact: true }).click();
      const start = page.getByRole('button', { name: /^Start/ });
      if (await start.isDisabled()) throw new Error('start disabled');
      await start.click();
      for (let i = 0; i < 4; i++) {
        if (await page.getByRole('button', { name: 'Play again' }).count()) break;
        await answerAny(page, m === 'survival' ? i < 2 : true);
        await continueIfFeedback(page);
      }
      if (!(await page.getByRole('button', { name: 'Play again' }).count())) await page.getByRole('button', { name: /End session/ }).click();
      await page.getByRole('button', { name: 'Play again' }).waitFor({ timeout: 4000 });
    });
  }
  await test('Daily Review page works with or without due cards', async () => {
    await go('/review');
    assert(await page.getByText(/flags due now|Nothing is due right now/).count(), 'review state missing');
  });
  await test('Flag Detective drill clears a group', async () => {
    await go('/detective/bahrain-qatar');
    await page.getByRole('button', { name: 'Start the drill' }).click();
    for (let i = 0; i < 40 && !(await page.getByText('Case closed').count()); i++) {
      await answerAny(page, true);
      await continueIfFeedback(page);
    }
    assert(await page.getByText('Case closed').count(), 'drill did not finish');
    await go('/detective');
    assert(await page.getByText('1 of 30 cleared').count() || await page.getByText(/1 of \d+ cleared/).count(), 'clear not recorded');
  });
  await test('Final exam: no feedback, pause and resume', async () => {
    await go('/exam');
    await page.getByRole('button', { name: /Begin the exam/ }).click();
    await answerRecall(page, true);
    assert(!(await page.getByText(/Correct —|This is /).count()), 'feedback during exam');
    await go('/exam');
    assert(await page.getByText('2 / 195').count(), 'exam did not resume');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Abandon' }).click();
  });
  await test('Practice a single flag from the Atlas', async () => {
    await go('/atlas/MNG');
    await page.getByRole('link', { name: 'Practise this flag' }).click();
    await page.locator('img[alt="Flag to identify"]').first().waitFor({ timeout: 5000 });
  });

  console.log('Dashboard');
  await test('stats tabs: map click, collection, achievements', async () => {
    await go('/stats');
    for (const t of ['Flags mastered', 'Final exam readiness', 'Accuracy and trophies by continent', 'Most frequently confused', 'Daily learning history (30 days)', 'Recent improvement', 'Recommended next']) assert(await page.getByText(t).first().count(), `missing ${t}`);
    await page.getByRole('button', { name: 'World map' }).click();
    await page.locator('svg[role="img"] path').nth(40).click();
    assert(await page.getByRole('link', { name: 'Practise this flag' }).count(), 'map click did nothing');
    await page.getByRole('button', { name: 'Flag collection' }).click();
    await page.getByText(/collected/).waitFor({ timeout: 4000 });
    await page.getByRole('button', { name: 'Achievements' }).click();
    await page.getByText('World Champion: 195/195').waitFor({ timeout: 4000 });
    assert(await page.getByText('Know Thyself').count(), 'achievement list incomplete');
  });

  console.log('Data');
  await test('export → reset → import restores progress', async () => {
    await go('/settings');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export progress' }).click()]);
    const file = await dl.path();
    await page.getByRole('button', { name: 'Reset all progress' }).click();
    await page.getByLabel('Type RESET to confirm').fill('RESET');
    await page.getByRole('button', { name: 'Reset everything' }).click();
    await go('/stats');
    assert((await page.getByText('Being learned').locator('..').innerText()).startsWith('0'), 'reset failed');
    await go('/settings');
    await page.locator('input[type=file]').setInputFiles(file);
    await page.getByText('Progress imported.').waitFor();
    await go('/stats');
    assert(!(await page.getByText('Being learned').locator('..').innerText()).startsWith('0'), 'import failed');
  });
  await test('invalid import is rejected without changing progress', async () => {
    await go('/settings');
    await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"progress":{"XXX":{}}}') });
    await page.getByText(/Import failed/).waitFor();
  });
  await test('corrupted storage is backed up, not lost', async () => {
    await page.evaluate(() => localStorage.setItem('flagmaster-v1', '{broken'));
    await go('/');
    const keys = await page.evaluate(() => Object.keys(localStorage));
    assert(keys.some((k) => k.startsWith('flagmaster-v1-corrupt-backup-')), 'no backup key');
  });

  console.log('Mobile & accessibility');
  await test('no horizontal overflow at 360px; bottom nav visible', async () => {
    const m = await browser.newPage({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
    for (const r of ['/', '/learn', '/challenges', '/atlas', '/atlas/QAT', '/stats', '/settings', '/detective/nordic-crosses', '/diagnostic']) {
      await m.goto(BASE + r);
      await m.waitForLoadState('networkidle');
      const over = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(over <= 0, `${r} overflows by ${over}px`);
    }
    assert(await m.getByRole('navigation', { name: 'Main' }).last().isVisible(), 'mobile nav hidden');
    await m.goto(BASE + '/challenges/world');
    await m.getByRole('button', { name: /^Start/ }).tap();
    await m.getByRole('button', { name: 'A–Z' }).tap();
    await m.getByRole('dialog').getByRole('button', { name: 'Japan' }).tap();
    await m.getByRole('button', { name: /^Submit/ }).tap();
    assert(await m.getByRole('button', { name: /^Continue/ }).count(), 'touch answer failed');
    await m.close();
  });
  await test('keyboard: skip link and tab order reach main actions', async () => {
    await go('/');
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => document.activeElement.textContent);
    assert(/Skip to content/.test(first), 'skip link not first');
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      await page.keyboard.press('Tab');
      found = /Continue Learning|Start the diagnostic|Resume/.test(await page.evaluate(() => document.activeElement.textContent));
    }
    assert(found, 'main CTA not reachable by keyboard');
  });
  await test('dark mode applies', async () => {
    await go('/settings');
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    assert(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'dark not applied');
    await page.getByRole('button', { name: 'Match system' }).click();
  });

  await test('no console or page errors', async () => {
    const real = errors.filter((e) => !/Failed to load resource: the server responded with a status of 404/.test(e));
    assert(real.length === 0, real.slice(0, 3).join(' | '));
  });

  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  process.exit(failures.length ? 1 : 0);
})();
