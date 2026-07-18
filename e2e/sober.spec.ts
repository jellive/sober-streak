import { test, expect } from '@playwright/test';

/** 항상 과거인 날짜(로컬 타임존 오차를 감안해 2일 전) — 온보딩 인풋의 max={today} 제약을 안전하게 통과. */
function pastDateISO(daysAgo = 2): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

test('온보딩 → 스트릭 표시 → 새로고침 생존', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('마지막으로 마신 날').fill(pastDateISO());
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.locator('.tabnum').first()).toContainText('일'); // 히어로 렌더
  await page.reload();
  await expect(page.getByText('현재 스트릭')).toBeVisible(); // 온보딩으로 안 돌아감 = 영속
});

test('마심 눌러도 빨간 경고/실패 문구 없음', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('마지막으로 마신 날').fill(pastDateISO());
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByText('현재 스트릭')).toBeVisible();
  // '안 마심' 버튼의 접근성 이름도 '마심'을 부분 문자열로 포함하므로 exact 매칭으로 정확히 구분.
  await page.getByRole('button', { name: '마심', exact: true }).click();
  await expect(page.getByText(/실패|경고|망쳤|다 날아|끝장/)).toHaveCount(0);
});

test('백업 내보내기 파일 생성', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('마지막으로 마신 날').fill(pastDateISO());
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByText('현재 스트릭')).toBeVisible();
  await page.goto('/settings');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '백업 내보내기 (JSON)' }).click(),
  ]);
  expect(download.suggestedFilename()).toContain('sober-streak');
});
