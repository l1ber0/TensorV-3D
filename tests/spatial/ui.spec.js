import { test, expect } from '@playwright/test';

async function importCode(page, code) {
  await page.goto('/');
  await expect(page.locator('#execution-status')).toContainText('已更新');
  await page.locator('#file-input').setInputFiles({ name: 'spatial.py', mimeType: 'text/x-python', buffer: Buffer.from(code) });
  await expect(page.locator('#execution-status')).toContainText('已更新');
  await page.locator('#tab-spatial').click();
}

test('vectors render, rotate, zoom, and update after editing', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await importCode(page, 'import torch\nv = torch.tensor([[1., 2., 3.], [-2., 1., 0.], [0., 0., 0.]])\n');
  await expect(page.locator('#spatial-summary')).toContainText('3 个向量');
  await expect(page.locator('#spatial-values')).toContainText('v[0] = (1, 2, 3)');
  const canvas = page.locator('#spatial-panel canvas');
  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 90, bounds.y + bounds.height / 2 + 40); await page.mouse.up();
  await page.mouse.wheel(0, -100); await canvas.focus(); await page.keyboard.press('ArrowLeft');
  await page.locator('.cm-content').click(); await page.keyboard.press('Control+a');
  await page.keyboard.insertText('import torch\nv = torch.tensor([4., 5., 6.])\n');
  await expect(page.locator('#spatial-values')).toContainText('v = (4, 5, 6)');
  await page.locator('#share-experiment').click();
  await expect(page.locator('#share-dialog')).toBeVisible();
  await expect(page.locator('#share-error')).toBeHidden();
  await expect(page.locator('#share-link')).not.toHaveValue('');
  await page.locator('#share-dialog [data-close]').click();
  await page.screenshot({ path: 'test-results/spatial-vectors.png' });
  expect(errors).toEqual([]);
});

test('cubes preserve transposed values, slice batches, and clear unsupported data', async ({ page }) => {
  await importCode(page, 'import torch\na = torch.arange(64.).reshape(4,4,4)\nb = a.transpose(0,2)\nc = torch.arange(128.).reshape(2,4,4,4)\n');
  await expect(page.locator('#spatial-summary')).toContainText('64 个方块');
  await page.locator('#spatial-tensor').selectOption('b');
  await expect(page.locator('#spatial-summary')).toContainText('b [4, 4, 4]');
  await page.locator('#spatial-tensor').selectOption('c');
  await page.getByLabel('三维 d0 索引', { exact: true }).fill('1');
  await page.getByLabel('三维 d0 索引', { exact: true }).press('Tab');
  await expect(page.locator('#spatial-panel')).toHaveAttribute('aria-busy', 'false');
  await page.screenshot({ path: 'test-results/spatial-volume.png' });
  await page.locator('#spatial-mode').selectOption('vectors');
  await expect(page.locator('#spatial-summary')).toContainText('向量需要形状');
  await expect(page.locator('#spatial-values')).toBeEmpty();
});
