import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCardSpec } from '../card.mjs';

const data = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));

test('a share card uses the selected backstage role and onstage style at 9:16', () => {
  const spec = buildCardSpec(data, 'D', 'H');
  assert.equal(spec.width, 1080);
  assert.equal(spec.height, 1920);
  assert.equal(spec.roleName, '舞台掌舵者');
  assert.equal(spec.styleName, '热烈表达型');
  assert.match(spec.imageSrc, /characters-v2\/D\.webp$/);
  assert.ok(spec.colors.background && spec.colors.accent);
});

test('a card cannot silently choose a role or style that does not exist', () => {
  assert.throws(() => buildCardSpec(data, 'Z', 'H'), /Unknown role/);
  assert.throws(() => buildCardSpec(data, 'D', 'Z'), /Unknown style/);
});

test('a share card can carry a nickname and a second interest label', () => {
  const spec = buildCardSpec(data, 'V', 'E', { studentName: '小明', secondaryText: '第二兴趣方向：故事编织者' });
  assert.equal(spec.studentName, '小明');
  assert.equal(spec.secondaryText, '第二兴趣方向：故事编织者');
});

