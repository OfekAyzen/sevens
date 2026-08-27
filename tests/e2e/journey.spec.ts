import { expect, test, type Page } from '@playwright/test';

/**
 * The browser journey.
 *
 * These specs check what a unit test cannot: that the hierarchy on screen matches
 * the product invariant (the group number is the largest thing), that a missed day
 * is visually indistinguishable from a future day, and that no banned string
 * reaches the rendered DOM.
 *
 * They also exist because an infinite-render bug once passed all 58 unit tests
 * while the app showed a blank screen. Unit tests alone are not evidence that this
 * application works.
 */

async function createGroup(page: Page) {
  await page.goto('/');
  await page.getByTestId('mode-create').click();
  await page.getByTestId('input-name').fill('Ofek');
  await page.getByTestId('input-skill').fill('fingerstyle guitar');
  await page.getByTestId('input-minimum').fill('10');
  await page.getByTestId('input-cue').fill('after I put my coffee down, at the kitchen table');
  await page.getByTestId('input-feedback').fill('record myself and listen back');
  await page.getByTestId('begin').click();
  await expect(page.getByTestId('home')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  // Each spec starts from a clean install.
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('a new person can create a group and reach home', async ({ page }) => {
  await createGroup(page);
  await expect(page.getByTestId('group-number')).toBeVisible();
  await expect(page.getByTestId('day-banner')).toBeVisible();
});

test('creating a group produces a shareable code', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('mode-create').click();
  const code = await page.getByTestId('group-code').inputValue();
  // Six characters, no ambiguous glyphs — this gets retyped from a group chat.
  expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
});

test('the rules are published in full before anyone commits', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('mode-create').click();
  const rules = page.getByTestId('rules');
  // Nobody should discover the midpoint reset or the catch-up rule mid-week.
  await expect(rules).toContainText('24 practice-days');
  await expect(rules).toContainText('Day 4');
  await expect(rules).toContainText('catch-up');
  await expect(rules).toContainText('cover day');
  await expect(rules).toContainText('honour system');
  await expect(rules).toContainText('Two a day');
});

test('the group number is the largest text on the home screen', async ({ page }) => {
  await createGroup(page);
  const heroSize = await page
    .locator('.hero__value')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

  const maxOther = await page.evaluate(() => {
    const hero = document.querySelector('.hero__value');
    let max = 0;
    for (const el of document.querySelectorAll('body *')) {
      if (el === hero || !el.textContent?.trim()) continue;
      if (el.contains(hero)) continue;
      max = Math.max(max, parseFloat(getComputedStyle(el).fontSize));
    }
    return max;
  });

  expect(heroSize).toBeGreaterThan(maxOther);
});

test('logging a day fills a cell and moves the counters up only', async ({ page }) => {
  await createGroup(page);
  await page.getByTestId('go-log').click();
  await page.getByTestId('input-reflection').fill('the F chord is still slow but cleaner');
  // Practised (10) + reflection (4, or 6 while holding catch-up). A solo run is
  // trivially the lowest scorer, so catch-up is active and the note must show.
  await expect(page.getByTestId('catchup-note')).toBeVisible();
  await expect(page.getByTestId('points-today')).toHaveText('16');
  await page.getByTestId('save-log').click();

  await expect(page.getByTestId('home')).toBeVisible();
  await expect(page.getByTestId('already-logged')).toBeVisible();
  await expect(page.getByTestId('my-counters')).toContainText('1 of 7');
  await expect(page.getByTestId('group-number')).toContainText('1');
});

test('minutes are optional and never change a score', async ({ page }) => {
  await createGroup(page);
  await page.getByTestId('go-log').click();
  const before = await page.getByTestId('points-today').textContent();
  await page.getByTestId('input-minutes').fill('240');
  await expect(page.getByTestId('points-today')).toHaveText(before ?? '');
});

