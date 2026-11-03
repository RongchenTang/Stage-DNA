import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scoreAnswers } from '../score.mjs';

const data = JSON.parse(readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));
const allA = Object.fromEntries(data.questions.map(({ id }) => [id, 'A']));

test('scores the two dimensions separately and preserves all ties', () => {
  const result = scoreAnswers(data, allA);
  assert.deepEqual(result.backstageScores, { D: 2, W: 2, M: 2, V: 2, C: 2, X: 2 });
  assert.deepEqual(result.onstageScores, { H: 2, E: 1, T: 1, U: 2 });
  assert.deepEqual(result.backstageGroups, [{ score: 2, ids: ['D', 'W', 'M', 'V', 'C', 'X'] }]);
  assert.deepEqual(result.onstageGroups, [
    { score: 2, ids: ['H', 'U'] },
    { score: 1, ids: ['E', 'T'] },
  ]);
});

test('shows an unambiguous top backstage role when its mapped choices dominate', () => {
  const answers = { ...allA, Q03: 'D', Q04: 'B', Q05: 'C', Q07: 'D', Q09: 'B', Q10: 'C' };
  const result = scoreAnswers(data, answers);
  assert.deepEqual(result.backstageGroups[0], { score: 8, ids: ['D'] });
  assert.equal(Object.values(result.backstageScores).reduce((sum, count) => sum + count, 0), 12);
});

test('keeps singing, movement and dialogue preferences out of type scores', () => {
  const answers = { ...allA, Q19: 'C', Q20: 'B', Q21: 'A' };
  const result = scoreAnswers(data, answers);
  assert.deepEqual(result.preferences, { Q19: 'less', Q20: 'try', Q21: 'like' });
  assert.equal(Object.values(result.backstageScores).reduce((sum, count) => sum + count, 0), 12);
  assert.equal(Object.values(result.onstageScores).reduce((sum, count) => sum + count, 0), 6);
});

test('requires all 21 answers and reports the first missing question', () => {
  const answers = { ...allA };
  delete answers.Q08;
  assert.throws(() => scoreAnswers(data, answers), /Missing answer: Q08/);
});

test('rejects answer keys that the question does not offer', () => {
  assert.throws(() => scoreAnswers(data, { ...allA, Q19: 'D' }), /Invalid answer: Q19/);
});