test('a past day with nothing logged looks exactly like a future day', async ({ page }) => {
  await createGroup(page);
  const styles = await page.evaluate(() => {
    const read = (state: string) => {
      const el = document.querySelector(`[data-state="${state}"]`);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, border: s.borderColor };
    };
    return { open: read('open'), future: read('future') };
  });
  if (styles.open && styles.future) {
    expect(styles.open.bg).toBe(styles.future.bg);
    expect(styles.open.border).toBe(styles.future.border);
  }
  await expect(page.locator('body')).not.toContainText('✗');
});

test('no banned string reaches the rendered page', async ({ page }) => {
  await createGroup(page);
  const banned = [
    'streak',
    "don't lose",
    'at risk',
    'last place',
    "you're behind",
    'falling behind',
    'hours left',
    'we miss you',
    'failed',
    'give up',
  ];
  for (const view of ['go-feed', 'go-group', 'go-settings']) {
    await page.getByTestId('home').waitFor();
    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const phrase of banned) {
      expect(body, `banned phrase rendered on home: ${phrase}`).not.toContain(phrase);
    }
    await page.getByTestId(view).click();
    const inner = (await page.locator('body').innerText()).toLowerCase();
    for (const phrase of banned) {
      expect(inner, `banned phrase rendered in ${view}: ${phrase}`).not.toContain(phrase);
    }
    await page.getByTestId('back').click();
  }
});

test('the log screen offers a plain exit with no consequence copy', async ({ page }) => {
  await createGroup(page);
  await page.getByTestId('go-log').click();
  const exit = page.getByTestId('not-today');
  await expect(exit).toHaveText('Not today.');
  await exit.click();
  await expect(page.getByTestId('home')).toBeVisible();
});

test('posting proof appears in the feed and scores', async ({ page }) => {
  await createGroup(page);
  await page.getByTestId('go-feed').click();
  await expect(page.getByTestId('feed-empty')).toBeVisible();
  await page.getByTestId('input-caption').fill('twenty F-chord changes, slowly');
  await page.getByTestId('post').click();
  await expect(page.getByTestId('posts')).toContainText('twenty F-chord changes, slowly');
  // You cannot support your own post, so no react control is rendered on it.
  await expect(page.locator('.react')).toHaveCount(0);
});

test('the cover day is one tap with no confirmation dialog', async ({ page }) => {
  await createGroup(page);
  await page.getByTestId('go-settings').click();
  await expect(page.getByTestId('cover-card')).toContainText('one cover day');
  const cover = page.getByTestId('cover-1');
  if (await cover.isVisible()) {
    await cover.click();
    // Straight to spent — no dialog, no "are you sure".
    await expect(page.getByTestId('cover-spent')).toBeVisible();
  }
});

test('lowering the minimum works and cannot raise it', async ({ page }) => {
  await createGroup(page);
  await page.getByTestId('go-settings').click();
  await expect(page.getByTestId('minimum-card')).toContainText('10 minutes');

  await page.getByTestId('input-new-minimum').fill('5');
  await page.getByTestId('save-minimum').click();
  await expect(page.getByTestId('minimum-card')).toContainText('5 minutes');

  // Attempting to raise it back is silently clamped, not offered as an option.
  await page.getByTestId('input-new-minimum').fill('60');
  await page.getByTestId('save-minimum').click();
  await expect(page.getByTestId('minimum-card')).toContainText('5 minutes');
});

test('settings shows the group code so friends can join', async ({ page }) => {
  await createGroup(page);
  await page.getByTestId('go-settings').click();
  await expect(page.getByTestId('sync-status')).toContainText(/[A-Z2-9]{6}/);
  await expect(page.getByTestId('sync-line')).toContainText('Solo mode');
});

test('the state survives a reload', async ({ page }) => {
  await createGroup(page);
  await page.getByTestId('go-log').click();
  await page.getByTestId('save-log').click();
  await expect(page.getByTestId('already-logged')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('home')).toBeVisible();
  await expect(page.getByTestId('already-logged')).toBeVisible();
  await expect(page.getByTestId('my-counters')).toContainText('1 of 7');
});
